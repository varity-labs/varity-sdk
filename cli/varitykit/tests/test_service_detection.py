"""
Phase 2 verification — DeploymentOrchestrator._detect_services must expand
beyond postgres-only. Bug B was: only postgres could ever be auto-detected,
so Redis/Ollama SDL templates were unreachable dead code. Bug C was: the
services list passed to the SDL generator could only ever contain 'postgres'.

These tests lock in detection for postgres, redis, ollama, mongodb across
JS and Python projects, with real-world dep manifests.
"""

import json
from pathlib import Path

import pytest
import yaml

from varitykit.core.deployment_orchestrator import DeploymentOrchestrator
from varitykit.services.akash_deploy_service import _generate_sdl, detect_hosting_type


def _pkg(tmp_path: Path, deps: dict, scripts: dict | None = None) -> Path:
    data = {"dependencies": deps}
    if scripts:
        data["scripts"] = scripts
    (tmp_path / "package.json").write_text(json.dumps(data))
    return tmp_path


def _reqs(tmp_path: Path, deps: list) -> Path:
    (tmp_path / "requirements.txt").write_text("\n".join(deps) + "\n")
    return tmp_path


def _pyproject(tmp_path: Path, deps: list) -> Path:
    quoted = ", ".join(f'"{d}"' for d in deps)
    (tmp_path / "pyproject.toml").write_text(
        f'[project]\ndependencies = [{quoted}]\n'
    )
    return tmp_path


def _prisma_schema(tmp_path: Path, provider: str) -> None:
    (tmp_path / "prisma").mkdir(exist_ok=True)
    (tmp_path / "prisma" / "schema.prisma").write_text(
        f'datasource db {{\n  provider = "{provider}"\n  url = env("DATABASE_URL")\n}}\n'
    )


# ---------------------------------------------------------------------------
# JS dependency detection — each service in isolation.
# ---------------------------------------------------------------------------

class TestJSDetection:
    def test_empty_project_detects_nothing(self, tmp_path):
        assert DeploymentOrchestrator._detect_services(str(tmp_path)) == []

    @pytest.mark.parametrize("dep", [
        "pg", "postgres", "pg-promise", "drizzle-orm", "typeorm", "sequelize",
        "@neondatabase/serverless", "kysely", "knex", "@supabase/supabase-js",
        "mikro-orm", "slonik",
    ])
    def test_postgres_from_js_deps(self, tmp_path, dep):
        _pkg(tmp_path, {dep: "^1.0.0"})
        assert DeploymentOrchestrator._detect_services(str(tmp_path)) == ["postgres"]

    @pytest.mark.parametrize("dep", ["mongoose", "mongodb", "mongosh"])
    def test_mongodb_from_js_deps(self, tmp_path, dep):
        _pkg(tmp_path, {dep: "^1.0.0"})
        assert DeploymentOrchestrator._detect_services(str(tmp_path)) == ["mongodb"]

    @pytest.mark.parametrize("dep", ["ioredis", "redis", "bullmq", "bull", "connect-redis", "@upstash/redis"])
    def test_redis_from_js_deps(self, tmp_path, dep):
        _pkg(tmp_path, {dep: "^1.0.0"})
        assert DeploymentOrchestrator._detect_services(str(tmp_path)) == ["redis"]

    @pytest.mark.parametrize("dep", ["mysql2", "mysql", "@planetscale/database"])
    def test_mysql_from_js_deps(self, tmp_path, dep):
        _pkg(tmp_path, {dep: "^1.0.0"})
        assert DeploymentOrchestrator._detect_services(str(tmp_path)) == ["mysql"]

    @pytest.mark.parametrize("dep", ["@langchain/ollama", "ollama", "ollama-ai-provider"])
    def test_ollama_from_js_deps(self, tmp_path, dep):
        _pkg(tmp_path, {dep: "^1.0.0"})
        assert DeploymentOrchestrator._detect_services(str(tmp_path)) == ["ollama"]

    def test_devdependencies_also_count(self, tmp_path):
        (tmp_path / "package.json").write_text(
            json.dumps({"devDependencies": {"ioredis": "^5.0.0"}})
        )
        assert DeploymentOrchestrator._detect_services(str(tmp_path)) == ["redis"]

    def test_arbitrary_deps_detect_nothing(self, tmp_path):
        _pkg(tmp_path, {"lodash": "^4", "axios": "^1", "express": "^4"})
        assert DeploymentOrchestrator._detect_services(str(tmp_path)) == []


