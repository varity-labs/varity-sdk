"""
Regression tests for Qwik/QwikCity detection — VAR-563.

Covers two gaps found by Dogfood Frontier:
  Gap 1: ProjectDetector raised ProjectDetectionError for @builder.io/qwik* projects
  Gap 2: detect_hosting_type() returned "static" for QwikCity (SSR) projects
"""

import json
import tempfile
from pathlib import Path

import pytest

from varitykit.core.project_detector import ProjectDetectionError, ProjectDetector
from varitykit.services.akash_deploy_service import detect_hosting_type


class TestQwikProjectDetection:
    """Gap 1: _detect_js_project must recognise Qwik/QwikCity before falling through to the else."""

    def setup_method(self):
        self.detector = ProjectDetector()

    def test_qwikcity_project_detected(self):
        """QwikCity project (SSR) → project_type='qwik', has_backend=True."""
        with tempfile.TemporaryDirectory() as tmpdir:
            pkg = {
                "name": "my-qwik-app",
                "dependencies": {
                    "@builder.io/qwik": "1.9.0",
                    "@builder.io/qwik-city": "1.9.0",
                    "typescript": "5.0.0",
                    "vite": "5.0.0",
                },
            }
            (Path(tmpdir) / "package.json").write_text(json.dumps(pkg))

            info = self.detector.detect(tmpdir)

            assert info.project_type == "qwik"
            assert info.has_backend is True
            assert info.framework_version == "1.9.0"
            assert info.build_command == "npm run build"
            assert info.output_dir == "dist"

    def test_pure_qwik_no_qwikcity_static(self):
        """Pure Qwik without QwikCity → project_type='qwik', has_backend=False (SSG)."""
        with tempfile.TemporaryDirectory() as tmpdir:
            pkg = {
                "name": "my-qwik-lib",
                "dependencies": {
                    "@builder.io/qwik": "1.9.0",
                    "vite": "5.0.0",
                },
            }
            (Path(tmpdir) / "package.json").write_text(json.dumps(pkg))

            info = self.detector.detect(tmpdir)

            assert info.project_type == "qwik"
            assert info.has_backend is False
            assert info.framework_version == "1.9.0"

    def test_qwik_package_manager_detected(self):
        """Qwik project picks up bun.lockb as bun package manager."""
        with tempfile.TemporaryDirectory() as tmpdir:
            path = Path(tmpdir)
            pkg = {
                "dependencies": {
                    "@builder.io/qwik": "1.9.0",
                    "@builder.io/qwik-city": "1.9.0",
                },
            }
            (path / "package.json").write_text(json.dumps(pkg))
            (path / "bun.lockb").touch()

            info = self.detector.detect(tmpdir)

            assert info.project_type == "qwik"
            assert info.package_manager == "bun"
            assert info.build_command == "bun run build"

    def test_qwik_error_message_updated(self):
        """Unknown framework error now lists Qwik/QwikCity in supported list."""
        with tempfile.TemporaryDirectory() as tmpdir:
            pkg = {"dependencies": {"some-unknown-lib": "1.0.0"}}
            (Path(tmpdir) / "package.json").write_text(json.dumps(pkg))

            with pytest.raises(ProjectDetectionError) as exc_info:
                self.detector.detect(tmpdir)

            assert "Qwik" in str(exc_info.value)


class TestQwikHostingTypeDetection:
    """Gap 2: detect_hosting_type must return 'akash' for QwikCity (SSR) projects."""

    def test_qwikcity_returns_akash(self):
        """QwikCity in dependencies → dynamic hosting (Akash)."""
        with tempfile.TemporaryDirectory() as tmpdir:
            pkg = {
                "dependencies": {
                    "@builder.io/qwik": "1.9.0",
                    "@builder.io/qwik-city": "1.9.0",
                },
            }
            (Path(tmpdir) / "package.json").write_text(json.dumps(pkg))

            assert detect_hosting_type(tmpdir) == "akash"

    def test_pure_qwik_no_qwikcity_returns_static(self):
        """Pure Qwik without QwikCity → static hosting (no SSR node server)."""
        with tempfile.TemporaryDirectory() as tmpdir:
            pkg = {
                "dependencies": {
                    "@builder.io/qwik": "1.9.0",
                    "vite": "5.0.0",
                },
            }
            (Path(tmpdir) / "package.json").write_text(json.dumps(pkg))

            assert detect_hosting_type(tmpdir) == "static"

    def test_qwikcity_in_devdependencies_returns_akash(self):
        """QwikCity in devDependencies also triggers dynamic hosting."""
        with tempfile.TemporaryDirectory() as tmpdir:
            pkg = {
                "dependencies": {"@builder.io/qwik": "1.9.0"},
                "devDependencies": {"@builder.io/qwik-city": "1.9.0"},
            }
            (Path(tmpdir) / "package.json").write_text(json.dumps(pkg))

            assert detect_hosting_type(tmpdir) == "akash"
