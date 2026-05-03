"""
Phase 4 verification — Bug F fixed. User-supplied env vars (API keys, JWT
secrets, app config) now flow from the local .env file through the
orchestrator into the Akash SDL.

This is the difference between 'deployed but broken — my app can't find
OPENAI_API_KEY' and a working AI agent. Non-technical users store their
keys in .env.local (Next.js convention) without knowing anything about
deployment. Varity must pick them up automatically.

Also validates platform-leakage filtering — Vercel migrants often carry
VERCEL_* vars in their .env; those are meaningless on Akash and must be
auto-stripped to avoid confusion.
"""

import json

import pytest
import yaml

from varitykit.core.deployment_orchestrator import DeploymentOrchestrator
from varitykit.services.akash_deploy_service import (
    _format_user_env_entry,
    _generate_sdl,
)


# ---------------------------------------------------------------------------
# .env parsing — the low-level file reader.
# ---------------------------------------------------------------------------

class TestParseEnvFile:
    def test_simple_key_value(self, tmp_path):
        env = tmp_path / ".env"
        env.write_text("FOO=bar\nBAZ=qux\n")
        out = DeploymentOrchestrator._parse_env_file(env)
        assert out == {"FOO": "bar", "BAZ": "qux"}

    def test_skips_comments_and_blanks(self, tmp_path):
        env = tmp_path / ".env"
        env.write_text(
            "# this is a comment\n"
            "\n"
            "FOO=bar\n"
            "# another comment\n"
            "BAZ=qux\n"
        )
        out = DeploymentOrchestrator._parse_env_file(env)
        assert out == {"FOO": "bar", "BAZ": "qux"}

    def test_strips_double_quotes(self, tmp_path):
        env = tmp_path / ".env"
        env.write_text('FOO="hello world"\n')
        out = DeploymentOrchestrator._parse_env_file(env)
        assert out == {"FOO": "hello world"}

    def test_strips_single_quotes(self, tmp_path):
        env = tmp_path / ".env"
        env.write_text("FOO='hello world'\n")
        out = DeploymentOrchestrator._parse_env_file(env)
        assert out == {"FOO": "hello world"}

    def test_handles_export_prefix(self, tmp_path):
        env = tmp_path / ".env"
        env.write_text("export FOO=bar\n")
        out = DeploymentOrchestrator._parse_env_file(env)
        assert out == {"FOO": "bar"}

    def test_values_with_equals_signs(self, tmp_path):
        """e.g. base64 values, connection strings with query params."""
        env = tmp_path / ".env"
        env.write_text("TOKEN=abc==\nURL=postgres://user:pass@host:5432/db?sslmode=require\n")
        out = DeploymentOrchestrator._parse_env_file(env)
        assert out["TOKEN"] == "abc=="
        assert out["URL"] == "postgres://user:pass@host:5432/db?sslmode=require"

    def test_missing_file_returns_empty(self, tmp_path):
        out = DeploymentOrchestrator._parse_env_file(tmp_path / "nonexistent.env")
        assert out == {}

    def test_line_without_equals_is_skipped(self, tmp_path):
        env = tmp_path / ".env"
        env.write_text("VALID=yes\ninvalid line with no equals\nOTHER=also\n")
        out = DeploymentOrchestrator._parse_env_file(env)
        assert out == {"VALID": "yes", "OTHER": "also"}


# ---------------------------------------------------------------------------
# Filter logic — what gets forwarded, what doesn't.
# ---------------------------------------------------------------------------

class TestIsUserEnvKey:
    def test_accepts_ordinary_keys(self):
        for k in ("OPENAI_API_KEY", "JWT_SECRET", "FOO", "_UNDER", "MY_APP_TOKEN"):
            assert DeploymentOrchestrator._is_user_env_key(k), f"should accept {k}"

    def test_rejects_empty_and_malformed(self):
        # Empty
        assert not DeploymentOrchestrator._is_user_env_key("")
        # Numeric start — invalid shell var name
        assert not DeploymentOrchestrator._is_user_env_key("1FOO")

    @pytest.mark.parametrize("reserved", [
        "NODE_ENV", "PORT", "NODE_OPTIONS",
        "PYTHONUNBUFFERED",
        "DATABASE_URL", "REDIS_URL", "OLLAMA_URL", "MONGODB_URI",
        "POSTGRES_USER", "POSTGRES_PASSWORD", "POSTGRES_DB", "PGDATA",
        "MONGO_INITDB_ROOT_USERNAME", "MONGO_INITDB_ROOT_PASSWORD",
        "MONGO_INITDB_DATABASE",
        "APP_NAME",
    ])
    def test_rejects_varity_reserved_keys(self, reserved):
        assert not DeploymentOrchestrator._is_user_env_key(reserved)

    @pytest.mark.parametrize("leak", [
        "VERCEL_URL", "VERCEL_ENV", "VERCEL_GIT_COMMIT_SHA",
        "AWS_ACCESS_KEY_ID", "AWS_REGION",
        "RAILWAY_STATIC_URL", "RENDER_SERVICE_ID",
        "NETLIFY_BUILD_ID", "FLY_APP_NAME",
        "NEXT_RUNTIME",
    ])
    def test_rejects_platform_leakage(self, leak):
        assert not DeploymentOrchestrator._is_user_env_key(leak), (
            f"{leak} is platform-leakage and must not ship to Varity"
        )

    def test_accepts_next_public_vars(self):
        """NEXT_PUBLIC_* are user-defined runtime vars, NOT platform vars
        (despite the NEXT prefix). Must forward."""
        assert DeploymentOrchestrator._is_user_env_key("NEXT_PUBLIC_API_URL")
        assert DeploymentOrchestrator._is_user_env_key("NEXT_PUBLIC_ANALYTICS_ID")


