"""
Regression tests for the Vercel → Varity migrate codemods.

Covers the three gaps fixed in VAR-662:
  1. output: 'standalone' injection
  2. VERCEL_URL/ENV/SHA env-var rename
  3. experimental.runtime: 'edge' removal

Also exercises the full fixture pipeline (detector → apply) against inline
copies of the vercel-minimal-2026-04-27 fixture.
"""

from __future__ import annotations

import json
import textwrap
from pathlib import Path

import pytest

from varitykit.migrate import detector, codemods


# ---------------------------------------------------------------------------
# Inline fixture content (mirrors varity-ops/fixtures/vercel-minimal-2026-04-27/)
# ---------------------------------------------------------------------------

FIXTURE_NEXT_CONFIG = textwrap.dedent("""\
    const nextConfig = {
      images: {
        domains: ['vercel.com'],
        loader: 'default'
      },
      experimental: {
        runtime: 'edge'
      }
    };
    module.exports = nextConfig;
""")

FIXTURE_ENV_LOCAL = textwrap.dedent("""\
    VERCEL_URL=https://example.vercel.app
    VERCEL_ENV=production
    VERCEL_GIT_COMMIT_SHA=abc123
    DATABASE_URL=postgres://example
""")

FIXTURE_PACKAGE_JSON = json.dumps({
    "name": "vercel-minimal",
    "version": "1.0.0",
    "dependencies": {
        "next": "14.0.0",
        "react": "18.0.0",
        "react-dom": "18.0.0",
        "@vercel/og": "^0.6.0",
        "@vercel/edge": "^1.0.0",
    },
})

FIXTURE_VERCEL_JSON = json.dumps({"version": 2})

FIXTURE_PAGE = textwrap.dedent("""\
    export default function Home() {
      return <div>Hello</div>;
    }
""")


@pytest.fixture()
def fixture_project(tmp_path: Path) -> Path:
    """Create a minimal Vercel project in tmp_path."""
    (tmp_path / "next.config.js").write_text(FIXTURE_NEXT_CONFIG)
    (tmp_path / ".env.local").write_text(FIXTURE_ENV_LOCAL)
    (tmp_path / "package.json").write_text(FIXTURE_PACKAGE_JSON)
    (tmp_path / "vercel.json").write_text(FIXTURE_VERCEL_JSON)
    pages = tmp_path / "pages"
    pages.mkdir()
    (pages / "index.tsx").write_text(FIXTURE_PAGE)
    return tmp_path


# ---------------------------------------------------------------------------
# Detector tests
# ---------------------------------------------------------------------------

class TestDetector:
    def test_detects_standalone_missing(self, fixture_project: Path) -> None:
        report = detector.analyze(fixture_project)
        assert report.next_config_needs_standalone is True

    def test_detects_edge_runtime(self, fixture_project: Path) -> None:
        report = detector.analyze(fixture_project)
        assert report.next_config_has_edge_runtime is True

    def test_detects_env_renames(self, fixture_project: Path) -> None:
        report = detector.analyze(fixture_project)
        assert "VERCEL_URL" in report.env_renames_needed
        assert report.env_renames_needed["VERCEL_URL"] == "NEXT_PUBLIC_APP_URL"
        assert "VERCEL_ENV" in report.env_renames_needed
        assert report.env_renames_needed["VERCEL_ENV"] == "NODE_ENV"
        assert "VERCEL_GIT_COMMIT_SHA" in report.env_renames_needed
        assert report.env_renames_needed["VERCEL_GIT_COMMIT_SHA"] == "GIT_COMMIT_SHA"

    def test_detects_vercel_packages(self, fixture_project: Path) -> None:
        report = detector.analyze(fixture_project)
        assert "@vercel/og" in report.vercel_packages_found
        assert "@vercel/edge" in report.vercel_packages_found

    def test_no_false_positive_standalone(self, tmp_path: Path) -> None:
        (tmp_path / "next.config.js").write_text(
            "const c = { output: 'standalone' }; module.exports = c;"
        )
        (tmp_path / "package.json").write_text('{"dependencies":{}}')
        report = detector.analyze(tmp_path)
        assert report.next_config_needs_standalone is False


# ---------------------------------------------------------------------------
# Pure-function transform tests: _apply_edge_runtime_strip
# ---------------------------------------------------------------------------

class TestApplyEdgeRuntimeStrip:
    def test_removes_sole_experimental_block(self) -> None:
        content = "const c = { experimental: { runtime: 'edge' } };"
        result = codemods._apply_edge_runtime_strip(content)
        assert "edge" not in result
        assert "experimental" not in result

    def test_removes_sole_experimental_block_double_quotes(self) -> None:
        content = 'const c = { experimental: { runtime: "edge" } };'
        result = codemods._apply_edge_runtime_strip(content)
        assert "edge" not in result

    def test_preserves_other_experimental_keys(self) -> None:
        content = textwrap.dedent("""\
            const c = {
              experimental: {
                runtime: 'edge',
                serverActions: true,
              }
            };
        """)
        result = codemods._apply_edge_runtime_strip(content)
        assert "edge" not in result
        assert "serverActions: true" in result
        assert "experimental" in result

    def test_idempotent_no_edge(self) -> None:
        content = "const c = { output: 'standalone' };"
        assert codemods._apply_edge_runtime_strip(content) == content


