"""
Codemods that transform a Vercel repo into a Varity-deployable repo.

Each transform is:
  - Targeted (touches one Vercel-ism)
  - Idempotent (re-running doesn't break)
  - Reversible (original files are backed up to .vercel-migration-backup/)

The apply() entry point orchestrates them based on a MigrationReport.
"""

from __future__ import annotations

import json
import re
import shutil
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, List, Optional

from varitykit.migrate.detector import MigrationReport


BACKUP_DIR_NAME = ".vercel-migration-backup"

# Source file extensions to scan for @vercel/* import statements.
_SOURCE_EXTS = frozenset({".ts", ".tsx", ".js", ".jsx", ".mjs"})
# Directories skipped when scanning for imports.
_SKIP_DIRS = frozenset({"node_modules", ".next", ".git", "dist", "build", BACKUP_DIR_NAME})

# Analytics-only packages whose JSX components can be safely erased (no API usage).
_ANALYTICS_COMPONENTS: Dict[str, List[str]] = {
    "@vercel/analytics": ["Analytics"],
    "@vercel/speed-insights": ["SpeedInsights"],
}

# Matches every common import-statement form that references an @vercel/* package.
# Groups 1-4 capture the package specifier from the four alternation branches:
#   1. Named (single or multi-line):  import [type] { ... } from '...'
#   2. Default [+ named]:             import X [, { ... }] from '...'
#   3. Namespace:                     import * as X from '...'
#   4. Side-effect:                   import '...'
#   5. CommonJS require:              const x = require('...')
#   6. Re-export:                     export { ... } from '...'
# [^}]* matches across newlines, so multi-line destructures are covered.
_VERCEL_IMPORT_RE = re.compile(
    r"^[ \t]*import\s+(?:type\s+)?\{[^}]*\}\s*from\s+['\"](@vercel/[^'\"]+)['\"];?[ \t]*\n?"
    r"|^[ \t]*import\s+(?:type\s+)?[\w$]+(?:\s*,\s*\{[^}]*\})?\s+from\s+['\"](@vercel/[^'\"]+)['\"];?[ \t]*\n?"
    r"|^[ \t]*import\s+\*\s+as\s+[\w$]+\s+from\s+['\"](@vercel/[^'\"]+)['\"];?[ \t]*\n?"
    r"|^[ \t]*import\s+['\"](@vercel/[^'\"]+)['\"];?[ \t]*\n?"
    r"|^[ \t]*(?:const|let|var)\s+[^=\n]+=\s+require\(['\"](@vercel/[^'\"]+)['\"]\);?[ \t]*\n?"
    r"|^[ \t]*export\s+(?:type\s+)?(?:\{[^}]*\}|\*)\s+from\s+['\"](@vercel/[^'\"]+)['\"];?[ \t]*\n?",
    re.MULTILINE,
)


@dataclass
class AppliedChanges:
    """Records what a migration run did — used to render diffs and to roll
    back. Ordering matters: files_removed + files_modified are replayed in
    reverse on rollback."""
    project_path: Path
    files_modified: List[Path] = field(default_factory=list)
    files_removed: List[Path] = field(default_factory=list)
    files_created: List[Path] = field(default_factory=list)
    package_json_changes: Dict[str, str] = field(default_factory=dict)
    env_changes: Dict[str, Dict[str, str]] = field(default_factory=dict)
    notes: List[str] = field(default_factory=list)

    @property
    def has_changes(self) -> bool:
        return bool(
            self.files_modified
            or self.files_removed
            or self.files_created
            or self.package_json_changes
            or self.env_changes
        )


