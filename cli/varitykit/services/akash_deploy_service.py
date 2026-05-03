"""
Akash Deploy Service — Deploy apps to Akash via git clone at runtime.

No Docker, no GHCR, no Nixpacks. The SDL uses a base image and
clones the repo at startup. Services (postgres, redis, ollama) are
added as sidecars when detected by the orchestration algorithm.
"""

import json
import re
import secrets
import time
import urllib.error
import urllib.request
from pathlib import Path
from typing import Callable, Dict, List, Optional

from rich.console import Console

from varitykit.core.akash.console_deployer import AkashConsoleDeployer
from varitykit.core.akash.types import AkashDeploymentResult, AkashError

console = Console()

_NEXT_STATIC_EXPORT_RE = re.compile(r"\boutput\s*:\s*['\"]export['\"]")


def _result_value(result, *names: str, default=""):
    if isinstance(result, dict):
        for name in names:
            value = result.get(name)
            if value:
                return value
        return default

    for name in names:
        value = getattr(result, name, None)
        if value:
            return value
    return default


def _akash_result(success: bool, dseq: str = "", url: str = "", provider: str = "", **extra):
    fields = getattr(AkashDeploymentResult, "__dataclass_fields__", {})
    if "dseq" in fields:
        result = AkashDeploymentResult(
            success=success,
            dseq=dseq,
            url=url,
            provider=provider,
            **extra,
        )
        if not hasattr(result, "deployment_id"):
            result.deployment_id = dseq
        return result

    result = AkashDeploymentResult(
        success=success,
        deployment_id=dseq or None,
        url=url or None,
        provider=provider or None,
        **extra,
    )
    if not hasattr(result, "dseq"):
        result.dseq = dseq
    return result


# ---------------------------------------------------------------------------
# SDL templates (f-string, no Jinja2)
# ---------------------------------------------------------------------------

_NODE_APP_SERVICE_TPL = """\
  app:
    image: node:20-bookworm-slim
    command:
      - sh
      - -c
      - "{build_command}"
    env:
      - NODE_ENV=production
      - PORT={port}
      - HOST=0.0.0.0
      - HOSTNAME=0.0.0.0
      - NODE_OPTIONS=--max-old-space-size=3584{env_lines}
    expose:
      - port: {port}
        as: 80
        to:
          - global: true"""

_PYTHON_APP_SERVICE_TPL = """\
  app:
    image: python:3.11-slim
    command:
      - sh
      - -c
      - "{build_command}"
    env:
      - PYTHONUNBUFFERED=1
      - PORT={port}{env_lines}
    expose:
      - port: {port}
        as: 80
        to:
          - global: true"""

NODE_PROJECT_TYPES = {"nextjs", "react", "vue", "nodejs", "express", "fastify", "nestjs", "koa", "hono", "dockerfile"}
PYTHON_PROJECT_TYPES = {"python", "fastapi", "django", "flask"}

_POSTGRES_SERVICE_TPL = """\
  postgres:
    image: pgvector/pgvector:pg15
    command:
      - sh
      - -c
      - "echo 'CREATE EXTENSION IF NOT EXISTS vector;' > /docker-entrypoint-initdb.d/00-pgvector.sql && docker-entrypoint.sh postgres"
    env:
      - "POSTGRES_USER=varity"
      - "POSTGRES_PASSWORD={db_password}"
      - "POSTGRES_DB=app"
      - "PGDATA=/var/lib/postgresql/data/pgdata"
    expose:
      - port: 5432
        to:
          - service: app"""

_REDIS_SERVICE_TPL = """\
  redis:
    image: redis:7-alpine
    command:
      - redis-server
      - --maxmemory
      - 256mb
      - --maxmemory-policy
      - allkeys-lru
    expose:
      - port: 6379
        to:
          - service: app"""

_OLLAMA_SERVICE_TPL = """\
  ollama:
    image: ollama/ollama:latest
    expose:
      - port: 11434
        to:
          - service: app"""