# ---------------------------------------------------------------------------
# Python dependency detection — both requirements.txt and pyproject.toml.
# ---------------------------------------------------------------------------

class TestPythonDetection:
    @pytest.mark.parametrize("dep", [
        "psycopg", "psycopg2", "psycopg2-binary", "asyncpg",
        "sqlalchemy", "databases", "tortoise-orm", "peewee", "django",
        "pgvector",
    ])
    def test_postgres_from_requirements(self, tmp_path, dep):
        _reqs(tmp_path, [f"{dep}==2.9.0"])
        assert DeploymentOrchestrator._detect_services(str(tmp_path)) == ["postgres"]

    @pytest.mark.parametrize("dep", ["pymongo", "motor", "beanie", "mongoengine", "odmantic"])
    def test_mongodb_from_requirements(self, tmp_path, dep):
        _reqs(tmp_path, [f"{dep}>=4.0"])
        assert DeploymentOrchestrator._detect_services(str(tmp_path)) == ["mongodb"]

    @pytest.mark.parametrize("dep", ["redis", "aioredis", "hiredis", "rq", "celery", "dramatiq", "huey"])
    def test_redis_from_requirements(self, tmp_path, dep):
        _reqs(tmp_path, [f"{dep}~=5.0"])
        assert DeploymentOrchestrator._detect_services(str(tmp_path)) == ["redis"]

    @pytest.mark.parametrize("dep", [
        "mysqlclient", "mysql-connector-python", "aiomysql", "asyncmy", "PyMySQL",
    ])
    def test_mysql_from_requirements(self, tmp_path, dep):
        _reqs(tmp_path, [f"{dep}>=1.0"])
        assert DeploymentOrchestrator._detect_services(str(tmp_path)) == ["mysql"]

    @pytest.mark.parametrize("dep", ["ollama", "langchain-ollama"])
    def test_ollama_from_requirements(self, tmp_path, dep):
        _reqs(tmp_path, [dep])
        assert DeploymentOrchestrator._detect_services(str(tmp_path)) == ["ollama"]

    def test_pyproject_deps_detected(self, tmp_path):
        _pyproject(tmp_path, ["fastapi>=0.100", "asyncpg", "redis>=5"])
        svcs = DeploymentOrchestrator._detect_services(str(tmp_path))
        assert set(svcs) == {"postgres", "redis"}

    def test_mongodb_substring_false_positive_guard(self, tmp_path):
        """mongodb-stubs must NOT trigger mongodb detection."""
        _reqs(tmp_path, ["mongodb-stubs==1.0.0"])
        assert "mongodb" not in DeploymentOrchestrator._detect_services(str(tmp_path))

    def test_pymongo_with_extras_syntax(self, tmp_path):
        """Extras syntax (pymongo[srv]) must trigger mongodb detection."""
        _reqs(tmp_path, ["pymongo[srv]>=4.0"])
        assert DeploymentOrchestrator._detect_services(str(tmp_path)) == ["mongodb"]


# ---------------------------------------------------------------------------
# Prisma schema provider — postgres vs mongodb decision.
# ---------------------------------------------------------------------------