# ---------------------------------------------------------------------------
# File precedence — .env.varity wins, .env.local next, .env fallback.
# ---------------------------------------------------------------------------

class TestEnvFilePrecedence:
    def test_env_varity_wins(self, tmp_path):
        (tmp_path / ".env.varity").write_text("SOURCE=varity\n")
        (tmp_path / ".env.local").write_text("SOURCE=local\n")
        (tmp_path / ".env").write_text("SOURCE=plain\n")
        out = DeploymentOrchestrator._load_env_vars(str(tmp_path))
        assert out == {"SOURCE": "varity"}

    def test_env_local_wins_over_env(self, tmp_path):
        (tmp_path / ".env.local").write_text("SOURCE=local\n")
        (tmp_path / ".env").write_text("SOURCE=plain\n")
        out = DeploymentOrchestrator._load_env_vars(str(tmp_path))
        assert out == {"SOURCE": "local"}

    def test_env_plain_fallback(self, tmp_path):
        (tmp_path / ".env").write_text("SOURCE=plain\n")
        out = DeploymentOrchestrator._load_env_vars(str(tmp_path))
        assert out == {"SOURCE": "plain"}

    def test_no_files_returns_empty(self, tmp_path):
        out = DeploymentOrchestrator._load_env_vars(str(tmp_path))
        assert out == {}


# ---------------------------------------------------------------------------
# End-to-end filter — orchestrator.load_env_vars applies filters correctly.
# ---------------------------------------------------------------------------

class TestLoadEnvVarsFiltering:
    def test_filters_vercel_leakage_for_migrants(self, tmp_path):
        """Typical Vercel .env.local has VERCEL_URL, VERCEL_ENV, etc. after
        `vercel env pull`. These must NOT flow to Varity."""
        (tmp_path / ".env.local").write_text(
            "OPENAI_API_KEY=sk-real\n"
            "VERCEL_URL=myapp.vercel.app\n"
            "VERCEL_ENV=production\n"
            "VERCEL_GIT_COMMIT_SHA=abc123\n"
            "JWT_SECRET=mysecret\n"
        )
        out = DeploymentOrchestrator._load_env_vars(str(tmp_path))
        assert out == {"OPENAI_API_KEY": "sk-real", "JWT_SECRET": "mysecret"}

    def test_filters_varity_reserved_keys(self, tmp_path):
        """User's local DATABASE_URL must NEVER override Varity's generated one."""
        (tmp_path / ".env.local").write_text(
            "DATABASE_URL=postgres://user:pass@my-local-db:5432/dev\n"
            "OPENAI_API_KEY=sk-real\n"
            "PORT=4000\n"
        )
        out = DeploymentOrchestrator._load_env_vars(str(tmp_path))
        assert "DATABASE_URL" not in out
        assert "PORT" not in out
        assert out["OPENAI_API_KEY"] == "sk-real"


# ---------------------------------------------------------------------------
# Value escaping — quotes, backslashes, dollar signs, weird chars survive.
# ---------------------------------------------------------------------------

class TestEnvValueEscaping:
    def test_simple_value(self):
        assert _format_user_env_entry("KEY", "value") == "      - 'KEY=value'"

    def test_value_with_single_quote(self):
        """Single quotes must be doubled in YAML single-quoted strings."""
        assert _format_user_env_entry("KEY", "it's a value") == "      - 'KEY=it''s a value'"

    def test_value_with_double_quote(self):
        """Double quotes pass through single-quoted YAML untouched."""
        assert _format_user_env_entry("KEY", 'say "hi"') == "      - 'KEY=say \"hi\"'"

    def test_value_with_dollar_sign(self):
        """No shell interpolation — $VAR must survive literally."""
        assert _format_user_env_entry("KEY", "$SECRET") == "      - 'KEY=$SECRET'"

    def test_value_with_backslash(self):
        """Backslashes pass through single-quoted YAML literally."""
        assert _format_user_env_entry("KEY", "a\\b") == "      - 'KEY=a\\b'"

    def test_value_with_colon(self):
        """Colons are fine in single-quoted YAML."""
        assert _format_user_env_entry("KEY", "http://host:8080") == "      - 'KEY=http://host:8080'"

    def test_multiline_value_raises(self):
        with pytest.raises(ValueError) as exc:
            _format_user_env_entry("KEY", "line1\nline2")
        assert "newline" in str(exc.value).lower()
        assert "KEY" in str(exc.value)

    def test_carriage_return_raises(self):
        with pytest.raises(ValueError):
            _format_user_env_entry("KEY", "line1\rline2")