def apply(report: MigrationReport, dry_run: bool = False) -> AppliedChanges:
    """Apply every migration implied by `report`.

    If `dry_run` is True, compute the changes but don't write them. Useful
    for the CLI's `analyze` command to show a preview.

    Returns an `AppliedChanges` describing what was done (or would be done).
    """
    changes = AppliedChanges(project_path=report.project_path)
    if not dry_run:
        _ensure_backup_dir(report.project_path)

    if report.has_vercel_json:
        _remove_vercel_json(report, changes, dry_run)

    if report.next_config_path and (
        report.next_config_needs_images_unoptimized
        or report.next_config_has_edge_runtime
        or report.next_config_needs_standalone
    ):
        _patch_next_config(report, changes, dry_run)

    if report.next_config_path:
        _patch_next_tsconfig(report, changes, dry_run)

    if report.vercel_packages_found:
        _remove_vercel_packages(report, changes, dry_run)

    if report.env_renames_needed:
        _rename_env_vars(report, changes, dry_run)

    return changes


# ---------------------------------------------------------------------------
# Individual transforms
# ---------------------------------------------------------------------------

def _remove_vercel_json(
    report: MigrationReport,
    changes: AppliedChanges,
    dry_run: bool,
) -> None:
    """Move vercel.json into the backup dir. Its headers/redirects should be
    reimplemented in next.config.js (out of scope for v1 — we warn)."""
    src = report.project_path / "vercel.json"
    if not dry_run:
        _backup_and_remove(src, report.project_path)
    changes.files_removed.append(src)
    # Warn if the user had custom headers/redirects that we'd be losing silently
    if report.vercel_json_content:
        had_custom = any(
            report.vercel_json_content.get(k)
            for k in ("headers", "redirects", "rewrites")
        )
        if had_custom:
            changes.notes.append(
                "vercel.json had custom headers/redirects/rewrites — these were "
                "backed up to .vercel-migration-backup/. Re-add them to "
                "next.config.js if needed."
            )


def _patch_next_config(
    report: MigrationReport,
    changes: AppliedChanges,
    dry_run: bool,
) -> None:
    """Apply all next.config transforms in a single read/write pass.

    Three transforms in order:
      1. images.unoptimized: true  — Akash has no Vercel image CDN
      2. Strip experimental.runtime: 'edge'  — unsupported on Akash
      3. output: 'standalone'  — required for Akash containers to serve HTTP
    """
    config_path = report.next_config_path
    assert config_path is not None

    original = config_path.read_text(encoding="utf-8")
    patched = original

    if report.next_config_needs_images_unoptimized:
        patched = _apply_unoptimized_transform(patched)

    if report.next_config_has_edge_runtime:
        patched = _apply_edge_runtime_strip(patched)
        changes.notes.append(
            "Removed experimental.runtime='edge' from next.config — "
            "Akash runs standard Node.js, not Vercel's edge runtime."
        )

    if report.next_config_needs_standalone:
        patched = _apply_standalone_inject(patched)

    if patched == original:
        return

    if not dry_run:
        _backup(config_path, config_path.parent)
        config_path.write_text(patched, encoding="utf-8")
    changes.files_modified.append(config_path)


def _apply_unoptimized_transform(content: str) -> str:
    """Pure-function regex transform on next.config content."""
    # Case 2: exists but set to a falsy value → flip to true
    content = re.sub(
        r"(unoptimized\s*:\s*)(?:false|0|null|undefined)",
        r"\1true",
        content,
    )

    # If we already set it true, done.
    if re.search(r"unoptimized\s*:\s*true", content):
        return content

    # Case 1: `images: {` exists → inject the key right after the opening brace
    images_block = re.search(r"(images\s*:\s*\{)", content)
    if images_block:
        insert_pos = images_block.end()
        return (
            content[:insert_pos]
            + "\n    unoptimized: true,"
            + content[insert_pos:]
        )

    # Case 3: no images block at all → inject one into the main config object.
    result = _inject_property_into_config_object(
        content,
        "images: {\n    unoptimized: true,\n  },",
    )
    if result != content:
        return result

    # Case 4: wrapper config with no argument, e.g. `module.exports = withNextra()`.
    result = _inject_empty_wrapper_config(
        content,
        "{\n  images: {\n    unoptimized: true,\n  },\n}",
    )
    if result != content:
        return result

    return content + (
        "\n\n// VARITY MIGRATION NOTE: could not auto-inject images.unoptimized = true.\n"
        "// Add this to your next.config images block manually:\n"
        "//   images: { unoptimized: true, ... }\n"
    )