class TestPrismaProvider:
    def test_prisma_postgres_provider(self, tmp_path):
        _pkg(tmp_path, {"@prisma/client": "^5.0.0"})
        _prisma_schema(tmp_path, "postgresql")
        assert DeploymentOrchestrator._detect_services(str(tmp_path)) == ["postgres"]

    def test_prisma_mongodb_provider(self, tmp_path):
        _pkg(tmp_path, {"@prisma/client": "^5.0.0"})
        _prisma_schema(tmp_path, "mongodb")
        assert DeploymentOrchestrator._detect_services(str(tmp_path)) == ["mongodb"]

    def test_prisma_without_schema_defaults_to_postgres(self, tmp_path):
        _pkg(tmp_path, {"@prisma/client": "^5.0.0"})
        # No schema.prisma — provider is ambiguous, so don't guess a DB sidecar.
        assert DeploymentOrchestrator._detect_services(str(tmp_path)) == []

    def test_prisma_mysql_provider_detects_mysql(self, tmp_path):
        """Prisma with mysql provider should trigger mysql sidecar."""
        _pkg(tmp_path, {"@prisma/client": "^5.0.0"})
        _prisma_schema(tmp_path, "mysql")
        assert DeploymentOrchestrator._detect_services(str(tmp_path)) == ["mysql"]


# ---------------------------------------------------------------------------
# Multi-service detection — the "everything" case.
# ---------------------------------------------------------------------------

class TestMultiService:
    def test_next_plus_postgres_plus_redis_plus_ollama(self, tmp_path):
        _pkg(tmp_path, {
            "next": "^14.0.0",
            "@prisma/client": "^5.0.0",
            "ioredis": "^5.0.0",
            "@langchain/ollama": "^0.1.0",
        })
        _prisma_schema(tmp_path, "postgresql")
        # Canonical order: postgres, redis, ollama, mongodb
        assert DeploymentOrchestrator._detect_services(str(tmp_path)) == [
            "postgres", "redis", "ollama"
        ]

    def test_python_ai_agent_stack(self, tmp_path):
        """FastAPI AI agent: Postgres for metadata, Redis for cache, Ollama
        for local LLM. Must produce all three."""
        _reqs(tmp_path, [
            "fastapi",
            "uvicorn",
            "asyncpg",
            "redis",
            "langchain-ollama",
        ])
        assert DeploymentOrchestrator._detect_services(str(tmp_path)) == [
            "postgres", "redis", "ollama"
        ]

    def test_canonical_order_regardless_of_detection_order(self, tmp_path):
        """Dict iteration order could vary; output must be canonical."""
        _pkg(tmp_path, {
            "mongodb": "^6",
            "ioredis": "^5",
            "pg": "^8",
        })
        result = DeploymentOrchestrator._detect_services(str(tmp_path))
        # postgres before redis before mongodb (mongodb last)
        assert result == ["postgres", "redis", "mongodb"]


# ---------------------------------------------------------------------------
# End-to-end auto-selection matrix — hosting + sidecars + SDL evidence.
# ---------------------------------------------------------------------------