_MONGODB_SERVICE_TPL = """\
  mongodb:
    image: mongo:7
    env:
      - "MONGO_INITDB_ROOT_USERNAME=varity"
      - "MONGO_INITDB_ROOT_PASSWORD={db_password}"
      - "MONGO_INITDB_DATABASE=app"
    expose:
      - port: 27017
        to:
          - service: app"""

_MYSQL_SERVICE_TPL = """\
  mysql:
    image: mysql:8
    env:
      - "MYSQL_ROOT_PASSWORD={db_password}"
      - "MYSQL_DATABASE=app"
      - "MYSQL_USER=varity"
      - "MYSQL_PASSWORD={db_password}"
    expose:
      - port: 3306
        to:
          - service: app"""

_SDL_WRAPPER = """\
---
version: "2.0"

services:
{services_block}

profiles:
  compute:
{compute_block}
  placement:
    global:
      pricing:
{pricing_block}

deployment:
{deployment_block}"""


# ---------------------------------------------------------------------------
# Resource defaults per service
# ---------------------------------------------------------------------------

_RESOURCES = {
    "app":      {"cpu": 2,    "memory": "4Gi",   "storage": "4Gi"},
    "postgres": {"cpu": 0.5,  "memory": "512Mi", "storage": "2Gi"},
    "mysql":    {"cpu": 0.5,  "memory": "512Mi", "storage": "2Gi"},
    "redis":    {"cpu": 0.25, "memory": "256Mi", "storage": "512Mi"},
    "ollama":   {"cpu": 2,    "memory": "4Gi",   "storage": "8Gi"},
    "mongodb":  {"cpu": 0.5,  "memory": "512Mi", "storage": "2Gi"},
}


# ---------------------------------------------------------------------------
# SDL generation
# ---------------------------------------------------------------------------

_DB_SERVICES = {"postgres", "mongodb", "mysql"}


def _format_user_env_entry(key: str, value: str) -> str:
    """Format a user-supplied KEY=VALUE as a YAML single-quoted env entry.

    User values can contain anything — API keys with slashes, secrets with
    dollar signs, passwords with double quotes. YAML single-quoted strings
    pass through all of these; the only escape needed is doubling internal
    single quotes.

    Raises ValueError for multiline values — SDL env entries are single-line.
    """
    if "\n" in value or "\r" in value:
        raise ValueError(
            f"Env var {key!r} contains a newline. Multiline env values are "
            "not supported in Akash SDL. Encode it (base64 / JSON string) or "
            "write it to a file at runtime."
        )
    escaped = value.replace("'", "''")
    return f"      - '{key}={escaped}'"


def _node_build_command(
    github_repo_url: str,
    services: List[str],
    package_manager: str = "npm",
) -> str:
    """Build command for Node-family apps (Next.js, React, Vue, Node).

    Runs on node:20-bookworm-slim (Debian). apt-get works, Prisma's
    linux-debian-openssl-3.0.x engine works out of the box (no libssl.so.1.1
    problem that plagues alpine).
    """
    pm = package_manager if package_manager in ("npm", "yarn", "pnpm") else "npm"

    # npm 7+ auto-installs optional peer deps at their latest matching version.
    # Next.js 15 lists "typescript: >=4.5.2" (no upper bound) as an optional
    # peer dep. Without --legacy-peer-deps, npm resolves typescript@6.x, which
    # treats "moduleResolution: node" as a fatal error and breaks all Next.js
    # builds. --legacy-peer-deps reverts to npm 6 behavior where optional peer
    # deps are NOT auto-installed, so only explicitly pinned versions land.
    install_cmd = f"{pm} install --legacy-peer-deps" if pm == "npm" else f"{pm} install"

    steps = [
        "apt-get update && apt-get install -y --no-install-recommends git openssl ca-certificates",
    ]
    if pm == "pnpm":
        steps.append("npm install -g pnpm")
    elif pm == "yarn":
        steps.append("npm install -g yarn")

    steps += [
        f"git clone {github_repo_url} /app",
        "cd /app",
        install_cmd,
        "chmod +x node_modules/.bin/* 2>/dev/null || true",
        "if [ ! -d .next ] && ls next.config.* >/dev/null 2>&1; then npm run build; fi",
    ]
    if any(s in services for s in _DB_SERVICES):
        steps.append("sleep 15")
    # Prisma generate should run for all Prisma-backed DBs, not just postgres.
    if any(s in services for s in _DB_SERVICES):
        steps.append("npx prisma generate 2>/dev/null || true")

    # db push remains guarded to SQL sidecars to avoid force-applying on
    # unsupported providers.
    if "postgres" in services or "mysql" in services:
        steps.append("npx prisma db push 2>/dev/null || true")
    steps.append(f"{pm} start")
    return " && ".join(steps)