# ---------------------------------------------------------------------------
# Pure-function transform tests: _apply_standalone_inject
# ---------------------------------------------------------------------------

class TestApplyStandaloneInject:
    def test_injects_into_const_config(self) -> None:
        content = "const nextConfig = {\n  reactStrictMode: true,\n};\nmodule.exports = nextConfig;\n"
        result = codemods._apply_standalone_inject(content)
        assert "output: 'standalone'" in result

    def test_injects_into_module_exports(self) -> None:
        content = "module.exports = {\n  reactStrictMode: true,\n};\n"
        result = codemods._apply_standalone_inject(content)
        assert "output: 'standalone'" in result

    def test_idempotent_already_standalone(self) -> None:
        content = "const c = { output: 'standalone' }; module.exports = c;"
        assert codemods._apply_standalone_inject(content) == content

    def test_handles_nested_braces(self) -> None:
        content = textwrap.dedent("""\
            const nextConfig = {
              images: {
                domains: ['example.com'],
              },
            };
            module.exports = nextConfig;
        """)
        result = codemods._apply_standalone_inject(content)
        assert "output: 'standalone'" in result
        # Must be inside the outer object, not the images sub-object
        assert result.count("output: 'standalone'") == 1


# ---------------------------------------------------------------------------
# Full fixture pipeline tests
# ---------------------------------------------------------------------------

class TestApplyFixture:
    def test_standalone_injected(self, fixture_project: Path) -> None:
        report = detector.analyze(fixture_project)
        codemods.apply(report)
        result = (fixture_project / "next.config.js").read_text()
        assert "output: 'standalone'" in result

    def test_edge_runtime_removed(self, fixture_project: Path) -> None:
        report = detector.analyze(fixture_project)
        codemods.apply(report)
        result = (fixture_project / "next.config.js").read_text()
        assert "runtime: 'edge'" not in result
        assert '"edge"' not in result

    def test_env_vars_renamed(self, fixture_project: Path) -> None:
        report = detector.analyze(fixture_project)
        codemods.apply(report)
        env_text = (fixture_project / ".env.local").read_text()
        # No VERCEL_* keys should remain
        assert "VERCEL_URL=" not in env_text
        assert "VERCEL_ENV=" not in env_text
        assert "VERCEL_GIT_COMMIT_SHA=" not in env_text
        # Renamed keys must be present
        assert "NEXT_PUBLIC_APP_URL=" in env_text
        assert "NODE_ENV=" in env_text
        assert "GIT_COMMIT_SHA=" in env_text

    def test_database_url_preserved(self, fixture_project: Path) -> None:
        report = detector.analyze(fixture_project)
        codemods.apply(report)
        env_text = (fixture_project / ".env.local").read_text()
        assert "DATABASE_URL=postgres://example" in env_text

    def test_vercel_packages_removed(self, fixture_project: Path) -> None:
        report = detector.analyze(fixture_project)
        codemods.apply(report)
        pkg = json.loads((fixture_project / "package.json").read_text())
        all_deps = {**pkg.get("dependencies", {}), **pkg.get("devDependencies", {})}
        assert "@vercel/og" not in all_deps
        assert "@vercel/edge" not in all_deps

    def test_images_unoptimized_injected(self, fixture_project: Path) -> None:
        report = detector.analyze(fixture_project)
        codemods.apply(report)
        result = (fixture_project / "next.config.js").read_text()
        assert "unoptimized: true" in result

    def test_vercel_json_removed(self, fixture_project: Path) -> None:
        report = detector.analyze(fixture_project)
        codemods.apply(report)
        assert not (fixture_project / "vercel.json").exists()

    def test_backup_created(self, fixture_project: Path) -> None:
        report = detector.analyze(fixture_project)
        codemods.apply(report)
        backup_dir = fixture_project / codemods.BACKUP_DIR_NAME
        assert backup_dir.exists()

    def test_dry_run_no_modifications(self, fixture_project: Path) -> None:
        report = detector.analyze(fixture_project)
        original_next = (fixture_project / "next.config.js").read_text()
        original_env = (fixture_project / ".env.local").read_text()
        changes = codemods.apply(report, dry_run=True)
        assert (fixture_project / "next.config.js").read_text() == original_next
        assert (fixture_project / ".env.local").read_text() == original_env
        assert (fixture_project / "vercel.json").exists()
        assert changes.has_changes

    def test_dogfood_regression_assertions(self, fixture_project: Path) -> None:
        """Mirror the shell assertions from the fixture README verbatim."""
        report = detector.analyze(fixture_project)
        codemods.apply(report)

        next_config = (fixture_project / "next.config.js").read_text()
        env_local = (fixture_project / ".env.local").read_text()

        # 1. output: standalone present
        assert next_config.count("standalone") >= 1, "FAIL: no standalone"

        # 2. No VERCEL_* keys at line-start in .env.local
        import re
        vercel_keys = re.findall(r"^VERCEL_", env_local, re.MULTILINE)
        assert vercel_keys == [], f"FAIL: VERCEL_ vars not renamed — found {vercel_keys}"

        # 3. If experimental.runtime still present, must have // EDGE_RUNTIME_NOT_SUPPORTED comment
        if re.search(r"experimental\.runtime", next_config):
            assert "// EDGE_RUNTIME_NOT_SUPPORTED" in next_config, \
                "FAIL: edge runtime not warned"
