"""
Phase 3 verification — Bug E fixed. Postgres sidecar now uses the pgvector
image and auto-creates the `vector` extension on first init, so AI-agent apps
storing embeddings (OpenAI, Anthropic, etc.) Just Work without the user
running CREATE EXTENSION themselves.

Why auto-enable matters: the target user is non-technical. They drop
`@langchain/openai` + a pgvector-backed schema into their app, deploy, and it
works. They never touch psql. If we only swapped the image without
auto-enabling, every Prisma/Drizzle migration touching a `vector` column
would fail on the first deploy with a cryptic error.
"""

import yaml

from varitykit.services.akash_deploy_service import _generate_sdl


REPO_URL = "https://github.com/x/y.git"
APP_NAME = "ai-agent"


class TestPgvectorImage:
    def test_uses_pgvector_image(self):
        sdl = _generate_sdl(REPO_URL, APP_NAME, project_type="nextjs", services=["postgres"])
        assert "image: pgvector/pgvector:pg15" in sdl

    def test_no_longer_uses_plain_postgres_image(self):
        """Regression guard — we must NOT silently ship postgres:15-alpine,
        because AI agents would fail on CREATE EXTENSION vector."""
        sdl = _generate_sdl(REPO_URL, APP_NAME, project_type="nextjs", services=["postgres"])
        assert "image: postgres:15-alpine" not in sdl
        assert "image: postgres:15\n" not in sdl

    def test_python_projects_also_get_pgvector(self):
        """The image swap must apply to every language — AI agents are most
        commonly built in Python (FastAPI + LangChain)."""
        sdl = _generate_sdl(REPO_URL, APP_NAME, project_type="fastapi", port=8000, services=["postgres"])
        assert "image: pgvector/pgvector:pg15" in sdl


class TestVectorExtensionAutoEnabled:
    def test_init_script_creates_vector_extension(self):
        """The override command must seed /docker-entrypoint-initdb.d/ with
        a CREATE EXTENSION statement before starting postgres."""
        sdl = _generate_sdl(REPO_URL, APP_NAME, project_type="nextjs", services=["postgres"])
        assert "CREATE EXTENSION IF NOT EXISTS vector" in sdl
        assert "/docker-entrypoint-initdb.d/00-pgvector.sql" in sdl

    def test_init_script_runs_before_postgres(self):
        """The echo must complete BEFORE docker-entrypoint.sh postgres runs —
        otherwise the SQL file isn't there when initdb scans the directory."""
        sdl = _generate_sdl(REPO_URL, APP_NAME, project_type="nextjs", services=["postgres"])
        # The whole override is on a single SDL line
        parsed = yaml.safe_load(sdl)
        cmd_lines = parsed["services"]["postgres"]["command"]
        # Find the shell invocation
        shell_line = cmd_lines[-1]
        assert "echo" in shell_line
        assert "docker-entrypoint.sh postgres" in shell_line
        # echo must come BEFORE docker-entrypoint.sh in the shell command
        assert shell_line.index("echo") < shell_line.index("docker-entrypoint.sh")

    def test_idempotent_create_extension(self):
        """IF NOT EXISTS so redeploys don't fail on an existing extension."""
        sdl = _generate_sdl(REPO_URL, APP_NAME, project_type="nextjs", services=["postgres"])
        assert "IF NOT EXISTS vector" in sdl


class TestPostgresBehaviorPreserved:
    """Nothing from Phase 1/2 should regress — auth, env, wiring all intact."""

    def test_postgres_user_and_db_unchanged(self):
        sdl = _generate_sdl(REPO_URL, APP_NAME, project_type="nextjs", services=["postgres"])
        assert "POSTGRES_USER=varity" in sdl
        assert "POSTGRES_DB=app" in sdl

    def test_database_url_still_wired(self):
        sdl = _generate_sdl(REPO_URL, APP_NAME, project_type="nextjs", services=["postgres"])
        assert "DATABASE_URL=postgresql://varity:" in sdl
        assert "@postgres:5432/app" in sdl

    def test_port_still_5432(self):
        sdl = _generate_sdl(REPO_URL, APP_NAME, project_type="nextjs", services=["postgres"])
        parsed = yaml.safe_load(sdl)
        expose = parsed["services"]["postgres"]["expose"]
        assert expose[0]["port"] == 5432

    def test_prisma_commands_still_run_on_node(self):
        sdl = _generate_sdl(REPO_URL, APP_NAME, project_type="nextjs", services=["postgres"])
        assert "npx prisma generate" in sdl
        assert "npx prisma db push" in sdl

    def test_password_interpolated_correctly(self):
        sdl = _generate_sdl(REPO_URL, APP_NAME, project_type="nextjs", services=["postgres"])
        import re
        env_pw = re.search(r'POSTGRES_PASSWORD=([a-f0-9]+)', sdl)
        url_pw = re.search(r'DATABASE_URL=postgresql://varity:([a-f0-9]+)@', sdl)
        assert env_pw and url_pw
        assert env_pw.group(1) == url_pw.group(1)


class TestFullSDLStillValid:
    """After image+command swap, the complete SDL must still parse as YAML
    and include all expected structural elements."""

    def test_postgres_only_sdl_parses(self):
        sdl = _generate_sdl(REPO_URL, APP_NAME, project_type="nextjs", services=["postgres"])
        parsed = yaml.safe_load(sdl)
        assert parsed["services"]["postgres"]["image"] == "pgvector/pgvector:pg15"

    def test_multi_service_sdl_parses_with_pgvector(self):
        sdl = _generate_sdl(
            REPO_URL, APP_NAME,
            project_type="nextjs",
            services=["postgres", "redis", "ollama", "mongodb"],
        )
        parsed = yaml.safe_load(sdl)
        assert parsed["services"]["postgres"]["image"] == "pgvector/pgvector:pg15"
        # Other services unchanged
        assert parsed["services"]["redis"]["image"] == "redis:7-alpine"
        assert parsed["services"]["mongodb"]["image"] == "mongo:7"

    def test_command_override_has_sh_c_form(self):
        """The postgres command must be the [sh, -c, "..."] form that
        docker-entrypoint expects to be overridable."""
        sdl = _generate_sdl(REPO_URL, APP_NAME, project_type="nextjs", services=["postgres"])
        parsed = yaml.safe_load(sdl)
        cmd = parsed["services"]["postgres"]["command"]
        assert cmd[0] == "sh"
        assert cmd[1] == "-c"
        assert isinstance(cmd[2], str) and len(cmd[2]) > 0


class TestNoPostgresServiceBehavior:
    """When postgres isn't in services, the pgvector change must not affect
    SDL generation at all."""

    def test_no_postgres_means_no_postgres_section(self):
        sdl = _generate_sdl(REPO_URL, APP_NAME, project_type="nextjs", services=["redis"])
        assert "pgvector" not in sdl
        assert "postgres:" not in sdl.replace("postgres://", "")  # ignore any URL refs

    def test_no_services_means_no_postgres(self):
        sdl = _generate_sdl(REPO_URL, APP_NAME, project_type="nextjs", services=[])
        assert "pgvector" not in sdl