def _python_build_command(
    github_repo_url: str,
    services: List[str],
    start_command: str,
) -> str:
    """Build command for Python-family apps (FastAPI, Django, Flask, generic).

    Uses curl+tar as the primary fetch strategy to avoid a 30-60s apt-get
    overhead on providers that don't pre-cache git. Falls back to apt+git
    clone if curl is absent on the provider node.
    """
    # curl is present on python:3.11-slim (Debian bookworm-slim ships it).
    # tar is a Debian essential — always available. This avoids apt-get update
    # + apt-get install git which adds 30-60s on uncached provider nodes.
    fetch_step = (
        f"if type curl >/dev/null 2>&1; "
        f"then mkdir -p /app && curl -sL {github_repo_url}/archive/HEAD.tar.gz "
        f"| tar -xz -C /app --strip-components=1; "
        f"else apt-get update -qq && apt-get install -y -qq --no-install-recommends git "
        f"&& git clone {github_repo_url} /app; "
        f"fi"
    )
    steps = [fetch_step, "cd /app"]

    # psycopg2-binary and pgvector link against libpq.so at runtime; python:3.11-slim
    # ships without it. Install libpq-dev (provides the shared lib + headers) and
    # build-essential so any C-extension packages in requirements.txt can compile.
    if "postgres" in services:
        steps.append(
            "apt-get update -qq && apt-get install -y -qq --no-install-recommends "
            "libpq-dev build-essential"
        )

    steps.append(
        "if [ -f requirements.txt ]; then pip install --no-cache-dir -r requirements.txt; "
        "elif [ -f pyproject.toml ]; then pip install --no-cache-dir .; fi"
    )
    if any(s in services for s in _DB_SERVICES):
        steps.append("sleep 15")
    steps.append(start_command)
    return " && ".join(steps)