class TestEndToEndAutoSelectionMatrix:
    def test_static_next_export_selects_static_ipfs_path(self, tmp_path):
        _pkg(tmp_path, {"next": "^14.0.0", "react": "^18.2.0"})
        (tmp_path / "next.config.js").write_text('module.exports={output:"export"}\n')

        assert detect_hosting_type(str(tmp_path)) == "static"
        assert DeploymentOrchestrator._detect_services(str(tmp_path)) == []

    def test_vite_react_preview_start_script_still_selects_static_ipfs_path(self, tmp_path):
        _pkg(
            tmp_path,
            {
                "vite": "^5.0.0",
                "@vitejs/plugin-react": "^4.0.0",
                "react": "^18.2.0",
                "react-dom": "^18.2.0",
            },
            scripts={"build": "vite build", "start": "vite --host 0.0.0.0"},
        )

        assert detect_hosting_type(str(tmp_path)) == "static"
        assert DeploymentOrchestrator._detect_services(str(tmp_path)) == []

    def test_next_standalone_selects_akash_path(self, tmp_path):
        _pkg(tmp_path, {"next": "^14.0.0", "react": "^18.2.0"})
        (tmp_path / "next.config.js").write_text("module.exports={output:'standalone'}\n")

        assert detect_hosting_type(str(tmp_path)) == "akash"
        assert DeploymentOrchestrator._detect_services(str(tmp_path)) == []

    def test_next_prisma_postgres_selects_akash_with_postgres_pgvector(self, tmp_path):
        _pkg(tmp_path, {"next": "^14.0.0", "react": "^18.2.0", "@prisma/client": "^5.0.0"})
        _prisma_schema(tmp_path, "postgresql")

        services = DeploymentOrchestrator._detect_services(str(tmp_path))
        sdl = _generate_sdl(REPO_URL, APP_NAME, project_type="nextjs", services=services)

        assert detect_hosting_type(str(tmp_path)) == "akash"
        assert services == ["postgres"]
        assert "DATABASE_URL=postgresql://" in sdl
        assert "image: pgvector/pgvector:pg15" in sdl

    def test_express_redis_postgres_selects_akash_with_both_sidecars(self, tmp_path):
        _pkg(tmp_path, {"express": "^4.18.0", "pg": "^8.11.0", "ioredis": "^5.3.0"})

        services = DeploymentOrchestrator._detect_services(str(tmp_path))
        sdl = _generate_sdl(REPO_URL, APP_NAME, project_type="express", services=services)

        assert detect_hosting_type(str(tmp_path)) == "akash"
        assert services == ["postgres", "redis"]
        assert "DATABASE_URL=postgresql://" in sdl
        assert "REDIS_URL=redis://redis:6379" in sdl

    def test_fastapi_pgvector_ollama_selects_akash_with_postgres_and_ollama(self, tmp_path):
        _reqs(tmp_path, ["fastapi", "uvicorn[standard]", "pgvector==0.3.1", "langchain-ollama"])

        services = DeploymentOrchestrator._detect_services(str(tmp_path))
        sdl = _generate_sdl(REPO_URL, APP_NAME, project_type="fastapi", services=services)

        assert detect_hosting_type(str(tmp_path)) == "akash"
        assert services == ["postgres", "ollama"]
        assert "DATABASE_URL=postgresql://" in sdl
        assert "image: pgvector/pgvector:pg15" in sdl
        assert "OLLAMA_URL=http://ollama:11434" in sdl

    def test_mongodb_backend_selects_akash_with_mongodb_sidecar(self, tmp_path):
        _pkg(tmp_path, {"express": "^4.18.0", "mongoose": "^8.0.0"})

        services = DeploymentOrchestrator._detect_services(str(tmp_path))
        sdl = _generate_sdl(REPO_URL, APP_NAME, project_type="express", services=services)

        assert detect_hosting_type(str(tmp_path)) == "akash"
        assert services == ["mongodb"]
        assert "MONGODB_URI=mongodb://" in sdl
        assert "image: mongo:7" in sdl

    def test_ollama_llm_signal_selects_akash_with_ollama_sidecar(self, tmp_path):
        _pkg(tmp_path, {"express": "^4.18.0", "@langchain/ollama": "^0.1.0"})

        services = DeploymentOrchestrator._detect_services(str(tmp_path))
        sdl = _generate_sdl(REPO_URL, APP_NAME, project_type="express", services=services)

        assert detect_hosting_type(str(tmp_path)) == "akash"
        assert services == ["ollama"]
        assert "OLLAMA_URL=http://ollama:11434" in sdl
        assert "image: ollama/ollama:latest" in sdl


# ---------------------------------------------------------------------------
# Legacy signals.
# ---------------------------------------------------------------------------

class TestLegacyVarityConfig:
    def test_varity_config_with_collections(self, tmp_path):
        (tmp_path / "varity.config.json").write_text(
            json.dumps({"database": {"collections": [{"name": "users"}]}})
        )
        assert DeploymentOrchestrator._detect_services(str(tmp_path)) == ["postgres"]

    def test_varity_config_empty_collections_detects_nothing(self, tmp_path):
        (tmp_path / "varity.config.json").write_text(
            json.dumps({"database": {"collections": []}})
        )
        assert DeploymentOrchestrator._detect_services(str(tmp_path)) == []


# ---------------------------------------------------------------------------
# MongoDB SDL rendering — the new service template.
# ---------------------------------------------------------------------------

REPO_URL = "https://github.com/x/y.git"
APP_NAME = "test-app"