# ---------------------------------------------------------------------------
# SDL integration — user env vars actually appear + parse as valid YAML
# even with hostile characters.
# ---------------------------------------------------------------------------

class TestSDLWithUserEnvVars:
    def test_env_vars_appear_in_sdl(self):
        sdl = _generate_sdl(
            "https://github.com/x/y.git", "app",
            project_type="nextjs",
            env_vars={"OPENAI_API_KEY": "sk-abc123", "JWT_SECRET": "mysecret"},
        )
        assert "OPENAI_API_KEY=sk-abc123" in sdl
        assert "JWT_SECRET=mysecret" in sdl

    def test_hostile_values_still_yield_valid_yaml(self):
        """The full SDL must parse cleanly even with quotes, $, \\ in values."""
        sdl = _generate_sdl(
            "https://github.com/x/y.git", "app",
            project_type="nextjs",
            env_vars={
                "QUOTED": 'has "double" and \'single\' quotes',
                "DOLLAR": "$NOT_INTERPOLATED",
                "SLASH": "a\\b\\c",
                "COLON": "http://host:1234",
            },
        )
        parsed = yaml.safe_load(sdl)
        # The env list is just strings of "KEY=VALUE" — parser accepts them.
        app_env = parsed["services"]["app"]["env"]
        assert any("QUOTED=" in str(e) and 'double' in str(e) for e in app_env)
        assert any("DOLLAR=$NOT_INTERPOLATED" in str(e) for e in app_env)
        assert any("SLASH=a\\b\\c" in str(e) for e in app_env)

    def test_multiline_value_in_env_vars_raises(self):
        with pytest.raises(ValueError):
            _generate_sdl(
                "https://github.com/x/y.git", "app",
                project_type="nextjs",
                env_vars={"BAD": "line1\nline2"},
            )


# ---------------------------------------------------------------------------
# End-to-end wiring — orchestrator reads .env and passes to deploy().
# ---------------------------------------------------------------------------

class TestOrchestratorEnvPassthrough:
    def test_env_local_values_flow_through_to_deploy(self, tmp_path):
        from unittest.mock import patch, MagicMock
        from varitykit.core.types import ProjectInfo

        (tmp_path / "package.json").write_text(
            json.dumps({"dependencies": {"next": "^14"}})
        )
        (tmp_path / ".env.local").write_text(
            "OPENAI_API_KEY=sk-real-key\n"
            "STRIPE_SECRET=sk_test_abc\n"
            "VERCEL_URL=stale.vercel.app\n"  # must be filtered
            "DATABASE_URL=postgres://local\n"  # must be filtered (reserved)
        )

        project_info = ProjectInfo(
            name="demo", project_type="nextjs",
            framework_version="14.0.0", build_command="", output_dir=".next",
            package_manager="npm", has_backend=True,
        )

        orchestrator = DeploymentOrchestrator(verbose=False)

        with patch("varitykit.services.akash_deploy_service.deploy") as mock_deploy, \
             patch("varitykit.services.akash_deploy_service.detect_python_start_command", return_value=None):
            mock_deploy.return_value = MagicMock(success=True)
            orchestrator._deploy_to_akash_service(
                project_path=str(tmp_path),
                project_info=project_info,
                custom_name="demo",
                github_repo_url="https://github.com/x/y.git",
            )

        env_passed = mock_deploy.call_args.kwargs["env_vars"]
        # User keys: forwarded
        assert env_passed["OPENAI_API_KEY"] == "sk-real-key"
        assert env_passed["STRIPE_SECRET"] == "sk_test_abc"
        # Platform leakage: filtered
        assert "VERCEL_URL" not in env_passed
        # Reserved: filtered
        assert "DATABASE_URL" not in env_passed

    def test_no_env_file_sends_empty_dict(self, tmp_path):
        from unittest.mock import patch, MagicMock
        from varitykit.core.types import ProjectInfo

        (tmp_path / "package.json").write_text('{"dependencies": {"next": "^14"}}')

        project_info = ProjectInfo(
            name="demo", project_type="nextjs",
            framework_version="14.0.0", build_command="", output_dir=".next",
            package_manager="npm", has_backend=True,
        )

        orchestrator = DeploymentOrchestrator(verbose=False)

        with patch("varitykit.services.akash_deploy_service.deploy") as mock_deploy, \
             patch("varitykit.services.akash_deploy_service.detect_python_start_command", return_value=None):
            mock_deploy.return_value = MagicMock(success=True)
            orchestrator._deploy_to_akash_service(
                project_path=str(tmp_path),
                project_info=project_info,
                custom_name="demo",
                github_repo_url="https://github.com/x/y.git",
            )

        assert mock_deploy.call_args.kwargs["env_vars"] == {}