def _generate_sdl(
    github_repo_url: str,
    app_name: str,
    project_type: str = "nextjs",
    port: int = 3000,
    services: Optional[List[str]] = None,
    env_vars: Optional[Dict[str, str]] = None,
    python_start_command: Optional[str] = None,
    package_manager: str = "npm",
) -> str:
    """Build a complete Akash SDL from a GitHub repo URL and optional sidecars.

    Branches on project_type to select the correct toolchain (base image + build
    command). Node family uses node:20-bookworm-slim; Python family uses
    python:3.11-slim + pip.
    """
    services = services or []
    db_password = secrets.token_hex(16)
    mongo_password = secrets.token_hex(16)

    # --- choose toolchain ---
    if project_type in NODE_PROJECT_TYPES:
        app_tpl = _NODE_APP_SERVICE_TPL
        build_command = _node_build_command(
            github_repo_url, services, package_manager=package_manager
        )
        reserved_env_keys = {"NODE_ENV", "PORT", "NODE_OPTIONS", "HOST", "HOSTNAME"}
    elif project_type in PYTHON_PROJECT_TYPES:
        app_tpl = _PYTHON_APP_SERVICE_TPL
        start = python_start_command or "uvicorn main:app --host 0.0.0.0 --port 8000"
        build_command = _python_build_command(github_repo_url, services, start)
        reserved_env_keys = {"PYTHONUNBUFFERED", "PORT"}
    else:
        supported = sorted(NODE_PROJECT_TYPES | PYTHON_PROJECT_TYPES)
        raise ValueError(
            f"Unsupported project_type for Akash: {project_type!r}. "
            f"Supported: {supported}"
        )

    # --- extra env lines for the app service ---
    extra_env: List[str] = [f'      - "APP_NAME={app_name}"']
    if "postgres" in services:
        extra_env.append(
            f'      - "DATABASE_URL=postgresql://varity:{db_password}@postgres:5432/app"'
        )
    if "redis" in services:
        extra_env.append('      - "REDIS_URL=redis://redis:6379"')
    if "ollama" in services:
        extra_env.append('      - "OLLAMA_URL=http://ollama:11434"')
    if "mongodb" in services:
        extra_env.append(
            f'      - "MONGODB_URI=mongodb://varity:{mongo_password}@mongodb:27017/app?authSource=admin"'
        )
    if "mysql" in services:
        extra_env.append(
            f'      - "MYSQL_URL=mysql://varity:{db_password}@mysql:3306/app"'
        )
        extra_env.append(
            f'      - "DATABASE_URL=mysql://varity:{db_password}@mysql:3306/app"'
        )
    # Django deployments often need a hint hook to map DATABASE_URL into
    # DATABASES in settings.py via dj-database-url/django-environ.
    if project_type == "python" and python_start_command and "gunicorn" in python_start_command and ".wsgi" in python_start_command:
        extra_env.append('      - "DJANGO_DATABASE_HINT=dj.database.url"')
    if env_vars:
        for k, v in env_vars.items():
            if k not in reserved_env_keys:
                extra_env.append(_format_user_env_entry(k, str(v)))
    env_lines = "\n" + "\n".join(extra_env) if extra_env else ""

    # --- services block ---
    parts = [
        app_tpl.format(
            build_command=build_command,
            port=port,
            env_lines=env_lines,
        )
    ]
    if "postgres" in services:
        parts.append(_POSTGRES_SERVICE_TPL.format(db_password=db_password))
    if "redis" in services:
        parts.append(_REDIS_SERVICE_TPL)
    if "ollama" in services:
        parts.append(_OLLAMA_SERVICE_TPL)
    if "mongodb" in services:
        parts.append(_MONGODB_SERVICE_TPL.format(db_password=mongo_password))
    if "mysql" in services:
        parts.append(_MYSQL_SERVICE_TPL.format(db_password=db_password))
    services_block = "\n".join(parts)

    # --- compute / pricing / deployment blocks ---
    all_names = ["app"] + [s for s in services if s in _RESOURCES]

    # Node-family apps need 8Gi: npm install of heavy trees (MUI, thirdweb,
    # Privy, 1000+ transitive deps) spikes 2-3GB during install, and the
    # runtime-build path needs headroom above the 3584MB V8 heap. 4Gi was
    # the silent killer for real Vercel-shaped repos. Python stays at 4Gi
    # (pip has a flatter dep tree).
    app_resources = (
        {"cpu": 2, "memory": "8Gi", "storage": "4Gi"}
        if project_type in NODE_PROJECT_TYPES
        else _RESOURCES["app"]
    )

    def _compute_entry(name: str) -> str:
        r = app_resources if name == "app" else _RESOURCES[name]
        return (
            f"    {name}:\n"
            f"      resources:\n"
            f"        cpu:\n"
            f"          units: {r['cpu']}\n"
            f"        memory:\n"
            f"          size: {r['memory']}\n"
            f"        storage:\n"
            f"          size: {r['storage']}"
        )

    compute_block = "\n".join(_compute_entry(n) for n in all_names)
    pricing_block = "\n".join(
        f"        {n}:\n          denom: uakt\n          amount: 10000"
        for n in all_names
    )
    deployment_block = "\n".join(
        f"  {n}:\n    global:\n      profile: {n}\n      count: 1"
        for n in all_names
    )

    return _SDL_WRAPPER.format(
        services_block=services_block,
        compute_block=compute_block,
        pricing_block=pricing_block,
        deployment_block=deployment_block,
    )


