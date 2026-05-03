"""
Rigorous tests for Akash SDL generation — Phase 1 verification.

Covers the multi-toolchain split introduced for non-Node projects. Before
Phase 1, every app ran on node:20-bookworm-slim regardless of language, so Python
deploys failed at `npm install`. These tests lock in the per-toolchain
behavior so the next hallucination doesn't quietly regress it.
"""

import json

import pytest
import yaml

from varitykit.services.akash_deploy_service import (
    NODE_PROJECT_TYPES,
    PYTHON_PROJECT_TYPES,
    _generate_sdl,
    detect_app_port,
    detect_python_start_command,
)


REPO_URL = "https://github.com/example/demo.git"
APP_NAME = "demo-app"


# ---------------------------------------------------------------------------
# Generated SDL must be valid YAML. If this breaks, Akash rejects the deploy
# at the API layer with zero diagnostic context.
# ---------------------------------------------------------------------------

class TestSDLIsValidYAML:
    def test_node_sdl_parses(self):
        sdl = _generate_sdl(REPO_URL, APP_NAME, project_type="nextjs")
        parsed = yaml.safe_load(sdl)
        assert parsed["version"] == "2.0"
        assert "app" in parsed["services"]

    def test_python_sdl_parses(self):
        sdl = _generate_sdl(REPO_URL, APP_NAME, project_type="fastapi", port=8000)
        parsed = yaml.safe_load(sdl)
        assert parsed["version"] == "2.0"
        assert "app" in parsed["services"]

    def test_multi_service_sdl_parses(self):
        sdl = _generate_sdl(
            REPO_URL, APP_NAME,
            project_type="nextjs",
            services=["postgres", "redis", "ollama"],
        )
        parsed = yaml.safe_load(sdl)
        assert set(parsed["services"].keys()) == {"app", "postgres", "redis", "ollama"}


# ---------------------------------------------------------------------------
# Node toolchain — regression lock for the pre-Phase-1 happy path.
# ---------------------------------------------------------------------------

class TestNodeToolchain:
    def test_uses_node_base_image(self):
        sdl = _generate_sdl(REPO_URL, APP_NAME, project_type="nextjs")
        assert "image: node:20-bookworm-slim" in sdl

    def test_uses_npm_install_and_start(self):
        sdl = _generate_sdl(REPO_URL, APP_NAME, project_type="nextjs")
        assert "npm install" in sdl
        assert "npm start" in sdl

    def test_clones_via_apk(self):
        sdl = _generate_sdl(REPO_URL, APP_NAME, project_type="nextjs")
        assert "apt-get update && apt-get install -y --no-install-recommends git openssl ca-certificates" in sdl
        assert f"git clone {REPO_URL} /app" in sdl

    def test_postgres_adds_prisma_steps(self):
        sdl = _generate_sdl(REPO_URL, APP_NAME, project_type="nextjs", services=["postgres"])
        assert "npx prisma generate" in sdl
        assert "npx prisma db push" in sdl

    def test_sets_node_env_vars(self):
        sdl = _generate_sdl(REPO_URL, APP_NAME, project_type="nextjs")
        assert "NODE_ENV=production" in sdl
        # Heap size must stay below container memory (4Gi = 4096MB) to avoid
        # Node allocation failures at startup. Regression guard against the
        # pre-Phase-6 bug where heap was 6144MB on a 4Gi container.
        assert "NODE_OPTIONS=--max-old-space-size=3584" in sdl
        assert "max-old-space-size=6144" not in sdl

    @pytest.mark.parametrize("ptype", ["nextjs", "react", "vue", "nodejs"])
    def test_all_node_types_use_node_image(self, ptype):
        sdl = _generate_sdl(REPO_URL, APP_NAME, project_type=ptype)
        assert "image: node:20-bookworm-slim" in sdl
        assert "image: python:" not in sdl


# ---------------------------------------------------------------------------
# Python toolchain — the new path. THE test surface that proves Bug A is
# fixed for non-technical users shipping FastAPI/Django/Flask apps.
# ---------------------------------------------------------------------------

