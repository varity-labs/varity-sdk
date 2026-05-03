"""
Phase 5 verification — Vercel → Varity migration.

The migrate module must:
  1. Detect every Vercel-ism we know how to handle (vercel.json, next.config
     image optimization, @vercel/* packages, env renames, edge runtime,
     backend directories).
  2. Apply codemods idempotently and reversibly.
  3. Produce a realistic migration plan for a real-world repo
     (varity-labs/generic-template-dashboard-style structure).

Non-technical UX bar: zero manual SQL, zero manual file edits, zero platform
jargon in output. If a test here breaks, a non-technical user will stall.
"""

import json
from unittest.mock import MagicMock, patch

import pytest
from click.testing import CliRunner

from varitykit.migrate import analyze, apply
from varitykit.migrate.codemods import rollback


# ---------------------------------------------------------------------------
# Detector — scans a repo for Vercel-isms.
# ---------------------------------------------------------------------------

class TestDetectorVercelJson:
    def test_detects_vercel_json(self, tmp_path):
        (tmp_path / "vercel.json").write_text('{"framework":"nextjs"}')
        report = analyze(tmp_path)
        assert report.has_vercel_json
        assert report.vercel_json_content == {"framework": "nextjs"}
        assert report.has_changes

    def test_no_vercel_json_no_drama(self, tmp_path):
        report = analyze(tmp_path)
        assert not report.has_vercel_json
        assert not report.has_changes

    def test_malformed_vercel_json_warns(self, tmp_path):
        (tmp_path / "vercel.json").write_text("not valid json {{")
        report = analyze(tmp_path)
        assert report.has_vercel_json  # File exists
        assert any("vercel.json" in w for w in report.warnings)


class TestDetectorNextConfig:
    def test_detects_missing_unoptimized(self, tmp_path):
        (tmp_path / "next.config.js").write_text(
            "const config = { reactStrictMode: true };\nexport default config;"
        )
        report = analyze(tmp_path)
        assert report.next_config_needs_images_unoptimized
        assert report.next_config_path == tmp_path / "next.config.js"

    def test_detects_mjs_variant(self, tmp_path):
        (tmp_path / "next.config.mjs").write_text("export default { reactStrictMode: true };")
        report = analyze(tmp_path)
        assert report.next_config_path == tmp_path / "next.config.mjs"

    def test_detects_ts_variant(self, tmp_path):
        (tmp_path / "next.config.ts").write_text(
            "import type { NextConfig } from 'next'; const c: NextConfig = {}; export default c;"
        )
        report = analyze(tmp_path)
        assert report.next_config_path == tmp_path / "next.config.ts"

    def test_already_unoptimized_no_change(self, tmp_path):
        (tmp_path / "next.config.js").write_text(
            "const config = { images: { unoptimized: true } };\nexport default config;"
        )
        report = analyze(tmp_path)
        assert not report.next_config_needs_images_unoptimized


class TestDetectorVercelPackages:
    @pytest.mark.parametrize("pkg,replacement", [
        ("@vercel/postgres", "pg"),
        ("@vercel/kv", "redis (ioredis)"),
        ("@vercel/blob", "S3-compatible storage (future: native support)"),
        ("@vercel/analytics", None),
        ("@vercel/speed-insights", None),
        ("@vercel/og", None),
    ])
    def test_detects_vercel_package(self, tmp_path, pkg, replacement):
        (tmp_path / "package.json").write_text(json.dumps({
            "dependencies": {pkg: "^1.0.0", "next": "^14"}
        }))
        report = analyze(tmp_path)
        assert pkg in report.vercel_packages_found
        assert report.vercel_package_replacements[pkg] == replacement