# ---------------------------------------------------------------------------
# Main deploy function
# ---------------------------------------------------------------------------

def deploy(
    github_repo_url: str,
    app_name: str,
    project_type: str = "nextjs",
    services: Optional[List[str]] = None,
    env_vars: Optional[Dict[str, str]] = None,
    port: int = 3000,
    python_start_command: Optional[str] = None,
    package_manager: str = "npm",
    api_key: Optional[str] = None,
    verbose: bool = True,
) -> AkashDeploymentResult:
    """
    Deploy a GitHub repo to Akash.

    Args:
        github_repo_url: Public repo URL (https://github.com/USER/REPO.git)
        app_name: Human-readable app name
        project_type: Detected project type — drives toolchain selection
            (base image + install/run commands). Node family: nextjs, react,
            vue, nodejs. Python family: python, fastapi, django, flask.
        services: Optional sidecars — 'postgres', 'redis', 'ollama'
        env_vars: Extra environment variables for the app service
        port: App listen port (default 3000 for Node, 8000 for Python)
        python_start_command: Optional override for the Python start command
            (e.g. 'gunicorn myapp.wsgi'). Only used for Python toolchains.
        package_manager: Package manager detected from lockfiles (npm/yarn/pnpm)
        api_key: Akash Console API key (falls back to env / credential proxy)
        verbose: Print progress messages

    Returns:
        AkashDeploymentResult with URL and deployment info
    """
    def _log(msg: str) -> None:
        if verbose:
            console.print(f"  {msg}")

    try:
        # 1. Generate SDL
        _log("Generating deployment manifest...")
        sdl = _generate_sdl(
            github_repo_url=github_repo_url,
            app_name=app_name,
            project_type=project_type,
            port=port,
            services=services,
            env_vars=env_vars,
            python_start_command=python_start_command,
            package_manager=package_manager,
        )

        # 2. Resolve API key
        key = _resolve_api_key(api_key)

        # 3. Deploy via Console API
        _log("Deploying to compute network...")
        deployer = AkashConsoleDeployer(api_key=key)
        # deploy() raises AkashError on failure. Depending on the installed
        # console deployer version this returns either a dict or an
        # AkashDeploymentResult, so normalize both shapes here.
        result = deployer.deploy(sdl=sdl, deposit=5)

        _log("Deployment accepted by compute network")

        # 4. Wait for container to be healthy before claiming success.
        # Akash accepts the SDL instantly but the container still has to
        # pull an image, npm install / pip install, and bind to the port —
        # that's 1-10 minutes of "502 / Content not available" for the user
        # if we don't wait here.
        if not isinstance(result, dict):
            if getattr(result, "success", True) is False:
                return result

        raw_url = _result_value(result, "url", "service_url", "frontend_url")
        dseq = _result_value(result, "dseq", "deployment_id", "deploymentId")
        provider = _result_value(result, "provider")
        health_url = _ensure_scheme(raw_url)

        # Python apps need more time: python:3.11-slim (~200MB) pull + pip install
        # can take 4-8 min on slow Akash provider nodes (VAR-234). Node apps keep
        # the 5-min window — their heavier npm install is offset by a faster image.
        health_timeout = 600.0 if project_type in PYTHON_PROJECT_TYPES else 300.0
        timeout_label = "10 min" if project_type in PYTHON_PROJECT_TYPES else "5 min"
        _log(f"Waiting for container to come online (up to {timeout_label})...")
        healthy = _wait_for_healthy(
            url=health_url,
            log=_log,
            timeout=health_timeout,
            poll_interval=5.0,
        )

        if not healthy:
            return _akash_result(
                success=False,
                dseq=dseq,
                url=_ensure_scheme(raw_url),
                provider=provider,
                error_message=(
                    f"Container did not become healthy within {timeout_label}. "
                    "This can happen with heavy apps on a 4Gi container "
                    "during npm install. Check logs with: varitykit app "
                    f"logs {dseq}"
                ),
            )

        _log("Container healthy — serving traffic")
        _log("App running")

        return _akash_result(
            success=True,
            dseq=dseq,
            url=_ensure_scheme(raw_url),
            provider=provider,
            estimated_monthly_cost=0.0,
        )

    except AkashError as e:
        return AkashDeploymentResult(
            success=False,
            error_message=f"Compute deployment failed: {e}",
        )
    except Exception as e:
        return AkashDeploymentResult(
            success=False,
            error_message=str(e),
        )


