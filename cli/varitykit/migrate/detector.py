"""
Vercel project detection — scans a repo and reports every Vercel-specific
artifact we know how to migrate (or flag).

Ground truth comes from real Vercel projects, not the Vercel docs. The full
list evolves as we encounter new patterns in migrants' repos.
"""

from __future__ import annotations

import json
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, List, Optional


# Packages Vercel publishes that become dead weight on Akash. Each maps to a
# replacement recommendation; None means 'just remove, no substitute needed'.
_VERCEL_PACKAGE_MIGRATIONS: Dict[str, Optional[str]] = {
    "@vercel/postgres": "pg",
    "@vercel/kv": "redis (ioredis)",
    "@vercel/blob": "S3-compatible storage (future: native support)",
    "@vercel/analytics": None,
    "@vercel/speed-insights": None,
    "@vercel/og": None,  # lost — app should pre-generate OG images or use Satori
    "@vercel/edge": None,  # edge runtime not on Akash
    "@vercel/edge-config": None,
}

# Env var renames — Vercel pushes these into the process env; on Akash the
# equivalent comes from the sidecar wiring (DATABASE_URL from postgres, etc.).
_VERCEL_ENV_RENAMES: Dict[str, str] = {
    "POSTGRES_URL": "DATABASE_URL",
    "POSTGRES_PRISMA_URL": "DATABASE_URL",
    "POSTGRES_URL_NON_POOLING": "DATABASE_URL",
    "KV_URL": "REDIS_URL",
    "KV_REST_API_URL": "REDIS_URL",
    # Vercel platform-injected vars — rename to generic equivalents
    "VERCEL_URL": "NEXT_PUBLIC_APP_URL",
    "VERCEL_ENV": "NODE_ENV",
    "VERCEL_GIT_COMMIT_SHA": "GIT_COMMIT_SHA",
}


@dataclass
class MigrationReport:
    """What a Vercel repo needs in order to run on Varity/Akash.

    A `MigrationReport` is a machine-readable description of the delta —
    `apply()` consumes this to execute codemods; the CLI's `analyze` command
    renders it for the user.
    """
    project_path: Path

    # Files
    has_vercel_json: bool = False
    vercel_json_content: Optional[dict] = None

    next_config_path: Optional[Path] = None
    next_config_needs_images_unoptimized: bool = False
    next_config_needs_standalone: bool = False
    next_config_has_edge_runtime: bool = False

    # Dependencies
    vercel_packages_found: Dict[str, str] = field(default_factory=dict)
    # package_name -> replacement_hint (None for no substitute)
    vercel_package_replacements: Dict[str, Optional[str]] = field(default_factory=dict)

    # Env vars (scanned from .env files)
    env_renames_needed: Dict[str, str] = field(default_factory=dict)

    # Structural signals
    has_backend_directory: bool = False
    backend_framework: Optional[str] = None  # "fastapi" / "express" / "unknown"
    has_edge_runtime_usage: bool = False
    edge_runtime_file_hits: List[Path] = field(default_factory=list)

    # Diagnostics for the human-facing report
    warnings: List[str] = field(default_factory=list)

    @property
    def has_changes(self) -> bool:
        """True if ANY migration is needed."""
        return bool(
            self.has_vercel_json
            or self.next_config_needs_images_unoptimized
            or self.next_config_needs_standalone
            or self.next_config_has_edge_runtime
            or self.vercel_packages_found
            or self.env_renames_needed
        )

    @property
    def needs_multi_service_deploy(self) -> bool:
        """True if the repo has a separate backend service we can't migrate
        in a single-service deploy."""
        return self.has_backend_directory