class TestPythonToolchain:
    def test_uses_python_base_image(self):
        sdl = _generate_sdl(REPO_URL, APP_NAME, project_type="fastapi", port=8000)
        assert "image: python:3.11-slim" in sdl
        # And crucially NOT the Node image.
        assert "node:20-bookworm-slim" not in sdl

    def test_does_not_run_npm_install(self):
        """Regression guard: Bug A was npm install on Python repos."""
        sdl = _generate_sdl(REPO_URL, APP_NAME, project_type="fastapi", port=8000)
        assert "npm install" not in sdl
        assert "npm start" not in sdl

    def test_uses_apt_git_not_apk(self):
        sdl = _generate_sdl(REPO_URL, APP_NAME, project_type="python", port=8000)
        assert "apt-get update" in sdl  # fallback branch still uses apt (Debian)
        assert "apk add" not in sdl  # slim is debian-based, not alpine

    def test_curl_first_fetch_strategy(self):
        """curl+tar is the primary fetch — avoids 30-60s apt-get on provider nodes."""
        sdl = _generate_sdl(REPO_URL, APP_NAME, project_type="fastapi", port=8000)
        assert "type curl" in sdl
        assert "archive/HEAD.tar.gz" in sdl
        assert "strip-components=1" in sdl

    def test_installs_requirements_txt(self):
        sdl = _generate_sdl(REPO_URL, APP_NAME, project_type="fastapi", port=8000)
        assert "pip install --no-cache-dir -r requirements.txt" in sdl

    def test_falls_back_to_pyproject(self):
        sdl = _generate_sdl(REPO_URL, APP_NAME, project_type="python", port=8000)
        assert "pyproject.toml" in sdl
        assert "pip install --no-cache-dir ." in sdl

    def test_default_start_is_uvicorn(self):
        sdl = _generate_sdl(REPO_URL, APP_NAME, project_type="fastapi", port=8000)
        assert "uvicorn main:app --host 0.0.0.0 --port 8000" in sdl

    def test_respects_custom_start_command(self):
        sdl = _generate_sdl(
            REPO_URL, APP_NAME,
            project_type="django",
            port=8000,
            python_start_command="gunicorn myapp.wsgi --bind 0.0.0.0:8000",
        )
        assert "gunicorn myapp.wsgi --bind 0.0.0.0:8000" in sdl
        assert "uvicorn" not in sdl

    def test_sets_python_env_vars(self):
        sdl = _generate_sdl(REPO_URL, APP_NAME, project_type="fastapi", port=8000)
        assert "PYTHONUNBUFFERED=1" in sdl
        # Must NOT leak Node-specific env vars.
        assert "NODE_ENV" not in sdl
        assert "NODE_OPTIONS" not in sdl

    def test_postgres_does_not_add_prisma(self):
        """Python projects don't use Prisma — adding it would fail at build."""
        sdl = _generate_sdl(
            REPO_URL, APP_NAME,
            project_type="fastapi",
            port=8000,
            services=["postgres"],
        )
        assert "npx prisma" not in sdl
        # DATABASE_URL should still be wired for the app to consume.
        assert "DATABASE_URL=postgresql://" in sdl

    def test_postgres_installs_native_build_deps(self):
        """psycopg2-binary and pgvector link against libpq.so at runtime.
        python:3.11-slim ships without it — must be installed before pip."""
        sdl = _generate_sdl(
            REPO_URL, APP_NAME,
            project_type="fastapi",
            port=8000,
            services=["postgres"],
        )
        assert "libpq-dev" in sdl
        assert "build-essential" in sdl
        # Build deps must appear BEFORE pip install so C extensions can compile.
        assert sdl.index("libpq-dev") < sdl.index("pip install")

    def test_no_postgres_no_build_deps(self):
        """Without postgres sidecar, avoid the extra apt-get overhead."""
        sdl = _generate_sdl(REPO_URL, APP_NAME, project_type="fastapi", port=8000)
        assert "libpq-dev" not in sdl
        assert "build-essential" not in sdl

    @pytest.mark.parametrize("ptype", ["python", "fastapi", "django", "flask"])
    def test_all_python_types_use_python_image(self, ptype):
        sdl = _generate_sdl(REPO_URL, APP_NAME, project_type=ptype, port=8000)
        assert "image: python:3.11-slim" in sdl
        assert "image: node:" not in sdl