def _apply_edge_runtime_strip(content: str) -> str:
    """Remove experimental.runtime: 'edge' from next.config content.

    Two cases:
      1. The entire experimental block contains only runtime: 'edge' → drop the block.
      2. The experimental block has other keys → strip just the runtime line.
    """
    # Case 1: experimental block is solely runtime: 'edge'
    result = re.sub(
        r"\s*experimental\s*:\s*\{\s*runtime\s*:\s*['\"]edge['\"]\s*,?\s*\}\s*,?",
        "",
        content,
        flags=re.DOTALL,
    )
    if result != content:
        return result

    # Case 2: experimental has other keys — remove only the runtime line
    result = re.sub(r"[ \t]*runtime\s*:\s*['\"]edge['\"]\s*,?\n?", "", content)
    return result


def _apply_standalone_inject(content: str) -> str:
    """Inject output: 'standalone' into next.config if absent.

    Standalone mode is required for Akash containers — without it Next.js
    has no self-contained server entry-point and the container serves 503.

    Uses brace-balance counting to find the top-level config object's closing
    brace and injects before it. Handles both `const X = { ... }` and
    `module.exports = { ... }` forms.
    """
    if re.search(r"output\s*:\s*['\"]standalone['\"]", content):
        return content  # idempotent

    result = _inject_property_into_config_object(content, "output: 'standalone',")
    if result != content:
        return result

    result = _inject_empty_wrapper_config(content, "{\n  output: 'standalone',\n}")
    if result != content:
        return result

    return content + (
        "\n\n// VARITY MIGRATION NOTE: could not auto-inject output: 'standalone'.\n"
        "// Add this to your next.config manually:\n"
        "//   output: 'standalone',\n"
    )


def _inject_property_into_config_object(content: str, property_text: str) -> str:
    """Inject a top-level property into common Next config object shapes."""
    open_res = (
        r"const\s+\w+\s*=\s*\{",
        r"module\.exports\s*=\s*\{",
        r"\bexport\s+default\s+\{",
        r"module\.exports\s*=\s*[A-Za-z_$][\w$]*\s*\(\s*\{",
        r"\bexport\s+default\s+[A-Za-z_$][\w$]*\s*\(\s*\{",
    )
    for open_re in open_res:
        match = re.search(open_re, content)
        if not match:
            continue
        open_idx = match.end() - 1
        depth = 0
        for i in range(open_idx, len(content)):
            if content[i] == "{":
                depth += 1
            elif content[i] == "}":
                depth -= 1
                if depth == 0:
                    prefix = _object_injection_prefix(content, i)
                    return content[:i] + f"{prefix}{property_text}\n" + content[i:]
    return content


def _inject_empty_wrapper_config(content: str, config_text: str) -> str:
    """Turn `module.exports = withX()` into `module.exports = withX({...})`."""
    patterns = (
        r"(module\.exports\s*=\s*[A-Za-z_$][\w$]*\s*)\(\s*\)",
        r"(\bexport\s+default\s+[A-Za-z_$][\w$]*\s*)\(\s*\)",
    )
    for pattern in patterns:
        result = re.sub(pattern, rf"\1({config_text})", content, count=1)
        if result != content:
            return result
    return content


def _object_injection_prefix(content: str, close_idx: int) -> str:
    """Return indentation/comma prefix for adding a property before `}`."""
    before = content[:close_idx].rstrip()
    if not before or before[-1] in "{,;":
        return "  "
    return ",\n  "