# ---------------------------------------------------------------------------
# Health check — wait for container to actually serve traffic
# ---------------------------------------------------------------------------

def _ensure_scheme(url: str) -> str:
    """Prepend http:// to a URL if it has no scheme.

    Akash Console sometimes returns provider URLs without a scheme
    (`provider.xxx.com:12345`). urllib requires one.
    """
    if not url:
        return url
    if url.startswith("http://") or url.startswith("https://"):
        return url
    return f"http://{url}"


_INGRESS_NOT_READY = frozenset({502, 503})


def _wait_for_healthy(
    url: str,
    log: Optional[Callable[[str], None]] = None,
    timeout: float = 300.0,
    poll_interval: float = 5.0,
    progress_interval: float = 15.0,
    consecutive_successes: int = 3,
) -> bool:
    """Poll `url` until the container responds or `timeout` elapses.

    Returns True on the first HTTP response that comes from the
    container itself (any status except 502/503). A 404 from FastAPI
    or a 500 from a crashing app still proves the container is alive
    and accepting connections — the deploy succeeded.

    502 and 503 are the Akash ingress saying "backend not ready" so
    we keep polling through those. Network errors (connection refused,
    DNS failures, read timeouts) are also treated as "not ready yet".

    Progress is logged (via `log`) at most once every `progress_interval`
    seconds while we're still waiting, so we don't spam the console.
    """
    if log is None:
        log = lambda _msg: None  # noqa: E731

    start = time.monotonic()
    last_progress = start

    streak = 0

    while True:
        elapsed = time.monotonic() - start
        if elapsed >= timeout:
            return False

        status = _probe_once(url)
        if status is not None and status not in _INGRESS_NOT_READY:
            streak += 1
            if streak >= max(1, consecutive_successes):
                return True
        else:
            streak = 0

        # Still warming — throttled progress ping.
        now = time.monotonic()
        if now - last_progress >= progress_interval:
            mins, secs = divmod(int(elapsed), 60)
            log(f"  Still warming (elapsed: {mins}:{secs:02d})...")
            last_progress = now

        # Don't overshoot the timeout on the final sleep.
        remaining = timeout - (time.monotonic() - start)
        if remaining <= 0:
            return False
        time.sleep(min(poll_interval, remaining))


def _probe_once(url: str) -> Optional[int]:
    """Issue a single GET and return the HTTP status code, or None on error.

    Any network-level failure (connection refused, DNS, read timeout) is
    swallowed and reported as None so the caller can treat it as "not
    ready yet." HTTPError still carries a status code, so we surface that.
    """
    try:
        req = urllib.request.Request(url, method="GET")
        with urllib.request.urlopen(req, timeout=10) as resp:
            return getattr(resp, "status", None) or resp.getcode()
    except urllib.error.HTTPError as e:
        # 3xx/4xx/5xx — we got a response, just not a healthy one.
        return e.code
    except Exception:
        # Connection refused, DNS failure, read timeout, SSL error, etc.
        return None