class TestDetectorEnvRenames:
    def test_postgres_url_renamed_to_database_url(self, tmp_path):
        (tmp_path / ".env.local").write_text("POSTGRES_URL=postgres://localhost\n")
        report = analyze(tmp_path)
        assert report.env_renames_needed.get("POSTGRES_URL") == "DATABASE_URL"

    def test_kv_url_renamed_to_redis_url(self, tmp_path):
        (tmp_path / ".env").write_text("KV_URL=redis://localhost\n")
        report = analyze(tmp_path)
        assert report.env_renames_needed.get("KV_URL") == "REDIS_URL"


class TestDetectorBackend:
    def test_detects_fastapi_backend(self, tmp_path):
        backend = tmp_path / "backend"
        backend.mkdir()
        (backend / "requirements.txt").write_text("fastapi==0.104.1\nuvicorn\n")
        report = analyze(tmp_path)
        assert report.has_backend_directory
        assert report.backend_framework == "fastapi"
        assert report.needs_multi_service_deploy
        assert any("backend" in w.lower() for w in report.warnings)

    def test_detects_django_backend(self, tmp_path):
        backend = tmp_path / "backend"
        backend.mkdir()
        (backend / "requirements.txt").write_text("django==5.0\n")
        report = analyze(tmp_path)
        assert report.backend_framework == "django"

    def test_no_backend_dir_no_multi_service(self, tmp_path):
        report = analyze(tmp_path)
        assert not report.has_backend_directory
        assert not report.needs_multi_service_deploy


class TestDetectorEdgeRuntime:
    def test_detects_edge_runtime_in_route(self, tmp_path):
        api = tmp_path / "app" / "api" / "hello"
        api.mkdir(parents=True)
        (api / "route.ts").write_text(
            "export const runtime = 'edge';\nexport async function GET() { return new Response('hi'); }"
        )
        report = analyze(tmp_path)
        assert report.has_edge_runtime_usage
        assert len(report.edge_runtime_file_hits) == 1
        assert any("edge" in w.lower() for w in report.warnings)

    def test_skips_node_modules(self, tmp_path):
        nm = tmp_path / "node_modules" / "some-pkg"
        nm.mkdir(parents=True)
        (nm / "index.ts").write_text('export const runtime = "edge"')
        report = analyze(tmp_path)
        assert not report.has_edge_runtime_usage


# ---------------------------------------------------------------------------
# Codemods — apply transforms.
# ---------------------------------------------------------------------------

class TestCodemodRemoveVercelJson:
    def test_removes_and_backs_up(self, tmp_path):
        (tmp_path / "vercel.json").write_text('{"framework":"nextjs"}')
        report = analyze(tmp_path)
        apply(report, dry_run=False)
        assert not (tmp_path / "vercel.json").exists()
        assert (tmp_path / ".vercel-migration-backup" / "vercel.json").exists()

    def test_dry_run_doesnt_remove(self, tmp_path):
        (tmp_path / "vercel.json").write_text('{"framework":"nextjs"}')
        report = analyze(tmp_path)
        apply(report, dry_run=True)
        assert (tmp_path / "vercel.json").exists()
        assert not (tmp_path / ".vercel-migration-backup").exists()

    def test_warns_about_custom_headers(self, tmp_path):
        (tmp_path / "vercel.json").write_text(
            '{"headers": [{"source":"/api/*","headers":[{"key":"x","value":"y"}]}]}'
        )
        report = analyze(tmp_path)
        changes = apply(report, dry_run=False)
        assert any("headers" in note.lower() or "redirects" in note.lower() for note in changes.notes)


