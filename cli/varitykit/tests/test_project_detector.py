"""
Tests for ProjectDetector.

Tests project detection logic with various framework types.
"""

import json
import tempfile
from pathlib import Path

import pytest
from varitykit.core.project_detector import ProjectDetectionError, ProjectDetector


class TestProjectDetector:
    """Test suite for ProjectDetector class."""

    def setup_method(self):
        """Set up test fixtures."""
        self.detector = ProjectDetector()

    def test_detect_nextjs_static_export(self):
        """Test detection of Next.js project with static export."""
        with tempfile.TemporaryDirectory() as tmpdir:
            project_path = Path(tmpdir)

            # Create package.json
            package_json = {"dependencies": {"next": "14.0.0", "react": "18.2.0"}}
            (project_path / "package.json").write_text(json.dumps(package_json))

            # Create next.config.js with static export
            next_config = 'module.exports = { output: "export" }'
            (project_path / "next.config.js").write_text(next_config)

            # Create pnpm-lock.yaml to test package manager detection
            (project_path / "pnpm-lock.yaml").touch()

            # Detect project
            project_info = self.detector.detect(str(project_path))

            assert project_info.project_type == "nextjs"
            assert project_info.framework_version == "14.0.0"
            assert project_info.build_command == "pnpm run build"
            assert project_info.output_dir == "out"
            assert project_info.package_manager == "pnpm"
            assert project_info.has_backend is False

    def test_detect_nextjs_with_api_routes(self):
        """Test detection of Next.js project without static export (has API routes)."""
        with tempfile.TemporaryDirectory() as tmpdir:
            project_path = Path(tmpdir)

            # Create package.json
            package_json = {"dependencies": {"next": "13.5.0", "react": "18.2.0"}}
            (project_path / "package.json").write_text(json.dumps(package_json))

            # Detect project
            project_info = self.detector.detect(str(project_path))

            assert project_info.project_type == "nextjs"
            assert project_info.build_command == "npm run build"
            assert project_info.output_dir == ".next"
            assert project_info.package_manager == "npm"
            assert project_info.has_backend is True  # Next.js API routes count as backend

    def test_detect_react_cra(self):
        """Test detection of Create React App project."""
        with tempfile.TemporaryDirectory() as tmpdir:
            project_path = Path(tmpdir)

            # Create package.json
            package_json = {
                "dependencies": {"react": "18.2.0", "react-dom": "18.2.0", "react-scripts": "5.0.1"}
            }
            (project_path / "package.json").write_text(json.dumps(package_json))

            # Create yarn.lock to test package manager detection
            (project_path / "yarn.lock").touch()

            # Detect project
            project_info = self.detector.detect(str(project_path))

            assert project_info.project_type == "react"
            assert project_info.build_command == "yarn run build"
            assert project_info.output_dir == "build"
            assert project_info.package_manager == "yarn"
            assert project_info.has_backend is False

    def test_detect_react_vite(self):
        """Test detection of React + Vite project."""
        with tempfile.TemporaryDirectory() as tmpdir:
            project_path = Path(tmpdir)

            # Create package.json
            package_json = {
                "dependencies": {"react": "18.2.0", "react-dom": "18.2.0"},
                "devDependencies": {"vite": "4.0.0"},
            }
            (project_path / "package.json").write_text(json.dumps(package_json))

            # Detect project
            project_info = self.detector.detect(str(project_path))

            assert project_info.project_type == "react"
            assert project_info.build_command == "npm run build"
            assert project_info.output_dir == "dist"
            assert project_info.package_manager == "npm"

    def test_detect_vue(self):
        """Test detection of Vue.js project."""
        with tempfile.TemporaryDirectory() as tmpdir:
            project_path = Path(tmpdir)

            # Create package.json
            package_json = {"dependencies": {"vue": "3.3.0"}}
            (project_path / "package.json").write_text(json.dumps(package_json))

            # Detect project
            project_info = self.detector.detect(str(project_path))

            assert project_info.project_type == "vue"
            assert project_info.framework_version == "3.3.0"
            assert project_info.build_command == "npm run build"
            assert project_info.output_dir == "dist"

    def test_detect_nodejs_express(self):
        """Test detection of Express backend."""
        with tempfile.TemporaryDirectory() as tmpdir:
            project_path = Path(tmpdir)

            # Create package.json
            package_json = {"dependencies": {"express": "4.18.2"}}
            (project_path / "package.json").write_text(json.dumps(package_json))

            # Detect project
            project_info = self.detector.detect(str(project_path))

            assert project_info.project_type == "nodejs"
            assert project_info.framework_version == "4.18.2"
            assert project_info.build_command == ""
            assert project_info.output_dir == "."
            assert project_info.has_backend is True

    def test_detect_python_project(self):
        """Test detection of Python project."""
        with tempfile.TemporaryDirectory() as tmpdir:
            project_path = Path(tmpdir)

            # Create requirements.txt
            (project_path / "requirements.txt").write_text("fastapi==0.100.0\nuvicorn==0.23.0")

            # Detect project
            project_info = self.detector.detect(str(project_path))

            assert project_info.project_type == "python"
            assert project_info.framework_version is None
            assert project_info.build_command == ""
            assert project_info.output_dir == "."
            assert project_info.has_backend is True
            assert project_info.package_manager == "pip"

    def test_detect_with_backend(self):
        """Test detection of project with separate backend."""
        with tempfile.TemporaryDirectory() as tmpdir:
            project_path = Path(tmpdir)

            # Create package.json for React
            package_json = {"dependencies": {"react": "18.2.0"}}
            (project_path / "package.json").write_text(json.dumps(package_json))

            # Create server/ directory
            (project_path / "server").mkdir()

            # Detect project
            project_info = self.detector.detect(str(project_path))

            assert project_info.project_type == "react"
            assert project_info.has_backend is True

    def test_detect_nonexistent_path(self):
        """Test detection fails for nonexistent path."""
        with pytest.raises(ProjectDetectionError) as exc_info:
            self.detector.detect("/nonexistent/path")

        assert "does not exist" in str(exc_info.value)

    def test_detect_unsupported_project(self):
        """Test detection fails for unsupported project type."""
        with tempfile.TemporaryDirectory() as tmpdir:
            project_path = Path(tmpdir)

            # Create package.json with unsupported framework
            package_json = {"dependencies": {"svelte": "3.0.0"}}
            (project_path / "package.json").write_text(json.dumps(package_json))

            with pytest.raises(ProjectDetectionError) as exc_info:
                self.detector.detect(str(project_path))

            assert "Unknown JavaScript framework" in str(exc_info.value)

    def test_detect_no_project_files(self):
        """Test detection fails when no recognized project files exist."""
        with tempfile.TemporaryDirectory() as tmpdir:
            with pytest.raises(ProjectDetectionError) as exc_info:
                self.detector.detect(tmpdir)

            assert "Could not detect project type" in str(exc_info.value)

    def test_detect_invalid_package_json(self):
        """Test detection fails for invalid package.json."""
        with tempfile.TemporaryDirectory() as tmpdir:
            project_path = Path(tmpdir)

            # Create invalid JSON
            (project_path / "package.json").write_text("{ invalid json")

            with pytest.raises(ProjectDetectionError) as exc_info:
                self.detector.detect(str(project_path))

            assert "Failed to read package.json" in str(exc_info.value)


class TestRealProject:
    """Test detection with the actual generic-template-dashboard."""

    def test_detect_generic_template_dashboard(self):
        """Test detection of the real generic-template-dashboard project."""
        detector = ProjectDetector()
        project_path = "/home/macoding/varity-workspace/varity-sdk/apps/generic-template-dashboard"

        # Skip if project doesn't exist
        if not Path(project_path).exists():
            pytest.skip("generic-template-dashboard not found")

        project_info = detector.detect(project_path)

        # Verify it's detected as Next.js
        assert project_info.project_type == "nextjs"
        assert project_info.package_manager in ["npm", "pnpm", "yarn"]
        assert "build" in project_info.build_command
        # Check it detected either static export or API routes
        assert project_info.output_dir in ["out", ".next"]
