"""
Vercel → Varity migration command.

Non-technical users just say 'migrate this app to Varity' in Claude Code.
The MCP tool calls:
    varitykit migrate --url <github-url>  (one-shot: clone + analyze + apply + deploy)
    varitykit migrate --path <path>       (one-shot with local path)

Power-user escape hatches:
    varitykit migrate analyze <path>    (read-only preview)
    varitykit migrate apply <path>      (transform but don't deploy)
    varitykit migrate rollback <path>   (revert transforms)

The happy path takes under 3 minutes: detect → transform → deploy.
"""

from __future__ import annotations

import json
import os
import re
import subprocess
import tempfile
from pathlib import Path

import click
from rich.console import Console
from rich.panel import Panel
from rich.table import Table

from varitykit.utils.logger import get_logger
from varitykit.migrate import analyze as _analyze
from varitykit.migrate import apply as _apply
from varitykit.migrate.codemods import rollback as _rollback

console = Console()

_GITHUB_URL_RE = re.compile(
    r"^(?:https?://)?(?:www\.)?github\.com/[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+(?:\.git)?/?$|"
    r"^git@github\.com:[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+(?:\.git)?$|"
    r"^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$"
)


def _is_github_url(s: str) -> bool:
    return bool(_GITHUB_URL_RE.match(s.strip()))


def _normalize_github_url(raw: str) -> str:
    """Normalize shorthand GitHub URL forms into an https clone URL."""
    value = raw.strip()
    if not _is_github_url(value):
        raise click.BadParameter(f"Not a valid GitHub URL: {raw}", param_hint="--url")

    if value.startswith("git@github.com:"):
        value = value.replace("git@github.com:", "https://github.com/", 1)
    elif value.startswith("github.com/"):
        value = f"https://{value}"
    elif value.startswith("www.github.com/"):
        value = f"https://{value}"
    elif not value.startswith("http://") and not value.startswith("https://"):
        value = f"https://github.com/{value}"

    if value.startswith("http://"):
        value = "https://" + value[len("http://"):]
    value = value.replace("://www.github.com/", "://github.com/")

    if not value.endswith(".git"):
        value = value.rstrip("/") + ".git"
    return value


def _clone_github_repo(github_url: str) -> str:
    """Shallow-clone `github_url` into a temp directory and return the path."""
    tmp = tempfile.mkdtemp(prefix="varity-migrate-")
    console.print(f"  [dim]Cloning {github_url} ...[/dim]")
    result = subprocess.run(
        ["git", "clone", "--depth=1", github_url, tmp],
        capture_output=True,
        text=True,
        timeout=120,
    )
    if result.returncode != 0:
        err = (result.stderr or result.stdout).strip()
        raise click.ClickException(f"git clone failed: {err}")
    return tmp


@click.group(invoke_without_command=True)
@click.option("--url", "github_url", default=None,
              help="GitHub repository URL to clone and migrate (e.g. https://github.com/user/app)")
@click.option("--path", "project_path", type=click.Path(file_okay=False),
              default=None, help="Local path to the Vercel project (default: current directory)")
@click.option("--dry-run", is_flag=True,
              help="Show what would change without modifying files or deploying")
@click.option("--no-deploy", is_flag=True,
              help="Apply transforms but don't deploy")
@click.option("--name", default=None,
              help="Custom app name for varity.app/{name} when deploying")