def _patch_next_tsconfig(
    report: MigrationReport,
    changes: AppliedChanges,
    dry_run: bool,
) -> None:
    """Normalize stale Next.js TypeScript defaults that now fail clean builds.

    Older Next projects often carry `"target": "es5"`. Current TypeScript can
    reject that during migration because Next auto-installs the latest
    TypeScript before building. ES2017 is the current Next-compatible baseline
    used by Varity templates and avoids a migration-only compile failure.
    """
    tsconfig_path = report.project_path / "tsconfig.json"
    if not tsconfig_path.exists():
        return

    try:
        data = json.loads(tsconfig_path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, IOError):
        return

    compiler_options = data.get("compilerOptions")
    if not isinstance(compiler_options, dict):
        return

    target = compiler_options.get("target")
    if not isinstance(target, str) or target.lower() != "es5":
        return

    compiler_options["target"] = "ES2017"

    if not dry_run:
        _backup(tsconfig_path, report.project_path)
        tsconfig_path.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
    if tsconfig_path not in changes.files_modified:
        changes.files_modified.append(tsconfig_path)
    changes.notes.append("Updated tsconfig target from ES5 to ES2017 for modern Next.js builds.")


def _remove_vercel_packages(
    report: MigrationReport,
    changes: AppliedChanges,
    dry_run: bool,
) -> None:
    """Strip @vercel/* from package.json deps. Records recommended
    replacements in `changes.notes` for the human."""
    pkg_path = report.project_path / "package.json"
    if not pkg_path.exists():
        return

    try:
        data = json.loads(pkg_path.read_text())
    except (json.JSONDecodeError, IOError):
        return

    removed = []
    for section in ("dependencies", "devDependencies"):
        deps = data.get(section, {})
        for vercel_pkg in list(deps.keys()):
            if vercel_pkg in report.vercel_packages_found:
                del deps[vercel_pkg]
                removed.append(vercel_pkg)

    if not removed:
        return

    if not dry_run:
        _backup(pkg_path, report.project_path)
        pkg_path.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")

    changes.files_modified.append(pkg_path)
    for pkg_name in removed:
        replacement = report.vercel_package_replacements.get(pkg_name)
        changes.package_json_changes[pkg_name] = replacement or "(removed)"
        if replacement:
            changes.notes.append(
                f"Removed {pkg_name}. Switch to {replacement} and update import statements."
            )

    # Remove (or stub) the corresponding import statements in source files.
    _remove_vercel_source_imports(
        project_path=report.project_path,
        removed_packages=removed,
        replacements={p: report.vercel_package_replacements.get(p) for p in removed},
        changes=changes,
        dry_run=dry_run,
    )


def _rename_env_vars(
    report: MigrationReport,
    changes: AppliedChanges,
    dry_run: bool,
) -> None:
    """Rewrite .env* files to rename Vercel-injected keys to Varity conventions.

    We rename, not remove — the VALUE is the user's data (a real postgres URL,
    for example). Varity's sidecar wiring will clobber it with our managed
    URL at deploy time (that's Phase 4's _is_user_env_key filter doing its
    job), but leaving the renamed key in .env keeps the code working in local
    dev if the user points to a local DB.
    """
    env_files = [
        ".env.varity", ".env.local", ".env",
        ".env.production", ".env.development",
    ]
    for fname in env_files:
        env_file = report.project_path / fname
        if not env_file.exists():
            continue
        try:
            original = env_file.read_text(encoding="utf-8")
        except IOError:
            continue

        new_text = original
        file_changes: Dict[str, str] = {}
        for old, new in report.env_renames_needed.items():
            pattern = re.compile(
                rf"(?m)^(\s*(?:export\s+)?){re.escape(old)}(=)"
            )
            if pattern.search(new_text):
                new_text = pattern.sub(rf"\1{new}\2", new_text)
                file_changes[old] = new

        if file_changes and new_text != original:
            if not dry_run:
                _backup(env_file, report.project_path)
                env_file.write_text(new_text, encoding="utf-8")
            changes.files_modified.append(env_file)
            changes.env_changes[fname] = file_changes


# ---------------------------------------------------------------------------
# Source-file import cleanup
# ---------------------------------------------------------------------------

def _base_pkg(specifier: str) -> str:
    """'@vercel/analytics/react' → '@vercel/analytics'"""
    parts = specifier.split("/")
    return "/".join(parts[:2])