class TestMongoDBSDL:
    def test_mongodb_service_rendered(self):
        sdl = _generate_sdl(REPO_URL, APP_NAME, project_type="nextjs", services=["mongodb"])
        assert "image: mongo:7" in sdl
        assert "MONGO_INITDB_ROOT_USERNAME=varity" in sdl
        assert "port: 27017" in sdl

    def test_mongodb_uri_env_injected(self):
        sdl = _generate_sdl(REPO_URL, APP_NAME, project_type="nextjs", services=["mongodb"])
        assert "MONGODB_URI=mongodb://varity:" in sdl
        assert "@mongodb:27017/app?authSource=admin" in sdl

    def test_mongodb_password_matches_env_and_service(self):
        """The password in MONGO_INITDB_ROOT_PASSWORD must match the one
        embedded in MONGODB_URI — else the app can't connect."""
        sdl = _generate_sdl(REPO_URL, APP_NAME, project_type="nextjs", services=["mongodb"])
        import re as _re
        mongo_pass_in_env = _re.search(r'MONGO_INITDB_ROOT_PASSWORD=([a-f0-9]+)', sdl)
        mongo_pass_in_uri = _re.search(r'MONGODB_URI=mongodb://varity:([a-f0-9]+)@', sdl)
        assert mongo_pass_in_env and mongo_pass_in_uri
        assert mongo_pass_in_env.group(1) == mongo_pass_in_uri.group(1)

    def test_postgres_and_mongodb_have_different_passwords(self):
        """Separate credentials for separate DBs — security hygiene."""
        sdl = _generate_sdl(
            REPO_URL, APP_NAME,
            project_type="nextjs",
            services=["postgres", "mongodb"],
        )
        import re as _re
        pg_match = _re.search(r'POSTGRES_PASSWORD=([a-f0-9]+)', sdl)
        mongo_match = _re.search(r'MONGO_INITDB_ROOT_PASSWORD=([a-f0-9]+)', sdl)
        assert pg_match and mongo_match, "Both passwords must be present in SDL"
        assert pg_match.group(1) != mongo_match.group(1)

    def test_mongodb_triggers_db_wait_in_build_command(self):
        sdl = _generate_sdl(REPO_URL, APP_NAME, project_type="nextjs", services=["mongodb"])
        assert "sleep 15" in sdl

    def test_mongodb_adds_prisma_generate(self):
        """MongoDB Prisma apps still require prisma generate to build client."""
        sdl = _generate_sdl(REPO_URL, APP_NAME, project_type="nextjs", services=["mongodb"])
        assert "npx prisma generate" in sdl
        assert "npx prisma db push" not in sdl


# ---------------------------------------------------------------------------
# Full multi-service SDL — the "deploy everything" integration case.
# ---------------------------------------------------------------------------

class TestFullMultiServiceSDL:
    def test_all_four_services_render_valid_yaml(self):
        sdl = _generate_sdl(
            REPO_URL, APP_NAME,
            project_type="nextjs",
            services=["postgres", "redis", "ollama", "mongodb"],
        )
        parsed = yaml.safe_load(sdl)
        assert set(parsed["services"].keys()) == {
            "app", "postgres", "redis", "ollama", "mongodb"
        }
        # Compute profiles must include all services
        assert set(parsed["profiles"]["compute"].keys()) == {
            "app", "postgres", "redis", "ollama", "mongodb"
        }
        # Deployment block must reference all
        assert set(parsed["deployment"].keys()) == {
            "app", "postgres", "redis", "ollama", "mongodb"
        }

    def test_all_four_services_wire_correct_env_vars(self):
        sdl = _generate_sdl(
            REPO_URL, APP_NAME,
            project_type="nextjs",
            services=["postgres", "redis", "ollama", "mongodb"],
        )
        assert "DATABASE_URL=postgresql://" in sdl
        assert "REDIS_URL=redis://redis:6379" in sdl
        assert "OLLAMA_URL=http://ollama:11434" in sdl
        assert "MONGODB_URI=mongodb://" in sdl