@click.pass_context
def migrate(ctx: click.Context, github_url: str | None, project_path: str | None,
            dry_run: bool, no_deploy: bool, name: str | None) -> None:
    """Migrate a Vercel app to Varity.

    Pass a GitHub URL to clone automatically, or --path for a local directory.

    Examples:
      varitykit migrate --url https://github.com/user/my-app   # clone + migrate + deploy
      varitykit migrate --path ./my-app                         # local path
      varitykit migrate                                          # current directory
      varitykit migrate --dry-run                               # preview without changes
      varitykit migrate --no-deploy                             # transform only

    Under the hood:
      1. Scan the repo for Vercel-specific artifacts (vercel.json, @vercel/*
         deps, next.config.js image optimization, edge runtime, env var
         renames).
      2. Apply codemods. Backs up originals to .vercel-migration-backup/.
      3. Deploy via the intelligent orchestration algorithm (varitykit app
         deploy with auto hosting detection).
    """
    # If a subcommand was invoked, defer to it — don't run the one-shot.
    if ctx.invoked_subcommand is not None:
        return

    # Resolve project path: github_url > --path > current directory
    if github_url:
        normalized_url = _normalize_github_url(github_url)
        resolved_path = _clone_github_repo(normalized_url)
    else:
        resolved_path = project_path or "."

    _run_full_migration(resolved_path, dry_run=dry_run, deploy=not no_deploy, name=name)


@migrate.command(name="analyze")
@click.argument("project_path_arg", type=click.Path(file_okay=False),
                default=None, required=False)
@click.option("--path", "project_path_opt", type=click.Path(file_okay=False),
              default=None, help="Path to the project directory (alias for positional argument)")
def analyze_cmd(project_path_arg: str | None, project_path_opt: str | None) -> None:
    """Scan a Vercel project and report what will change. Read-only."""
    project_path = project_path_opt or project_path_arg or "."
    report = _analyze(project_path)
    _render_report(report)


@migrate.command(name="apply")
@click.argument("project_path_arg", type=click.Path(file_okay=False),
                default=None, required=False)
@click.option("--dry-run", is_flag=True)
@click.option("--path", "project_path_opt", type=click.Path(file_okay=False),
              default=None, help="Path to the project directory (alias for positional argument)")
def apply_cmd(project_path_arg: str | None, project_path_opt: str | None, dry_run: bool) -> None:
    """Apply Vercel migration codemods. Does not deploy."""
    project_path = project_path_opt or project_path_arg or "."
    report = _analyze(project_path)
    if not report.has_changes:
        console.print("[green]Nothing to migrate — this app is already Varity-clean.[/green]")
        return
    changes = _apply(report, dry_run=dry_run)
    _render_changes(changes, dry_run=dry_run)


@migrate.command(name="rollback")
@click.argument("project_path_arg", type=click.Path(file_okay=False),
                default=None, required=False)
@click.option("--path", "project_path_opt", type=click.Path(file_okay=False),
              default=None, help="Path to the project directory (alias for positional argument)")
def rollback_cmd(project_path_arg: str | None, project_path_opt: str | None) -> None:
    """Restore files from .vercel-migration-backup/ and remove the backup dir."""
    project_path = project_path_opt or project_path_arg or "."
    restored = _rollback(project_path)
    if not restored:
        console.print(
            "[yellow]No migration backup found — nothing to roll back.[/yellow]"
        )
        return
    console.print(f"[green]Restored {len(restored)} file(s):[/green]")
    for f in restored:
        console.print(f"  • {f}")


# ---------------------------------------------------------------------------
# One-shot implementation
# ---------------------------------------------------------------------------