class TestCodemodPatchNextConfig:
    def test_inject_into_existing_images_block(self, tmp_path):
        (tmp_path / "next.config.js").write_text(
            "const config = { images: { formats: ['avif'] } };\nexport default config;"
        )
        report = analyze(tmp_path)
        apply(report, dry_run=False)
        patched = (tmp_path / "next.config.js").read_text()
        assert "unoptimized: true" in patched
        assert "formats: ['avif']" in patched  # Preserved existing config

    def test_inject_without_images_block(self, tmp_path):
        (tmp_path / "next.config.js").write_text(
            "const config = { reactStrictMode: true };\nexport default config;"
        )
        report = analyze(tmp_path)
        apply(report, dry_run=False)
        patched = (tmp_path / "next.config.js").read_text()
        assert "unoptimized: true" in patched
        assert "reactStrictMode: true" in patched  # Preserved

    def test_inject_into_export_default_object(self, tmp_path):
        (tmp_path / "next.config.mjs").write_text("export default { reactStrictMode: true };\n")
        report = analyze(tmp_path)
        apply(report, dry_run=False)
        patched = (tmp_path / "next.config.mjs").read_text()
        assert "unoptimized: true" in patched
        assert "output: 'standalone'" in patched
        assert "could not auto-inject" not in patched

    def test_inject_into_empty_wrapper_call(self, tmp_path):
        (tmp_path / "next.config.js").write_text(
            "const withNextra = require('nextra')('nextra-theme-blog', './theme.config.js')\n"
            "module.exports = withNextra()\n"
        )
        report = analyze(tmp_path)
        apply(report, dry_run=False)
        patched = (tmp_path / "next.config.js").read_text()
        assert "module.exports = withNextra({" in patched
        assert "unoptimized: true" in patched
        assert "output: 'standalone'" in patched
        assert "could not auto-inject" not in patched

    def test_flip_existing_false_to_true(self, tmp_path):
        (tmp_path / "next.config.js").write_text(
            "const config = { images: { unoptimized: false } };\nexport default config;"
        )
        report = analyze(tmp_path)
        apply(report, dry_run=False)
        patched = (tmp_path / "next.config.js").read_text()
        assert "unoptimized: true" in patched
        assert "unoptimized: false" not in patched

    def test_idempotent(self, tmp_path):
        (tmp_path / "next.config.js").write_text(
            "const config = { reactStrictMode: true };\nexport default config;"
        )
        # Apply twice — second run should be a no-op (no double-injection)
        apply(analyze(tmp_path), dry_run=False)
        apply(analyze(tmp_path), dry_run=False)
        content = (tmp_path / "next.config.js").read_text()
        assert content.count("unoptimized: true") == 1

    def test_updates_stale_tsconfig_target(self, tmp_path):
        (tmp_path / "next.config.js").write_text(
            "const config = { reactStrictMode: true };\nexport default config;"
        )
        (tmp_path / "tsconfig.json").write_text(json.dumps({
            "compilerOptions": {
                "target": "es5",
                "lib": ["dom", "dom.iterable", "esnext"],
            }
        }))
        changes = apply(analyze(tmp_path), dry_run=False)
        patched = json.loads((tmp_path / "tsconfig.json").read_text())
        assert patched["compilerOptions"]["target"] == "ES2017"
        assert tmp_path / "tsconfig.json" in changes.files_modified
        assert (tmp_path / ".vercel-migration-backup" / "tsconfig.json").exists()

    def test_leaves_modern_tsconfig_target(self, tmp_path):
        (tmp_path / "next.config.js").write_text(
            "const config = { reactStrictMode: true };\nexport default config;"
        )
        (tmp_path / "tsconfig.json").write_text(json.dumps({
            "compilerOptions": {
                "target": "ES2020",
            }
        }))
        apply(analyze(tmp_path), dry_run=False)
        patched = json.loads((tmp_path / "tsconfig.json").read_text())
        assert patched["compilerOptions"]["target"] == "ES2020"


