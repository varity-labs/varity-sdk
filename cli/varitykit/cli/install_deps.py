"""Install project dependencies for VarityKit projects."""

from __future__ import annotations

import json
import os
import subprocess
from pathlib import Path
from typing import List, Tuple

import click
from rich.console import Console
from rich.panel import Panel


_KNOWN_BINS = (
    ("next", "next", "next/dist/bin/next"),
    ("vite", "vite", "vite/bin/vite.js"),
    ("react-scripts", "react-scripts", "react-scripts/bin/react-scripts.js"),
    ("typescript", "tsc", "typescript/bin/tsc"),
)


def _is_usable_binary(path: Path) -> bool:
    try:
        target = path.resolve() if path.is_symlink() else path
        stat = target.stat()
        if stat.st_size <= 0:
            return False
        return os.name == "nt" or bool(stat.st_mode & 0o111)
    except OSError:
        return False


def _binary_health(project_path: Path) -> Tuple[List[str], List[str]]:
    missing: List[str] = []
    corrupt: List[str] = []
    try:
        pkg = json.loads((project_path / "package.json").read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return missing, corrupt

    deps = {}
    deps.update(pkg.get("dependencies", {}))
    deps.update(pkg.get("devDependencies", {}))

    for dep, bin_name, package_bin in _KNOWN_BINS:
        if dep not in deps:
            continue
        bin_path = project_path / "node_modules" / ".bin" / bin_name
        if not bin_path.exists():
            missing.append(bin_name)
            continue
        if not _is_usable_binary(bin_path):
            corrupt.append(bin_name)
            continue
        package_bin_path = project_path / "node_modules" / package_bin
        if not _is_usable_binary(package_bin_path):
            corrupt.append(bin_name)

    return missing, corrupt


def _run(command: List[str], cwd: Path, timeout: int) -> subprocess.CompletedProcess:
    return subprocess.run(
        command,
        cwd=cwd,
        capture_output=True,
        text=True,
        timeout=timeout,
    )


def _install_npm(project_path: Path, packages: Tuple[str, ...]) -> Tuple[bool, str]:
    args = ["npm", "install", *packages, "--bin-links"] if packages else [
        "npm",
        "install",
        "--legacy-peer-deps",
        "--bin-links",
    ]
    result = _run(args, project_path, 300)
    output = (result.stdout + "\n" + result.stderr).strip()

    missing, corrupt = _binary_health(project_path)
    if result.returncode == 0 and not missing and not corrupt:
        return True, output

    if missing or corrupt:
        node_modules = project_path / "node_modules"
        if node_modules.exists():
            import shutil

            shutil.rmtree(node_modules)
        retry = _run(["npm", "install", "--legacy-peer-deps", "--bin-links"], project_path, 300)
        retry_output = (retry.stdout + "\n" + retry.stderr).strip()
        retry_missing, retry_corrupt = _binary_health(project_path)
        if retry.returncode == 0 and not retry_missing and not retry_corrupt:
            return True, retry_output
        output = retry_output or output
        missing, corrupt = retry_missing, retry_corrupt

    if missing or corrupt:
        return False, f"Framework binaries missing/corrupt: {', '.join(missing + corrupt)}\n{output}"
    return False, output


def _install_python(project_path: Path, packages: Tuple[str, ...]) -> Tuple[bool, str]:
    if packages:
        args = ["install", *packages]
    elif (project_path / "requirements.txt").exists():
        args = ["install", "-r", "requirements.txt"]
    else:
        args = ["install", "-e", "."]

    for pip_cmd in ("pip", "pip3"):
        try:
            result = _run([pip_cmd, *args], project_path, 120)
        except FileNotFoundError:
            continue
        output = (result.stdout + "\n" + result.stderr).strip()
        if result.returncode == 0:
            return True, output
    return False, output if "output" in locals() else "pip was not found"


@click.command(name="install-deps")
@click.argument("packages", nargs=-1)
@click.option("--path", "-p", type=click.Path(file_okay=False), default=".")
@click.pass_context
def install_deps(ctx, packages: Tuple[str, ...], path: str) -> None:
    """Install npm or Python dependencies for the current project."""
    console = Console()
    project_path = Path(path).resolve()

    if not project_path.exists():
        raise click.ClickException(f"Project directory does not exist: {project_path}")

    console.print(
        Panel.fit(
            "[bold cyan]Installing dependencies[/bold cyan]\n"
            f"[dim]{project_path}[/dim]",
            border_style="cyan",
        )
    )

    if (project_path / "package.json").exists():
        ok, output = _install_npm(project_path, packages)
        if ok:
            console.print("[green]Dependencies installed successfully.[/green]")
            return
        raise click.ClickException(f"npm install failed:\n{output[-1200:]}")

    python_project = any(
        (project_path / marker).exists()
        for marker in ("requirements.txt", "pyproject.toml", "setup.py", "setup.cfg")
    )
    if python_project:
        ok, output = _install_python(project_path, packages)
        if ok:
            console.print("[green]Python dependencies installed successfully.[/green]")
            return
        raise click.ClickException(f"pip install failed:\n{output[-1200:]}")

    raise click.ClickException(
        "No package.json, requirements.txt, pyproject.toml, setup.py, or setup.cfg found."
    )