def _run_full_migration(
    project_path: str,
    dry_run: bool,
    deploy: bool,
    name: str | None = None,
) -> None:
    """Analyze → apply → (optionally) deploy. The non-technical happy path."""
    path = Path(project_path).resolve()
    console.print(Panel(
        f"[bold cyan]Migrating to Varity[/bold cyan]\n[dim]{path}[/dim]",
        border_style="cyan",
    ))

    # 1. Analyze
    console.print("\n[bold]1/4[/bold] Scanning for Vercel-specific artifacts...")
    report = _analyze(path)

    if not report.has_changes:
        console.print("  [green]✓[/green] No Vercel-isms found — this app is already clean.")
    else:
        summary_bits = []
        if report.has_vercel_json:
            summary_bits.append("vercel.json")
        if report.next_config_needs_images_unoptimized:
            summary_bits.append("next.config image optimization")
        if report.vercel_packages_found:
            n = len(report.vercel_packages_found)
            summary_bits.append(f"{n} @vercel/* package{'s' if n != 1 else ''}")
        if report.env_renames_needed:
            summary_bits.append(f"{len(report.env_renames_needed)} env var rename(s)")
        console.print(f"  [yellow]Found: {', '.join(summary_bits)}[/yellow]")

    for warning in report.warnings:
        console.print(f"  [dim yellow]⚠  {warning}[/dim yellow]")

    # 2. Apply
    if report.has_changes:
        console.print(f"\n[bold]2/4[/bold] {'Previewing' if dry_run else 'Applying'} codemods...")
        changes = _apply(report, dry_run=dry_run)
        for f in changes.files_modified:
            console.print(f"  [cyan]~[/cyan] modified: {f.relative_to(path)}")
        for f in changes.files_removed:
            console.print(f"  [red]-[/red] removed: {f.relative_to(path)}")
        for note in changes.notes:
            console.print(f"  [dim]→ {note}[/dim]")
    else:
        console.print("\n[bold]2/4[/bold] [dim]No changes to apply.[/dim]")

    # 3. Verify build (skip for dry-run and no-deploy)
    if deploy and not dry_run:
        console.print("\n[bold]3/4[/bold] Verifying build after codemods...")
        has_build_script = False
        pkg_path = path / "package.json"
        if pkg_path.exists():
            try:
                pkg = json.loads(pkg_path.read_text())
                has_build_script = bool(pkg.get("scripts", {}).get("build"))
            except (json.JSONDecodeError, IOError):
                pass

        if has_build_script:
            build_env = {**os.environ, "NODE_OPTIONS": "--max-old-space-size=4096"}

            # Install dependencies first — freshly cloned repos have no node_modules.
            # --legacy-peer-deps avoids transitive peer-dep conflicts (e.g. TS 6.x).
            console.print("  [dim]Installing dependencies...[/dim]")
            install_result = subprocess.run(
                ["npm", "install", "--legacy-peer-deps"],
                cwd=str(path),
                capture_output=True,
                text=True,
                timeout=300,
                env=build_env,
            )
            if install_result.returncode != 0:
                err = (install_result.stdout + "\n" + install_result.stderr).strip()
                console.print(f"  [red]✗ npm install failed:[/red]\n[dim]{err[-1000:]}[/dim]")
                console.print("\n  [yellow]Rolling back migration changes...[/yellow]")
                _rollback(str(path))
                console.print("  [green]✓[/green] Project restored to original state.")
                raise click.ClickException(
                    "npm install failed — your project has been automatically restored. "
                    "Fix the dependency errors above in your source repo, then try migrating again."
                )

            # Fix executable bits — Linux temp dirs can strip +x from node_modules/.bin/.
            bin_dir = path / "node_modules" / ".bin"
            if bin_dir.exists():
                for entry in bin_dir.iterdir():
                    try:
                        entry.chmod(entry.stat().st_mode | 0o111)
                    except OSError:
                        pass

            build_result = subprocess.run(
                ["npm", "run", "build"],
                cwd=str(path),
                capture_output=True,
                text=True,
                timeout=300,
                env=build_env,
            )
            if build_result.returncode != 0:
                console.print("  [red]✗ Build failed:[/red]")
                output = (build_result.stdout + "\n" + build_result.stderr).strip()
                console.print(f"\n[dim]{output[-2000:]}[/dim]")
                console.print("\n  [yellow]Rolling back migration changes...[/yellow]")
                _rollback(str(path))
                console.print("  [green]✓[/green] Project restored to original state.")
                raise click.ClickException(
                    "Build failed after migration — your project has been automatically "
                    "restored. Fix the errors above in your source repo, then try migrating again."
                )
            console.print("  [green]✓[/green] Build passed")
        else:
            console.print("  [dim]No build script found — skipping build check.[/dim]")
    else:
        console.print(
            "\n[bold]3/4[/bold] [dim]Skipped build"
            f" ({'dry-run' if dry_run else '--no-deploy'}).[/dim]"
        )

    # 4. Deploy
    if not deploy or dry_run:
        console.print(
            "\n[bold]4/4[/bold] [dim]Skipped deploy"
            f" ({'dry-run' if dry_run else '--no-deploy'}). "
            "Run [cyan]varitykit app deploy[/cyan] when ready.[/dim]"
        )
        return

    if report.needs_multi_service_deploy:
        console.print(
            "\n[bold]4/4[/bold] [yellow]Multi-service repo detected — "
            "deploying frontend only.[/yellow]"
        )
        console.print(
            f"  [dim]Backend ({report.backend_framework}) in /backend must be "
            "deployed separately for now.[/dim]"
        )

    console.print("\n[bold]4/4[/bold] Deploying via intelligent orchestration...")
    # Defer to the existing `varitykit app deploy` machinery.
    from varitykit.commands.app_deploy import deploy as app_deploy_cmd
    ctx = click.Context(app_deploy_cmd)
    ctx.ensure_object(dict)
    ctx.obj["logger"] = get_logger()
    previous_strict_flag = os.environ.get("VARITYKIT_STRICT_PUBLIC_URL_200")
    os.environ["VARITYKIT_STRICT_PUBLIC_URL_200"] = "1"
    try:
        ctx.invoke(
            app_deploy_cmd,
            hosting="auto",
            path=str(path),
            name=name,
        )
    except SystemExit as e:
        if e.code not in (0, None):
            raise
    finally:
        if previous_strict_flag is None:
            os.environ.pop("VARITYKIT_STRICT_PUBLIC_URL_200", None)
        else:
            os.environ["VARITYKIT_STRICT_PUBLIC_URL_200"] = previous_strict_flag