def _strip_vercel_imports(
    content: str,
    removed_set: "set[str]",
    replacements: Dict[str, Optional[str]],
) -> str:
    """Pure function: remove @vercel/* import lines from source text.

    - Packages with no replacement (analytics, speed-insights, edge …):
      import line dropped silently; JSX component tags also erased.
    - Packages with a replacement hint (blob, kv, postgres …):
      import replaced with a TODO comment so the build error is clear.
    """
    def _replacer(m: re.Match) -> str:
        specifier = (
            m.group(1)
            or m.group(2)
            or m.group(3)
            or m.group(4)
            or m.group(5)
            or m.group(6)
        )
        if not specifier:
            return m.group(0)
        base = _base_pkg(specifier)
        if base not in removed_set:
            return m.group(0)
        hint = replacements.get(base)
        if hint:
            trailing = "\n" if m.group(0).endswith("\n") else ""
            return f"// TODO(varity-migrate): Replace {base} — use {hint}{trailing}"
        return ""  # analytics/speed-insights etc. — drop silently

    patched = _VERCEL_IMPORT_RE.sub(_replacer, content)

    # Remove JSX self-closing tags for no-replacement (analytics-only) packages.
    for pkg in removed_set:
        if replacements.get(pkg) is not None:
            continue
        for component in _ANALYTICS_COMPONENTS.get(pkg, []):
            patched = re.sub(rf"[ \t]*<{re.escape(component)}\s*/>\n?", "", patched)

    return patched


def _remove_vercel_source_imports(
    project_path: Path,
    removed_packages: List[str],
    replacements: Dict[str, Optional[str]],
    changes: AppliedChanges,
    dry_run: bool,
) -> None:
    """Walk source files and strip import statements for removed @vercel/* packages."""
    removed_set = set(removed_packages)

    for src_file in project_path.rglob("*"):
        if not src_file.is_file():
            continue
        if any(part in _SKIP_DIRS for part in src_file.parts):
            continue
        if src_file.suffix not in _SOURCE_EXTS:
            continue

        try:
            original = src_file.read_text(encoding="utf-8", errors="ignore")
        except IOError:
            continue

        if not any(f"@vercel/" in original for _ in [None]):
            continue

        patched = _strip_vercel_imports(original, removed_set, replacements)
        if patched == original:
            continue

        if not dry_run:
            _backup(src_file, project_path)
            src_file.write_text(patched, encoding="utf-8")
        if src_file not in changes.files_modified:
            changes.files_modified.append(src_file)


# ---------------------------------------------------------------------------
# Backup helpers (rollback support)
# ---------------------------------------------------------------------------

def _ensure_backup_dir(project_root: Path) -> Path:
    backup = project_root / BACKUP_DIR_NAME
    backup.mkdir(parents=True, exist_ok=True)
    return backup


def _backup(src: Path, project_root: Path) -> Path:
    """Copy `src` into the backup dir, mirroring its relative path.

    First-write-wins: if a backup already exists, skip the copy to preserve
    the true original when multiple transforms run in sequence.
    """
    backup_root = _ensure_backup_dir(project_root)
    try:
        rel = src.relative_to(project_root)
    except ValueError:
        rel = Path(src.name)
    dest = backup_root / rel
    dest.parent.mkdir(parents=True, exist_ok=True)
    if not dest.exists():
        shutil.copy2(src, dest)
    return dest


def _backup_and_remove(src: Path, project_root: Path) -> Path:
    """Copy to backup, then delete the original. Rollback restores the copy."""
    dest = _backup(src, project_root)
    src.unlink()
    return dest


def rollback(project_path: str | Path) -> List[Path]:
    """Restore every file from the backup dir back to its original location,
    then remove the backup dir. Returns paths restored.

    Idempotent — calling rollback with no backup dir is a no-op."""
    root = Path(project_path)
    backup = root / BACKUP_DIR_NAME
    if not backup.exists():
        return []

    restored: List[Path] = []
    for src in backup.rglob("*"):
        if not src.is_file():
            continue
        rel = src.relative_to(backup)
        dest = root / rel
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dest)
        restored.append(dest)

    shutil.rmtree(backup)
    return restored