class TestCodemodRemoveVercelPackages:
    def test_removes_from_dependencies(self, tmp_path):
        (tmp_path / "package.json").write_text(json.dumps({
            "dependencies": {
                "@vercel/postgres": "^1.0.0",
                "@vercel/kv": "^1.0.0",
                "next": "^14",
            }
        }))
        report = analyze(tmp_path)
        changes = apply(report, dry_run=False)
        data = json.loads((tmp_path / "package.json").read_text())
        assert "@vercel/postgres" not in data["dependencies"]
        assert "@vercel/kv" not in data["dependencies"]
        assert "next" in data["dependencies"]  # Preserved non-Vercel
        assert "@vercel/postgres" in changes.package_json_changes

    def test_keeps_other_fields_intact(self, tmp_path):
        (tmp_path / "package.json").write_text(json.dumps({
            "name": "test-app",
            "version": "1.0.0",
            "scripts": {"build": "next build"},
            "dependencies": {"@vercel/analytics": "^1.0.0"},
        }))
        report = analyze(tmp_path)
        apply(report, dry_run=False)
        data = json.loads((tmp_path / "package.json").read_text())
        assert data["name"] == "test-app"
        assert data["scripts"]["build"] == "next build"


class TestCodemodEnvRenames:
    def test_renames_postgres_url(self, tmp_path):
        (tmp_path / ".env.local").write_text(
            "POSTGRES_URL=postgres://localhost:5432/db\nOTHER=value\n"
        )
        report = analyze(tmp_path)
        apply(report, dry_run=False)
        content = (tmp_path / ".env.local").read_text()
        assert "DATABASE_URL=postgres://localhost:5432/db" in content
        assert "POSTGRES_URL=" not in content
        assert "OTHER=value" in content

    def test_preserves_export_prefix(self, tmp_path):
        (tmp_path / ".env").write_text("export KV_URL=redis://localhost\n")
        report = analyze(tmp_path)
        apply(report, dry_run=False)
        content = (tmp_path / ".env").read_text()
        assert "export REDIS_URL=redis://localhost" in content

    def test_rename_does_not_touch_values_containing_old_name(self, tmp_path):
        """POSTGRES_URL appearing in a comment or value must not be renamed."""
        (tmp_path / ".env").write_text(
            "# old: POSTGRES_URL (renamed)\nDATABASE_URL=postgres://localhost\n"
        )
        report = analyze(tmp_path)
        # No renames needed (old key not present as a real key)
        assert "POSTGRES_URL" not in report.env_renames_needed
        # Content should remain unchanged even after apply
        apply(report, dry_run=False)
        assert "# old: POSTGRES_URL" in (tmp_path / ".env").read_text()


# ---------------------------------------------------------------------------
# Rollback — reverts every codemod.
# ---------------------------------------------------------------------------

class TestRollback:
    def test_rollback_restores_vercel_json(self, tmp_path):
        original = '{"framework":"nextjs"}'
        (tmp_path / "vercel.json").write_text(original)
        apply(analyze(tmp_path), dry_run=False)
        assert not (tmp_path / "vercel.json").exists()

        restored = rollback(tmp_path)
        assert (tmp_path / "vercel.json").exists()
        assert (tmp_path / "vercel.json").read_text() == original
        assert len(restored) >= 1
        # Backup dir must be cleaned up
        assert not (tmp_path / ".vercel-migration-backup").exists()

    def test_rollback_restores_next_config(self, tmp_path):
        original = "const config = { reactStrictMode: true };\nexport default config;"
        (tmp_path / "next.config.js").write_text(original)
        apply(analyze(tmp_path), dry_run=False)
        assert "unoptimized: true" in (tmp_path / "next.config.js").read_text()

        rollback(tmp_path)
        assert (tmp_path / "next.config.js").read_text() == original

    def test_rollback_with_no_backup_is_noop(self, tmp_path):
        restored = rollback(tmp_path)
        assert restored == []


# ---------------------------------------------------------------------------
# Integration — realistic repo shape similar to generic-template-dashboard.
# ---------------------------------------------------------------------------