# ---------------------------------------------------------------------------
# Rendering
# ---------------------------------------------------------------------------

def _render_report(report) -> None:
    console.print(Panel(
        f"[bold cyan]Vercel Migration Analysis[/bold cyan]\n"
        f"[dim]{report.project_path}[/dim]",
        border_style="cyan",
    ))

    if not report.has_changes:
        console.print("\n[green]✓ No Vercel-specific artifacts detected.[/green]")
        console.print("  This app is already in a Varity-compatible shape.")
        return

    table = Table(show_header=True, header_style="bold")
    table.add_column("Artifact")
    table.add_column("Action")
    table.add_column("Detail", overflow="fold")

    if report.has_vercel_json:
        table.add_row("vercel.json", "Remove", "Backed up; not used by Akash")

    if report.next_config_needs_images_unoptimized and report.next_config_path:
        detail = f"Add images.unoptimized = true to {report.next_config_path.name}"
        table.add_row("next.config.js", "Patch", detail)

    for pkg, replacement in report.vercel_package_replacements.items():
        action = "Remove"
        detail = f"Use {replacement}" if replacement else "No replacement needed"
        table.add_row(pkg, action, detail)

    for old, new in report.env_renames_needed.items():
        table.add_row(f"env: {old}", "Rename", f"→ {new}")

    console.print(table)

    if report.warnings:
        console.print("\n[bold yellow]Warnings:[/bold yellow]")
        for w in report.warnings:
            console.print(f"  [yellow]⚠[/yellow] {w}")


def _render_changes(changes, dry_run: bool) -> None:
    verb = "Would change" if dry_run else "Changed"
    console.print(f"\n[bold]{verb}:[/bold]")
    for f in changes.files_modified:
        console.print(f"  [cyan]~[/cyan] {f}")
    for f in changes.files_removed:
        console.print(f"  [red]-[/red] {f}")
    for f in changes.files_created:
        console.print(f"  [green]+[/green] {f}")
    if changes.package_json_changes:
        console.print("\n[bold]package.json:[/bold]")
        for pkg, replacement in changes.package_json_changes.items():
            console.print(f"  removed {pkg} → {replacement}")
    if changes.env_changes:
        console.print("\n[bold]Env var renames:[/bold]")
        for fname, renames in changes.env_changes.items():
            for old, new in renames.items():
                console.print(f"  {fname}: {old} → {new}")
    if changes.notes:
        console.print("\n[bold]Notes:[/bold]")
        for note in changes.notes:
            console.print(f"  • {note}")
    if not changes.has_changes:
        console.print("  [dim](no changes)[/dim]")