# ---------------------------------------------------------------------------
# API key resolution
# ---------------------------------------------------------------------------

def _resolve_api_key(explicit_key: Optional[str] = None) -> str:
    """Resolve Akash Console API key from explicit value, env, or credential proxy."""
    import os

    if explicit_key:
        return explicit_key

    env_key = os.getenv("AKASH_CONSOLE_API_KEY")
    if env_key:
        return env_key

    # Try credential proxy
    try:
        from varitykit.services.credential_fetcher import (
            CREDENTIAL_PROXY_URL,
            _get_cli_api_key,
        )
        import urllib.request

        cli_key = _get_cli_api_key()
        if cli_key:
            url = f"{CREDENTIAL_PROXY_URL}/api/credentials/akash"
            req = urllib.request.Request(
                url,
                headers={"Authorization": f"Bearer {cli_key}"},
            )
            with urllib.request.urlopen(req, timeout=10) as response:
                data = json.loads(response.read().decode())
                proxy_key = data.get("console_api_key") or data.get("api_key") or data.get("console_key")
                if proxy_key:
                    return proxy_key
    except Exception:
        pass

    raise AkashError(
        "Compute hosting not configured yet.\n"
        "Set AKASH_CONSOLE_API_KEY environment variable or contact support."
    )


# ---------------------------------------------------------------------------
# Detection helpers (used by CLI to decide static vs dynamic)
# ---------------------------------------------------------------------------

def detect_hosting_type(project_path: str) -> str:
    """
    Auto-detect whether a project needs static or dynamic hosting.

    Returns:
        "static" or "akash"
    """
    path = Path(project_path)
    package_json_path = path / "package.json"

    # Dockerfile -> dynamic
    if (path / "Dockerfile").exists():
        return "akash"

    # Server directory -> dynamic
    if (path / "server").exists():
        return "akash"

    # Check package.json for clues
    if package_json_path.exists():
        try:
            with open(package_json_path, "r", encoding="utf-8") as f:
                pkg = json.load(f)
        except (json.JSONDecodeError, IOError):
            return "static"

        dependencies = {
            **pkg.get("dependencies", {}),
            **pkg.get("devDependencies", {}),
        }

        # Server frameworks + SSR meta-frameworks -> dynamic
        dynamic_deps = {"express", "fastify", "@nestjs/core", "koa", "hapi", "hono", "@builder.io/qwik-city"}
        if dynamic_deps & set(dependencies.keys()):
            return "akash"

        # Next.js: check for static export
        if "next" in dependencies:
            for config_file in ["next.config.js", "next.config.mjs", "next.config.ts", "next.config.cjs"]:
                config_path = path / config_file
                if config_path.exists():
                    try:
                        content = config_path.read_text(encoding="utf-8")
                        if _NEXT_STATIC_EXPORT_RE.search(content):
                            return "static"
                    except IOError:
                        pass
            return "akash"

        # Plain Node.js: scripts.start present but no recognized framework dep -> dynamic
        if pkg.get("scripts", {}).get("start"):
            return "akash"

    # Python projects -> dynamic
    if (path / "requirements.txt").exists() or (path / "pyproject.toml").exists():
        return "akash"

    return "static"