class TestRealWorldRepoShape:
    def test_multi_service_nextjs_plus_fastapi(self, tmp_path):
        """Mirrors varity-labs/generic-template-dashboard — Next.js 14
        frontend at root with FastAPI backend at /backend."""
        # Root: Next.js
        (tmp_path / "package.json").write_text(json.dumps({
            "name": "dashboard",
            "dependencies": {
                "next": "^14.2.35",
                "react": "^18.2.0",
                "@privy-io/react-auth": "^1.73.0",
            }
        }))
        (tmp_path / "vercel.json").write_text(
            '{"framework":"nextjs","regions":["iad1"]}'
        )
        (tmp_path / "next.config.js").write_text(
            "const config = { reactStrictMode: true, output: 'standalone', "
            "images: { formats: ['avif'] } }; export default config;"
        )
        # Backend: FastAPI
        backend = tmp_path / "backend"
        backend.mkdir()
        (backend / "requirements.txt").write_text("fastapi==0.104.1\nuvicorn\n")

        report = analyze(tmp_path)

        assert report.has_vercel_json
        assert report.next_config_needs_images_unoptimized
        assert report.has_backend_directory
        assert report.backend_framework == "fastapi"
        assert report.needs_multi_service_deploy
        # No @vercel/* deps in this repo — correct detection
        assert report.vercel_packages_found == {}

        changes = apply(report, dry_run=False)
        # Must have removed vercel.json
        assert not (tmp_path / "vercel.json").exists()
        # Must have patched next.config.js with unoptimized
        patched = (tmp_path / "next.config.js").read_text()
        assert "unoptimized: true" in patched
        # Existing settings preserved
        assert "output: 'standalone'" in patched
        assert "formats: ['avif']" in patched
        # Backend untouched
        assert (tmp_path / "backend" / "requirements.txt").exists()
        # Diff recorded
        assert changes.has_changes

    def test_clean_nextjs_repo_no_changes_needed(self, tmp_path):
        """A Next.js repo without any Vercel cruft should pass through clean."""
        (tmp_path / "package.json").write_text(json.dumps({
            "dependencies": {"next": "^14"}
        }))
        (tmp_path / "next.config.js").write_text(
            "const config = { output: 'standalone', images: { unoptimized: true } }; "
            "export default config;"
        )
        report = analyze(tmp_path)
        assert not report.has_changes


# ---------------------------------------------------------------------------
# Source import cleanup (VAR-213/VAR-278 regression).
# ---------------------------------------------------------------------------