def analyze(project_path: str | Path) -> MigrationReport:
    """Scan a Vercel project and produce a migration report.

    Read-only. Does not modify the filesystem.
    """
    path = Path(project_path)
    report = MigrationReport(project_path=path)

    if not path.exists():
        raise FileNotFoundError(f"Project path not found: {path}")

    # vercel.json
    vercel_json = path / "vercel.json"
    if vercel_json.exists():
        report.has_vercel_json = True
        try:
            report.vercel_json_content = json.loads(vercel_json.read_text())
        except (json.JSONDecodeError, IOError):
            report.warnings.append("vercel.json exists but couldn't be parsed")

    # next.config.{js,mjs,ts}
    for ext in ("js", "mjs", "ts"):
        config = path / f"next.config.{ext}"
        if config.exists():
            report.next_config_path = config
            try:
                content = config.read_text(encoding="utf-8")
                if not _next_config_has_unoptimized_images(content):
                    report.next_config_needs_images_unoptimized = True
                if not _next_config_has_standalone(content):
                    report.next_config_needs_standalone = True
                if _next_config_has_experimental_edge_runtime(content):
                    report.next_config_has_edge_runtime = True
                    report.warnings.append(
                        "next.config.js sets experimental.runtime='edge' which is not "
                        "supported on Akash — the codemod will remove it."
                    )
            except IOError:
                pass
            break

    # package.json — Vercel packages
    pkg = path / "package.json"
    if pkg.exists():
        try:
            data = json.loads(pkg.read_text())
            all_deps: Dict[str, str] = {}
            all_deps.update(data.get("dependencies", {}))
            all_deps.update(data.get("devDependencies", {}))
            for pkg_name, replacement in _VERCEL_PACKAGE_MIGRATIONS.items():
                if pkg_name in all_deps:
                    report.vercel_packages_found[pkg_name] = all_deps[pkg_name]
                    report.vercel_package_replacements[pkg_name] = replacement
        except (json.JSONDecodeError, IOError):
            report.warnings.append("package.json exists but couldn't be parsed")

    # Env var renames — scan the common .env files
    report.env_renames_needed = _scan_env_renames(path)

    # Edge runtime — quick grep across .ts/.tsx/.js files
    report.edge_runtime_file_hits = _find_edge_runtime_hits(path)
    report.has_edge_runtime_usage = bool(report.edge_runtime_file_hits)
    if report.has_edge_runtime_usage:
        report.warnings.append(
            f"Edge runtime detected in {len(report.edge_runtime_file_hits)} file(s). "
            "Akash doesn't support edge runtime — these routes will run as standard Node."
        )

    # Backend detection — separate app-level service in a subdirectory
    backend = path / "backend"
    if backend.is_dir():
        report.has_backend_directory = True
        if (backend / "requirements.txt").exists() or (backend / "pyproject.toml").exists():
            # Sniff for framework hint
            reqs_text = ""
            for f in ("requirements.txt", "pyproject.toml"):
                p = backend / f
                if p.exists():
                    try:
                        reqs_text += p.read_text().lower()
                    except IOError:
                        pass
            if "fastapi" in reqs_text:
                report.backend_framework = "fastapi"
            elif "django" in reqs_text:
                report.backend_framework = "django"
            elif "flask" in reqs_text:
                report.backend_framework = "flask"
            else:
                report.backend_framework = "python"
        elif (backend / "package.json").exists():
            report.backend_framework = "node"
        else:
            report.backend_framework = "unknown"
        report.warnings.append(
            f"Detected a separate backend service in /backend (framework: "
            f"{report.backend_framework}). v1 migration deploys the frontend only; "
            "deploy the backend separately or wait for multi-service migration."
        )

    return report


def _next_config_has_unoptimized_images(content: str) -> bool:
    """True if next.config already sets images.unoptimized = true."""
    return bool(re.search(r"unoptimized\s*:\s*true", content))


def _next_config_has_standalone(content: str) -> bool:
    """True if next.config already sets output: 'standalone'."""
    return bool(re.search(r"output\s*:\s*['\"]standalone['\"]", content))


def _next_config_has_experimental_edge_runtime(content: str) -> bool:
    """True if next.config sets runtime: 'edge' (experimental block or top-level)."""
    return bool(re.search(r"runtime\s*:\s*['\"]edge['\"]", content))


_ENV_FILES = (".env.varity", ".env.local", ".env", ".env.production", ".env.development")


def _scan_env_renames(project_path: Path) -> Dict[str, str]:
    """Return {old_name: new_name} for every Vercel-injected env key found."""
    renames: Dict[str, str] = {}
    for fname in _ENV_FILES:
        env_file = project_path / fname
        if not env_file.exists():
            continue
        try:
            text = env_file.read_text()
        except IOError:
            continue
        for line in text.splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key = line.split("=", 1)[0].strip()
            if key.startswith("export "):
                key = key[len("export "):].strip()
            if key in _VERCEL_ENV_RENAMES:
                renames[key] = _VERCEL_ENV_RENAMES[key]
    return renames


def _find_edge_runtime_hits(project_path: Path) -> List[Path]:
    """Scan .ts/.tsx/.js files for `export const runtime = 'edge'`.

    Capped at 100 files/matches to avoid runaway scans on huge monorepos.
    The exact location matters less than the count — the warning is generic.
    """
    hits: List[Path] = []
    pattern = re.compile(r"export\s+const\s+runtime\s*=\s*['\"]edge['\"]")
    skip_dirs = {"node_modules", ".next", ".git", "dist", "build"}
    count = 0
    for candidate in project_path.rglob("*"):
        if count >= 100:
            break
        if not candidate.is_file():
            continue
        if any(part in skip_dirs for part in candidate.parts):
            continue
        if candidate.suffix not in (".ts", ".tsx", ".js", ".jsx", ".mjs"):
            continue
        try:
            content = candidate.read_text(encoding="utf-8", errors="ignore")
        except IOError:
            continue
        if pattern.search(content):
            hits.append(candidate)
            count += 1
    return hits