# ---------------------------------------------------------------------------
# Error surface — unsupported toolchains must fail LOUDLY at SDL generation,
# not silently deploy a Node image on a Go/Rust/Java repo.
# ---------------------------------------------------------------------------

class TestUnsupportedToolchain:
    @pytest.mark.parametrize("ptype", ["go", "rust", "java", "ruby", "static", "unknown", ""])
    def test_raises_for_unsupported_type(self, ptype):
        with pytest.raises(ValueError) as exc:
            _generate_sdl(REPO_URL, APP_NAME, project_type=ptype)
        assert "Unsupported project_type" in str(exc.value)
        assert ptype in str(exc.value) or f"{ptype!r}" in str(exc.value)


# ---------------------------------------------------------------------------
# Env var passthrough — Phase 4 will deepen this, but baseline behavior
# (user vars merge, reserved keys skip) must not regress.
# ---------------------------------------------------------------------------

class TestEnvVarPassthrough:
    def test_node_skips_reserved_keys(self):
        sdl = _generate_sdl(
            REPO_URL, APP_NAME,
            project_type="nextjs",
            env_vars={"NODE_ENV": "override", "OPENAI_API_KEY": "sk-123"},
        )
        assert "OPENAI_API_KEY=sk-123" in sdl
        # Template's NODE_ENV=production must win over the user override.
        assert 'NODE_ENV=override' not in sdl
        assert "NODE_ENV=production" in sdl

    def test_python_skips_reserved_keys(self):
        sdl = _generate_sdl(
            REPO_URL, APP_NAME,
            project_type="fastapi",
            port=8000,
            env_vars={"PYTHONUNBUFFERED": "0", "API_KEY": "secret"},
        )
        assert "API_KEY=secret" in sdl
        assert 'PYTHONUNBUFFERED=0' not in sdl
        assert "PYTHONUNBUFFERED=1" in sdl


# ---------------------------------------------------------------------------
# detect_python_start_command — detection precedence lock.
# ---------------------------------------------------------------------------

class TestDetectPythonStartCommand:
    def test_returns_none_for_empty_project(self, tmp_path):
        assert detect_python_start_command(str(tmp_path)) is None

    def test_procfile_wins(self, tmp_path):
        (tmp_path / "Procfile").write_text("web: gunicorn custom:app --bind 0.0.0.0:8000\n")
        # Even if Django also matches, Procfile must win.
        (tmp_path / "manage.py").write_text("")
        assert detect_python_start_command(str(tmp_path)) == "gunicorn custom:app --bind 0.0.0.0:8000"

    def test_procfile_ignores_non_web_lines(self, tmp_path):
        (tmp_path / "Procfile").write_text(
            "worker: celery -A tasks worker\nweb: uvicorn api:app --host 0.0.0.0 --port 8000\n"
        )
        assert detect_python_start_command(str(tmp_path)) == "uvicorn api:app --host 0.0.0.0 --port 8000"

    def test_django_detected_via_manage_py(self, tmp_path):
        (tmp_path / "manage.py").write_text("")
        assert detect_python_start_command(str(tmp_path)) == "python manage.py runserver 0.0.0.0:8000"

    def test_fastapi_detected_from_requirements(self, tmp_path):
        (tmp_path / "requirements.txt").write_text("fastapi==0.100.0\nuvicorn\n")
        (tmp_path / "main.py").write_text("")
        assert detect_python_start_command(str(tmp_path)) == "uvicorn main:app --host 0.0.0.0 --port 8000"

    def test_fastapi_detected_from_pyproject(self, tmp_path):
        (tmp_path / "pyproject.toml").write_text("[project]\ndependencies = ['fastapi', 'uvicorn']\n")
        (tmp_path / "main.py").write_text("")
        assert detect_python_start_command(str(tmp_path)) == "uvicorn main:app --host 0.0.0.0 --port 8000"

    def test_fastapi_without_main_py_falls_through(self, tmp_path):
        (tmp_path / "requirements.txt").write_text("fastapi\n")
        # No main.py — caller must fall back to its default.
        assert detect_python_start_command(str(tmp_path)) is None

    def test_flask_detected(self, tmp_path):
        (tmp_path / "requirements.txt").write_text("flask==3.0.0\n")
        (tmp_path / "app.py").write_text("")
        assert detect_python_start_command(str(tmp_path)) == "flask run --host 0.0.0.0 --port 8000"