class TestSourceImportStripping:
    def test_analytics_import_removed(self, tmp_path):
        """@vercel/analytics import is dropped from .tsx source files."""
        (tmp_path / "package.json").write_text(json.dumps({
            "dependencies": {"@vercel/analytics": "^1.1.1", "next": "^14"},
        }))
        page = tmp_path / "app" / "page.tsx"
        page.parent.mkdir()
        page.write_text(
            "import { Analytics } from '@vercel/analytics/react';\n"
            "export default function Page() { return <Analytics />; }\n"
        )

        report = analyze(tmp_path)
        apply(report, dry_run=False)

        content = page.read_text()
        assert "@vercel/analytics" not in content
        assert "<Analytics />" not in content

    def test_speed_insights_import_removed(self, tmp_path):
        """@vercel/speed-insights import and JSX tag are both dropped."""
        (tmp_path / "package.json").write_text(json.dumps({
            "dependencies": {"@vercel/speed-insights": "^1.0.2", "next": "^14"},
        }))
        page = tmp_path / "pages" / "index.tsx"
        page.parent.mkdir()
        page.write_text(
            "import { SpeedInsights } from '@vercel/speed-insights/next';\n"
            "export default function Home() { return <SpeedInsights />; }\n"
        )

        report = analyze(tmp_path)
        apply(report, dry_run=False)

        content = page.read_text()
        assert "@vercel/speed-insights" not in content
        assert "<SpeedInsights />" not in content

    def test_postgres_import_replaced_with_todo(self, tmp_path):
        """@vercel/postgres import becomes a TODO comment (has a replacement)."""
        (tmp_path / "package.json").write_text(json.dumps({
            "dependencies": {"@vercel/postgres": "^0.7.2", "next": "^14"},
        }))
        lib = tmp_path / "lib" / "db.ts"
        lib.parent.mkdir()
        lib.write_text("import { sql } from '@vercel/postgres';\n")

        report = analyze(tmp_path)
        apply(report, dry_run=False)

        content = lib.read_text()
        assert "@vercel/postgres" not in content or "TODO(varity-migrate)" in content

    def test_commonjs_require_replaced_with_todo(self, tmp_path):
        (tmp_path / "package.json").write_text(json.dumps({
            "dependencies": {"@vercel/blob": "^0.23.0", "next": "^14"},
        }))
        lib = tmp_path / "lib" / "blob.js"
        lib.parent.mkdir()
        lib.write_text("const { put } = require('@vercel/blob');\n")

        report = analyze(tmp_path)
        apply(report, dry_run=False)

        content = lib.read_text()
        assert "require('@vercel/blob')" not in content
        assert "TODO(varity-migrate)" in content

    def test_re_export_removed(self, tmp_path):
        (tmp_path / "package.json").write_text(json.dumps({
            "dependencies": {"@vercel/analytics": "^1.0.0", "next": "^14"},
        }))
        barrel = tmp_path / "lib" / "analytics.ts"
        barrel.parent.mkdir()
        barrel.write_text("export { Analytics } from '@vercel/analytics/react';\n")

        report = analyze(tmp_path)
        apply(report, dry_run=False)

        assert "@vercel/analytics" not in barrel.read_text()

    def test_source_in_node_modules_not_touched(self, tmp_path):
        """Files under node_modules are never scanned or modified."""
        (tmp_path / "package.json").write_text(json.dumps({
            "dependencies": {"@vercel/analytics": "^1.0.0"},
        }))
        nm = tmp_path / "node_modules" / "@vercel" / "analytics"
        nm.mkdir(parents=True)
        sentinel = nm / "index.js"
        sentinel.write_text("import { Analytics } from '@vercel/analytics/react';\n")

        report = analyze(tmp_path)
        apply(report, dry_run=False)

        assert sentinel.read_text() == "import { Analytics } from '@vercel/analytics/react';\n"

    def test_dry_run_does_not_modify_source(self, tmp_path):
        """Dry-run must not write source files even when imports are found."""
        (tmp_path / "package.json").write_text(json.dumps({
            "dependencies": {"@vercel/analytics": "^1.0.0"},
        }))
        page = tmp_path / "app" / "page.tsx"
        page.parent.mkdir()
        original = "import { Analytics } from '@vercel/analytics/react';\n"
        page.write_text(original)

        report = analyze(tmp_path)
        apply(report, dry_run=True)

        assert page.read_text() == original


# ---------------------------------------------------------------------------
# Auto-rollback on build failure (VAR-214 regression).
# ---------------------------------------------------------------------------

# ---------------------------------------------------------------------------
# --path flag on subcommands (VAR-239 regression).
# ---------------------------------------------------------------------------

