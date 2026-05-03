"""
Regression tests for static sub-path deploy path handling.

The CLI must not inject NEXT_PUBLIC_BASE_PATH for static builds. Production
gateway path rewriting owns the app prefix, and setting Next basePath at build
time causes doubled /app/app/_next/... asset URLs.
"""

import tempfile
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

from varitykit.core.build_manager import BuildManager
from varitykit.core.types import BuildArtifacts, ProjectInfo


def _make_project_info(name="my-saas-app", project_type="nextjs", build_command="npm run build"):
    return ProjectInfo(
        name=name,
        project_type=project_type,
        framework_version=None,
        build_command=build_command,
        output_dir="out",
        package_manager="npm",
    )


class TestBuildManagerExtraEnv:
    """Tests that extra_env is correctly merged into the build environment."""

    def setup_method(self):
        self.manager = BuildManager()

    def test_extra_env_injected_into_build_environment(self):
        """NEXT_PUBLIC_BASE_PATH must appear in the subprocess environment."""
        with tempfile.TemporaryDirectory() as tmpdir:
            project_path = Path(tmpdir)
            out_dir = project_path / "out"
            out_dir.mkdir()
            (out_dir / "index.html").write_text("<html></html>")

            captured_env = {}

            def fake_popen(cmd, **kwargs):
                captured_env.update(kwargs.get("env", {}))
                proc = MagicMock()
                proc.stdout = iter([])
                proc.returncode = 0
                proc.wait.return_value = 0
                proc.__enter__ = lambda s: s
                proc.__exit__ = MagicMock(return_value=False)
                return proc

            with patch("subprocess.Popen", side_effect=fake_popen):
                try:
                    self.manager.build(
                        project_path=str(project_path),
                        build_command="echo ok",
                        output_dir="out",
                        extra_env={"NEXT_PUBLIC_BASE_PATH": "/my-app"},
                    )
                except Exception:
                    pass  # env capture is what matters; build output parsing may fail

            assert captured_env.get("NEXT_PUBLIC_BASE_PATH") == "/my-app"

    def test_extra_env_none_does_not_crash(self):
        """Passing extra_env=None must not raise."""
        with tempfile.TemporaryDirectory() as tmpdir:
            project_path = Path(tmpdir)
            out_dir = project_path / "out"
            out_dir.mkdir()
            (out_dir / "index.html").write_text("<html></html>")

            artifacts = self.manager.build(
                project_path=str(project_path),
                build_command="",
                output_dir="out",
                extra_env=None,
            )
            assert artifacts.success is True

    def test_node_env_is_production_regardless_of_extra_env(self):
        """build_manager always sets NODE_ENV=production; extra_env must not downgrade it."""
        with tempfile.TemporaryDirectory() as tmpdir:
            project_path = Path(tmpdir)
            out_dir = project_path / "out"
            out_dir.mkdir()
            (out_dir / "index.html").write_text("<html></html>")

            captured_env = {}

            def fake_popen(cmd, **kwargs):
                captured_env.update(kwargs.get("env", {}))
                proc = MagicMock()
                proc.stdout = iter([])
                proc.returncode = 0
                proc.wait.return_value = 0
                proc.__enter__ = lambda s: s
                proc.__exit__ = MagicMock(return_value=False)
                return proc

            with patch("subprocess.Popen", side_effect=fake_popen):
                try:
                    self.manager.build(
                        project_path=str(project_path),
                        build_command="echo ok",
                        output_dir="out",
                        extra_env={"NEXT_PUBLIC_BASE_PATH": "/app"},
                    )
                except Exception:
                    pass

            assert captured_env.get("NODE_ENV") == "production"