# ---------------------------------------------------------------------------
# Toolchain constant sets — guard against accidental enum drift.
# ---------------------------------------------------------------------------

class TestPortDetection:
    """Regression guards for the port-detection bug that silently caused
    'Content not available' 502s: app binds to 3001 (via `-p 3001`) but SDL
    exposed 3000 → ingress routed to a closed port → every request 502.
    Every non-trivial Next.js repo with a custom port hit this."""

    def test_detects_dash_p_short_form(self, tmp_path):
        (tmp_path / "package.json").write_text(json.dumps({
            "scripts": {"start": "next start -p 3001"}
        }))
        assert detect_app_port(str(tmp_path), "nextjs") == 3001

    def test_detects_dash_dash_port_long_form(self, tmp_path):
        (tmp_path / "package.json").write_text(json.dumps({
            "scripts": {"start": "next start --port 4000"}
        }))
        assert detect_app_port(str(tmp_path), "nextjs") == 4000

    def test_detects_port_env_prefix(self, tmp_path):
        (tmp_path / "package.json").write_text(json.dumps({
            "scripts": {"start": "PORT=5000 next start"}
        }))
        assert detect_app_port(str(tmp_path), "nextjs") == 5000

    def test_detects_port_from_dev_script(self, tmp_path):
        (tmp_path / "package.json").write_text(json.dumps({
            "scripts": {"dev": "next dev -p 3001"}
        }))
        assert detect_app_port(str(tmp_path), "nextjs") == 3001

    def test_ignores_preserve_option_not_port(self, tmp_path):
        """`--preserve-symlinks` starts with -p and must NOT match -p <num>."""
        (tmp_path / "package.json").write_text(json.dumps({
            "scripts": {"start": "next start --preserve-symlinks"}
        }))
        # Should fall back to default (3000), not incorrectly extract digits.
        assert detect_app_port(str(tmp_path), "nextjs") == 3000

    def test_equals_form_dash_dash_port(self, tmp_path):
        (tmp_path / "package.json").write_text(json.dumps({
            "scripts": {"start": "next start --port=3002"}
        }))
        assert detect_app_port(str(tmp_path), "nextjs") == 3002

    def test_fallback_when_no_scripts(self, tmp_path):
        (tmp_path / "package.json").write_text(json.dumps({
            "dependencies": {"next": "^14"}
        }))
        assert detect_app_port(str(tmp_path), "nextjs") == 3000

    def test_fallback_for_python(self, tmp_path):
        assert detect_app_port(str(tmp_path), "fastapi") == 8000


class TestAppMemoryResources:
    """Regression guards for Lever D — Next.js apps need 8Gi, not 4Gi.
    npm install of heavy trees (MUI/thirdweb/Privy/1000+ deps) silently
    OOMs on 4Gi containers. Every Next.js deploy was rolling the dice."""

    @pytest.mark.parametrize("ptype", ["nextjs", "react", "vue", "nodejs"])
    def test_node_app_gets_8gi(self, ptype):
        sdl = _generate_sdl(REPO_URL, APP_NAME, project_type=ptype)
        parsed = yaml.safe_load(sdl)
        app_mem = parsed["profiles"]["compute"]["app"]["resources"]["memory"]["size"]
        assert app_mem == "8Gi", f"{ptype} must get 8Gi to survive npm install spikes"

    @pytest.mark.parametrize("ptype", ["python", "fastapi", "django", "flask"])
    def test_python_app_stays_4gi(self, ptype):
        """Python has a flatter dep tree — no need for 8Gi."""
        sdl = _generate_sdl(REPO_URL, APP_NAME, project_type=ptype, port=8000)
        parsed = yaml.safe_load(sdl)
        app_mem = parsed["profiles"]["compute"]["app"]["resources"]["memory"]["size"]
        assert app_mem == "4Gi"

    def test_sidecar_postgres_stays_512mi(self):
        """Lever D must ONLY affect the app service — sidecars unchanged."""
        sdl = _generate_sdl(REPO_URL, APP_NAME, project_type="nextjs", services=["postgres"])
        parsed = yaml.safe_load(sdl)
        pg_mem = parsed["profiles"]["compute"]["postgres"]["resources"]["memory"]["size"]
        assert pg_mem == "512Mi"


