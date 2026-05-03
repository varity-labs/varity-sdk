"""
Tests for BuildManager.

Tests build execution and artifact collection.
"""

import tempfile
from pathlib import Path
from unittest.mock import patch

import pytest
from varitykit.core.build_manager import BuildManager
from varitykit.core.types import BuildError


class TestBuildManager:
    """Test suite for BuildManager class."""

    def setup_method(self):
        """Set up test fixtures."""
        self.manager = BuildManager()

    def test_build_with_no_command(self):
        """Test build with no command skips build step."""
        with tempfile.TemporaryDirectory() as tmpdir:
            project_path = Path(tmpdir)

            # Create a simple output directory
            output_dir = project_path / "dist"
            output_dir.mkdir()
            (output_dir / "index.html").write_text("<html>Test</html>")

            # Build with no command
            artifacts = self.manager.build(
                project_path=str(project_path), build_command="", output_dir="dist"
            )

            assert artifacts.success is True
            assert len(artifacts.files) == 1
            assert "index.html" in artifacts.files
            assert artifacts.build_time_seconds == 0.0

    def test_build_collects_artifacts(self):
        """Test build collects all artifacts correctly."""
        with tempfile.TemporaryDirectory() as tmpdir:
            project_path = Path(tmpdir)

            # Create a build directory structure
            build_dir = project_path / "build"
            build_dir.mkdir()

            # Create various files
            (build_dir / "index.html").write_text("<html>Test</html>")
            (build_dir / "styles.css").write_text("body { color: red; }")

            # Create subdirectory with assets
            assets_dir = build_dir / "assets"
            assets_dir.mkdir()
            (assets_dir / "logo.png").write_bytes(b"fake png data")
            (assets_dir / "script.js").write_text("console.log('test');")

            # Build (no command)
            artifacts = self.manager.build(
                project_path=str(project_path), build_command="", output_dir="build"
            )

            assert artifacts.success is True
            assert len(artifacts.files) == 4
            assert "index.html" in artifacts.files
            assert "styles.css" in artifacts.files
            assert "assets/logo.png" in artifacts.files
            assert "assets/script.js" in artifacts.files
            assert artifacts.entrypoint == "index.html"
            assert artifacts.total_size_mb > 0

    def test_build_calculates_size_correctly(self):
        """Test build calculates total size correctly."""
        with tempfile.TemporaryDirectory() as tmpdir:
            project_path = Path(tmpdir)

            # Create build directory
            build_dir = project_path / "out"
            build_dir.mkdir()

            # Create a file with known size (1 MB)
            large_file = build_dir / "large.bin"
            large_file.write_bytes(b"x" * (1024 * 1024))  # 1 MB

            # Build
            artifacts = self.manager.build(
                project_path=str(project_path), build_command="", output_dir="out"
            )

            # Should be approximately 1 MB
            assert 0.9 < artifacts.total_size_mb < 1.1

    def test_build_fails_for_nonexistent_path(self):
        """Test build fails for nonexistent project path."""
        with pytest.raises(BuildError) as exc_info:
            self.manager.build(
                project_path="/nonexistent/path", build_command="npm run build", output_dir="build"
            )

        assert "does not exist" in str(exc_info.value)

    def test_build_fails_for_missing_output_dir(self):
        """Test build fails when output directory is missing."""
        with tempfile.TemporaryDirectory() as tmpdir:
            project_path = Path(tmpdir)

            with pytest.raises(BuildError) as exc_info:
                self.manager.build(
                    project_path=str(project_path), build_command="", output_dir="build"
                )

            assert "output directory not found" in str(exc_info.value).lower()

    def test_build_tries_alternative_dirs(self):
        """Test build tries alternative directories when specified dir missing."""
        with tempfile.TemporaryDirectory() as tmpdir:
            project_path = Path(tmpdir)

            # Create alternative directory
            dist_dir = project_path / "dist"
            dist_dir.mkdir()
            (dist_dir / "index.html").write_text("<html>Test</html>")

            # Request 'build' but 'dist' exists
            artifacts = self.manager.build(
                project_path=str(project_path), build_command="", output_dir="build"
            )

            assert artifacts.success is True
            assert "dist" in artifacts.output_dir

    def test_build_fails_for_empty_output_dir(self):
        """Test build fails when output directory is empty."""
        with tempfile.TemporaryDirectory() as tmpdir:
            project_path = Path(tmpdir)

            # Create empty build directory
            build_dir = project_path / "build"
            build_dir.mkdir()

            with pytest.raises(BuildError) as exc_info:
                self.manager.build(
                    project_path=str(project_path), build_command="", output_dir="build"
                )

            assert "empty" in str(exc_info.value).lower()

    def test_build_determines_nextjs_entrypoint(self):
        """Test build determines Next.js entrypoint correctly."""
        with tempfile.TemporaryDirectory() as tmpdir:
            project_path = Path(tmpdir)

            # Create .next directory (Next.js SSR)
            next_dir = project_path / ".next"
            next_dir.mkdir()
            (next_dir / "server.js").write_text("// Next.js server")

            artifacts = self.manager.build(
                project_path=str(project_path), build_command="", output_dir=".next"
            )

            assert artifacts.entrypoint == "server.js"

    def test_build_executes_simple_command(self):
        """Test build executes a simple command successfully."""
        with tempfile.TemporaryDirectory() as tmpdir:
            project_path = Path(tmpdir)

            # Create a simple build directory
            build_dir = project_path / "dist"
            build_dir.mkdir()
            (build_dir / "index.html").write_text("<html>Test</html>")

            # Use a simple command that should succeed (echo)
            artifacts = self.manager.build(
                project_path=str(project_path),
                build_command='echo "Building..."',
                output_dir="dist",
            )

            assert artifacts.success is True
            assert artifacts.build_time_seconds > 0

    def test_build_fails_for_invalid_command(self):
        """Test build fails for invalid command."""
        with tempfile.TemporaryDirectory() as tmpdir:
            project_path = Path(tmpdir)

            with pytest.raises(BuildError) as exc_info:
                self.manager.build(
                    project_path=str(project_path),
                    build_command="nonexistent-command",
                    output_dir="build",
                )

            assert "not found" in str(exc_info.value).lower()

    def test_build_fails_for_invalid_command_permission_error(self):
        """PermissionError from subprocess (WSL/Linux EACCES) maps to BuildError like FileNotFoundError."""
        with tempfile.TemporaryDirectory() as tmpdir:
            project_path = Path(tmpdir)

            with patch("subprocess.Popen", side_effect=PermissionError(13, "Permission denied", "bad-cmd")):
                with pytest.raises(BuildError) as exc_info:
                    self.manager.build(
                        project_path=str(project_path),
                        build_command="bad-cmd",
                        output_dir="build",
                    )

            assert "not found" in str(exc_info.value).lower()

    def test_build_fails_for_failing_command(self):
        """Test build fails when command exits with non-zero code."""
        with tempfile.TemporaryDirectory() as tmpdir:
            project_path = Path(tmpdir)

            # Use 'false' command which always exits with 1
            with pytest.raises(BuildError) as exc_info:
                self.manager.build(
                    project_path=str(project_path), build_command="false", output_dir="build"
                )

            assert "failed with exit code" in str(exc_info.value).lower()


class TestBuildManagerIntegration:
    """Integration tests with real projects."""

    def test_build_real_project_detection(self):
        """Test detecting and collecting info about the real project."""
        manager = BuildManager()
        project_path = Path(
            "/home/macoding/varity-workspace/varity-sdk/apps/generic-template-dashboard"
        )

        # Skip if project doesn't exist
        if not project_path.exists():
            pytest.skip("generic-template-dashboard not found")

        # Check if already built
        out_dir = project_path / "out"
        next_dir = project_path / ".next"

        if out_dir.exists():
            # Collect artifacts from existing build
            artifacts = manager._collect_artifacts(project_path, "out", 0.0)
            assert artifacts.success is True
            assert len(artifacts.files) > 0
            assert artifacts.total_size_mb > 0
        elif next_dir.exists():
            # Next.js SSR build exists
            artifacts = manager._collect_artifacts(project_path, ".next", 0.0)
            assert artifacts.success is True
            assert len(artifacts.files) > 0
        else:
            pytest.skip("No build output found in generic-template-dashboard")