class TestOrchestratorBasepathInjection:
    """Tests that deployment_orchestrator does not inject Next basePath."""

    def test_basepath_not_injected_for_static_deploy(self):
        """Static deploys must avoid NEXT_PUBLIC_BASE_PATH double-prefixing."""
        from varitykit.core.deployment_orchestrator import DeploymentOrchestrator

        project_info = _make_project_info(name="my-saas-app")
        captured_extra_env = {}

        def mock_build_project(project_path, pi, extra_env=None):
            captured_extra_env.update(extra_env or {})
            return BuildArtifacts(
                success=True, output_dir=project_path, files=["index.html"],
                entrypoint="index.html", total_size_mb=0.1, build_time_seconds=0.0,
            )

        with tempfile.TemporaryDirectory() as tmpdir:
            with patch.object(DeploymentOrchestrator, "_detect_project", return_value=project_info), \
                 patch.object(DeploymentOrchestrator, "_build_project", side_effect=mock_build_project), \
                 patch.object(DeploymentOrchestrator, "_upload_to_ipfs", side_effect=Exception("stop")), \
                 patch("varitykit.services.gateway_client.sanitize_subdomain", return_value="my-saas-app"), \
                 patch("varitykit.services.gateway_client.check_availability", return_value={"available": True}), \
                 patch("varitykit.services.gateway_client.get_deploy_key", return_value="key"), \
                 patch("varitykit.services.gateway_client.register_domain", return_value=None):
                try:
                    DeploymentOrchestrator(verbose=False).deploy(project_path=tmpdir, hosting="ipfs")
                except Exception:
                    pass

        assert "NEXT_PUBLIC_BASE_PATH" not in captured_extra_env

    def test_custom_name_does_not_inject_basepath(self):
        """--name still must not inject NEXT_PUBLIC_BASE_PATH."""
        from varitykit.core.deployment_orchestrator import DeploymentOrchestrator

        project_info = _make_project_info(name="my-saas-app")
        captured_extra_env = {}

        def mock_build_project(project_path, pi, extra_env=None):
            captured_extra_env.update(extra_env or {})
            return BuildArtifacts(
                success=True, output_dir=project_path, files=["index.html"],
                entrypoint="index.html", total_size_mb=0.1, build_time_seconds=0.0,
            )

        with tempfile.TemporaryDirectory() as tmpdir:
            with patch.object(DeploymentOrchestrator, "_detect_project", return_value=project_info), \
                 patch.object(DeploymentOrchestrator, "_build_project", side_effect=mock_build_project), \
                 patch.object(DeploymentOrchestrator, "_upload_to_ipfs", side_effect=Exception("stop")), \
                 patch("varitykit.services.gateway_client.sanitize_subdomain", side_effect=lambda n: n.lower().replace("_", "-")), \
                 patch("varitykit.services.gateway_client.check_availability", return_value={"available": True}), \
                 patch("varitykit.services.gateway_client.get_deploy_key", return_value="key"), \
                 patch("varitykit.services.gateway_client.register_domain", return_value=None):
                try:
                    DeploymentOrchestrator(verbose=False).deploy(
                        project_path=tmpdir, hosting="ipfs", custom_name="my-custom-name"
                    )
                except Exception:
                    pass

        assert "NEXT_PUBLIC_BASE_PATH" not in captured_extra_env

    def test_no_basepath_injected_for_akash_deploy(self):
        """Akash deploys skip local build — _build_project must not be called."""
        from varitykit.core.deployment_orchestrator import DeploymentOrchestrator

        project_info = _make_project_info(name="my-express-app", project_type="nodejs", build_command="")
        build_project_called = []

        def mock_build_project(project_path, pi, extra_env=None):
            build_project_called.append(extra_env)
            return BuildArtifacts(
                success=True, output_dir=project_path, files=[],
                entrypoint="", total_size_mb=0.0, build_time_seconds=0.0,
            )

        with tempfile.TemporaryDirectory() as tmpdir:
            with patch.object(DeploymentOrchestrator, "_detect_project", return_value=project_info), \
                 patch.object(DeploymentOrchestrator, "_build_project", side_effect=mock_build_project):
                try:
                    DeploymentOrchestrator(verbose=False).deploy(project_path=tmpdir, hosting="akash")
                except Exception:
                    pass

        assert build_project_called == [], "_build_project must not be called for akash deploys"