class TestToolchainConstants:
    def test_no_overlap_between_toolchains(self):
        """A project_type must belong to exactly one toolchain."""
        assert NODE_PROJECT_TYPES.isdisjoint(PYTHON_PROJECT_TYPES)

    def test_node_family_covers_expected_frameworks(self):
        assert {"nextjs", "react", "vue", "nodejs"} <= NODE_PROJECT_TYPES

    def test_python_family_covers_expected_frameworks(self):
        assert {"python", "fastapi", "django", "flask"} <= PYTHON_PROJECT_TYPES


class TestPackageManagerAwareness:
    """Package manager detection flows through to Akash build commands."""

    def test_npm_is_default(self):
        sdl = _generate_sdl(REPO_URL, APP_NAME, project_type="nextjs")
        assert "npm install" in sdl
        assert "npm start" in sdl

    def test_pnpm_installs_globally_and_uses_pnpm(self):
        sdl = _generate_sdl(REPO_URL, APP_NAME, project_type="nextjs", package_manager="pnpm")
        assert "npm install -g pnpm" in sdl
        assert "pnpm install" in sdl
        assert "pnpm start" in sdl

    def test_yarn_installs_globally_and_uses_yarn(self):
        sdl = _generate_sdl(REPO_URL, APP_NAME, project_type="nextjs", package_manager="yarn")
        assert "npm install -g yarn" in sdl
        assert "yarn install" in sdl
        assert "yarn start" in sdl

    def test_unknown_pm_falls_back_to_npm(self):
        sdl = _generate_sdl(REPO_URL, APP_NAME, project_type="nextjs", package_manager="bun")
        assert "npm install" in sdl
        assert "npm start" in sdl

    def test_python_ignores_package_manager(self):
        sdl = _generate_sdl(
            REPO_URL, APP_NAME, project_type="fastapi", port=8000, package_manager="pnpm"
        )
        assert "pnpm" not in sdl
        assert "npm" not in sdl


class TestMySQLService:
    """MySQL sidecar generation — new in algorithm tuning v2."""

    def test_mysql_service_appears_in_sdl(self):
        sdl = _generate_sdl(REPO_URL, APP_NAME, project_type="nextjs", services=["mysql"])
        parsed = yaml.safe_load(sdl)
        assert "mysql" in parsed["services"]
        assert parsed["services"]["mysql"]["image"] == "mysql:8"

    def test_mysql_env_vars_injected(self):
        sdl = _generate_sdl(REPO_URL, APP_NAME, project_type="nextjs", services=["mysql"])
        assert "MYSQL_URL=mysql://varity:" in sdl
        assert "DATABASE_URL=mysql://varity:" in sdl

    def test_mysql_resources_allocated(self):
        sdl = _generate_sdl(REPO_URL, APP_NAME, project_type="nextjs", services=["mysql"])
        parsed = yaml.safe_load(sdl)
        mysql_mem = parsed["profiles"]["compute"]["mysql"]["resources"]["memory"]["size"]
        assert mysql_mem == "512Mi"

    def test_mysql_db_sleep_applied(self):
        sdl = _generate_sdl(REPO_URL, APP_NAME, project_type="nextjs", services=["mysql"])
        assert "sleep 15" in sdl