def detect_app_port(project_path: str, project_type: str = "nextjs") -> int:
    """Detect the port the app listens on.

    Scans the start/dev npm scripts for:
      1. `--port 3001` (long form)
      2. `-p 3001`     (short form — Next.js, Nuxt, and many frameworks default to this)
      3. `PORT=3001`   (env var prefix)

    CRITICAL: If the app binds to port N but our SDL exposes port 3000, every
    request hits the ingress → 502. Non-technical users see "Content not
    available" and have no diagnostic path. This function MUST match every
    reasonable variant.
    """
    path = Path(project_path)
    package_json_path = path / "package.json"

    # Procfile override (common for Flask/Django/Heroku-shaped apps)
    procfile = path / "Procfile"
    if procfile.exists():
        try:
            for line in procfile.read_text(encoding="utf-8").splitlines():
                if line.strip().lower().startswith("web:"):
                    cmd = line.split(":", 1)[1]
                    match = re.search(r"(?:--port|\s-p)[\s=]+(\d+)", " " + cmd)
                    if match:
                        return int(match.group(1))
                    match = re.search(r":(\d+)\b", cmd)
                    if match:
                        return int(match.group(1))
                    match = re.search(r"PORT=(\d+)", cmd)
                    if match:
                        return int(match.group(1))
        except IOError:
            pass

    if package_json_path.exists():
        try:
            with open(package_json_path, "r") as f:
                pkg = json.load(f)
            scripts = pkg.get("scripts", {})
            start_script = scripts.get("start", "") + " " + scripts.get("dev", "")
            # Match --port or -p (as a whole word, so -p 3001 matches but
            # --preserve doesn't). Also matches --port=3001 with equals sign.
            match = re.search(r"(?:--port|\s-p)[\s=]+(\d+)", " " + start_script)
            if match:
                return int(match.group(1))
            match = re.search(r"PORT=(\d+)", start_script)
            if match:
                return int(match.group(1))
        except Exception:
            pass

    port_map = {
        "nextjs": 3000,
        "react": 3000,
        "vue": 3000,
        "nodejs": 3000,
        "python": 8000,
        "fastapi": 8000,
        "django": 8000,
        "flask": 8000,
    }
    return port_map.get(project_type, 3000)


def detect_python_start_command(project_path: str) -> Optional[str]:
    """Detect the correct start command for a Python app.

    Precedence (highest wins):
      1. Procfile `web:` entry (Heroku-style) — user-explicit override.
      2. Django: presence of `manage.py`.
      3. FastAPI: `fastapi` dependency + `main.py`.
      4. Flask: `flask` dependency + `app.py`.
      5. None — caller falls back to `uvicorn main:app --host 0.0.0.0 --port 8000`.

    Returns None when nothing matches, so the caller can apply its default.
    All detected commands bind 0.0.0.0:<port> so the Akash provider can route
    traffic.
    """
    path = Path(project_path)

    # 1. Procfile override
    procfile = path / "Procfile"
    if procfile.exists():
        try:
            for line in procfile.read_text(encoding="utf-8").splitlines():
                if line.strip().lower().startswith("web:"):
                    return line.split(":", 1)[1].strip()
        except IOError:
            pass

    # Load Python deps (for Django/FastAPI/Flask detection)
    deps_text = ""
    for dep_file in ("requirements.txt", "pyproject.toml"):
        dep_path = path / dep_file
        if dep_path.exists():
            try:
                deps_text += dep_path.read_text(encoding="utf-8").lower()
            except IOError:
                pass

    # 2. Django
    if (path / "manage.py").exists():
        if "gunicorn" in deps_text:
            wsgi_module = _detect_django_wsgi_module(path)
            return f"gunicorn {wsgi_module} --bind 0.0.0.0:8000"
        return "python manage.py runserver 0.0.0.0:8000"

    # 3. FastAPI
    if "fastapi" in deps_text and (path / "main.py").exists():
        return "uvicorn main:app --host 0.0.0.0 --port 8000"

    # 4. Flask
    if "flask" in deps_text and (path / "app.py").exists():
        return "flask run --host 0.0.0.0 --port 8000"

    return None


def _detect_django_wsgi_module(project_path: Path) -> str:
    """Best-effort Django WSGI module discovery."""
    for settings_file in project_path.glob("*/settings.py"):
        pkg = settings_file.parent.name
        if pkg and pkg != "__pycache__":
            return f"{pkg}.wsgi:application"
    return "app.wsgi:application"