class TestSubcommandPathFlag:
    """rollback, analyze, and apply must accept --path as an alias for the positional arg."""

    def test_rollback_accepts_path_option(self, tmp_path):
        from varitykit.cli.migrate import rollback_cmd
        (tmp_path / "vercel.json").write_text('{"framework":"nextjs"}')
        apply(analyze(tmp_path), dry_run=False)
        assert not (tmp_path / "vercel.json").exists()

        runner = CliRunner()
        result = runner.invoke(rollback_cmd, ["--path", str(tmp_path)])
        assert result.exit_code == 0, result.output
        assert (tmp_path / "vercel.json").exists()

    def test_rollback_positional_still_works(self, tmp_path):
        from varitykit.cli.migrate import rollback_cmd
        (tmp_path / "vercel.json").write_text('{"framework":"nextjs"}')
        apply(analyze(tmp_path), dry_run=False)

        runner = CliRunner()
        result = runner.invoke(rollback_cmd, [str(tmp_path)])
        assert result.exit_code == 0, result.output
        assert (tmp_path / "vercel.json").exists()

    def test_rollback_defaults_to_cwd(self, tmp_path):
        from varitykit.cli.migrate import rollback_cmd
        runner = CliRunner()
        with runner.isolated_filesystem():
            result = runner.invoke(rollback_cmd, [])
        assert result.exit_code == 0
        assert "nothing to roll back" in result.output.lower()

    def test_analyze_accepts_path_option(self, tmp_path):
        from varitykit.cli.migrate import analyze_cmd
        (tmp_path / "vercel.json").write_text('{"framework":"nextjs"}')

        runner = CliRunner()
        result = runner.invoke(analyze_cmd, ["--path", str(tmp_path)])
        assert result.exit_code == 0, result.output
        assert "vercel" in result.output.lower()

    def test_apply_accepts_path_option(self, tmp_path):
        from varitykit.cli.migrate import apply_cmd
        (tmp_path / "vercel.json").write_text('{"framework":"nextjs"}')

        runner = CliRunner()
        result = runner.invoke(apply_cmd, ["--path", str(tmp_path)])
        assert result.exit_code == 0, result.output
        assert not (tmp_path / "vercel.json").exists()


class TestAutoRollbackOnBuildFailure:
    def _make_project(self, tmp_path) -> None:
        """Minimal project: vercel.json + build script (so migrate tries to build)."""
        (tmp_path / "vercel.json").write_text('{"framework":"nextjs"}')
        (tmp_path / "package.json").write_text(json.dumps({
            "scripts": {"build": "next build"},
            "dependencies": {"next": "^14"},
        }))

    def test_rollback_triggered_when_build_fails(self, tmp_path):
        """When npm build fails, codemods must be reverted automatically."""
        from varitykit.cli.migrate import migrate as migrate_cmd

        self._make_project(tmp_path)
        original_vercel = (tmp_path / "vercel.json").read_text()

        install_ok = MagicMock(returncode=0, stdout="added 300 packages", stderr="")
        build_failed = MagicMock(returncode=1, stdout="Build error",
                                 stderr="Module not found: '@vercel/analytics'")

        runner = CliRunner()
        with patch("varitykit.cli.migrate.subprocess.run",
                   side_effect=[install_ok, build_failed]):
            result = runner.invoke(migrate_cmd, ["--path", str(tmp_path)])

        assert result.exit_code != 0
        assert (tmp_path / "vercel.json").exists(), "vercel.json must be restored after build failure"
        assert (tmp_path / "vercel.json").read_text() == original_vercel
        assert not (tmp_path / ".vercel-migration-backup").exists(), "backup dir must be cleaned up"

    def test_no_rollback_when_build_passes(self, tmp_path):
        """When build succeeds, codemods must remain applied (not rolled back)."""
        from varitykit.cli.migrate import migrate as migrate_cmd

        self._make_project(tmp_path)

        success = MagicMock(returncode=0, stdout="Build successful", stderr="")

        runner = CliRunner()
        with patch("varitykit.cli.migrate.subprocess.run", return_value=success):
            runner.invoke(migrate_cmd, ["--path", str(tmp_path), "--no-deploy"])

        assert not (tmp_path / "vercel.json").exists(), "vercel.json should stay removed on success"

    def test_error_message_mentions_restore(self, tmp_path):
        """Build-failure error output must tell the user the project was restored."""
        from varitykit.cli.migrate import migrate as migrate_cmd

        self._make_project(tmp_path)

        install_ok = MagicMock(returncode=0, stdout="", stderr="")
        build_failed = MagicMock(returncode=1, stdout="", stderr="Build error")

        runner = CliRunner()
        with patch("varitykit.cli.migrate.subprocess.run",
                   side_effect=[install_ok, build_failed]):
            result = runner.invoke(migrate_cmd, ["--path", str(tmp_path)])

        assert "restored" in result.output.lower() or "roll" in result.output.lower()

    def test_install_failure_triggers_rollback(self, tmp_path):
        """When npm install fails, codemods must be reverted (VAR-329)."""
        from varitykit.cli.migrate import migrate as migrate_cmd

        self._make_project(tmp_path)
        original_vercel = (tmp_path / "vercel.json").read_text()

        install_failed = MagicMock(returncode=1, stdout="npm ERR! peer dep conflict",
                                   stderr="")

        runner = CliRunner()
        with patch("varitykit.cli.migrate.subprocess.run", return_value=install_failed):
            result = runner.invoke(migrate_cmd, ["--path", str(tmp_path)])

        assert result.exit_code != 0
        assert (tmp_path / "vercel.json").exists(), "vercel.json must be restored after install failure"
        assert (tmp_path / "vercel.json").read_text() == original_vercel
        assert not (tmp_path / ".vercel-migration-backup").exists()

    def test_bin_permissions_fixed_after_install(self, tmp_path):
        """node_modules/.bin/ executables get +x after npm install (VAR-329).

        Uses deploy=True (no --no-deploy) so step 3 runs; the deploy step (4)
        will raise an exception which catch_exceptions=True absorbs — the chmod
        already happened in step 3.
        """
        from varitykit.cli.migrate import migrate as migrate_cmd

        self._make_project(tmp_path)

        # Simulate npm having installed without execute bit (the VAR-329 failure mode)
        bin_dir = tmp_path / "node_modules" / ".bin"
        bin_dir.mkdir(parents=True)
        next_bin = bin_dir / "next"
        next_bin.write_text("#!/usr/bin/env node\n")
        next_bin.chmod(0o644)  # no execute bit

        success = MagicMock(returncode=0, stdout="", stderr="")
        runner = CliRunner()
        # --no-deploy skips step 3 entirely; omit it so install+chmod run.
        # catch_exceptions=True absorbs any error from the deploy step.
        with patch("varitykit.cli.migrate.subprocess.run", return_value=success):
            runner.invoke(migrate_cmd, ["--path", str(tmp_path)], catch_exceptions=True)

        assert next_bin.stat().st_mode & 0o111, "execute bits must be set after migration"


class TestMigrateGithubUrlNormalization:
    @pytest.mark.parametrize("raw,expected", [
        ("owner/repo", "https://github.com/owner/repo.git"),
        ("github.com/owner/repo", "https://github.com/owner/repo.git"),
        ("https://github.com/owner/repo", "https://github.com/owner/repo.git"),
        ("https://github.com/owner/repo.git", "https://github.com/owner/repo.git"),
        ("git@github.com:owner/repo.git", "https://github.com/owner/repo.git"),
    ])
    def test_normalize_github_url_accepts_shorthand(self, raw, expected):
        from varitykit.cli.migrate import _normalize_github_url
        assert _normalize_github_url(raw) == expected

    def test_migrate_uses_normalized_shorthand_url(self):
        from varitykit.cli.migrate import migrate as migrate_cmd

        runner = CliRunner()
        with patch("varitykit.cli.migrate._clone_github_repo", return_value=".") as clone_mock, \
             patch("varitykit.cli.migrate._run_full_migration", return_value=None):
            result = runner.invoke(migrate_cmd, ["--url", "owner/repo", "--dry-run"])

        assert result.exit_code == 0, result.output
        clone_mock.assert_called_once_with("https://github.com/owner/repo.git")

    def test_migrate_passes_name_to_full_migration(self):
        from varitykit.cli.migrate import migrate as migrate_cmd

        runner = CliRunner()
        with patch("varitykit.cli.migrate._run_full_migration", return_value=None) as migrate_mock:
            result = runner.invoke(
                migrate_cmd,
                ["--path", ".", "--name", "custom-app", "--no-deploy"],
            )

        assert result.exit_code == 0, result.output
        migrate_mock.assert_called_once_with(".", dry_run=False, deploy=False, name="custom-app")
