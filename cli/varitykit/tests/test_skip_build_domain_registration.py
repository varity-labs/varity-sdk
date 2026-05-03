"""
Regression test for VAR-89: --skip-build flag returns raw IPFS URL instead of
varity.app/{name}/ URL.

Root cause to confirm: When skip_build=True, the domain registration step
(register_domain) must still be called and result in frontend_url being set
to https://varity.app/{subdomain}/, not the raw IPFS gateway URL.
"""

import os
import tempfile
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

from varitykit.core.deployment_orchestrator import DeploymentOrchestrator
from varitykit.core.ipfs_uploader import IPFSUploadResult
from varitykit.core.types import BuildArtifacts, ProjectInfo


def _make_static_project_info(name: str = "test-app") -> ProjectInfo:
    return ProjectInfo(
        name=name,
        project_type="nextjs",
        framework_version="14.0.0",
        build_command="npm run build",
        output_dir="out",
        package_manager="npm",
        display_name="Test App",
        description="A test app",
    )


def _make_build_artifacts(output_dir: str) -> BuildArtifacts:
    return BuildArtifacts(
        success=True,
        output_dir=output_dir,
        files=["index.html", "static/main.js"],
        entrypoint="index.html",
        total_size_mb=0.5,
        build_time_seconds=0.0,
    )


def _make_ipfs_result(cid: str = "QmTestCID123") -> IPFSUploadResult:
    return IPFSUploadResult({
        "success": True,
        "cid": cid,
        "gatewayUrl": f"https://ipfs.io/ipfs/{cid}",
        "thirdwebUrl": f"https://{cid}.ipfscdn.io",
        "files": ["index.html"],
        "totalSize": 512000,
        "fileCount": 2,
        "uploadTime": 1000,
    })


class TestSkipBuildDomainRegistration:
    """VAR-89: --skip-build must still route through gateway registration."""

    def test_skip_build_returns_varity_app_url(self, tmp_path):
        """
        Core regression: static deploy with skip_build=True must return
        https://varity.app/{name}/ not the raw IPFS gateway URL.
        """
        project_dir = tmp_path / "test-app"
        project_dir.mkdir()
        out_dir = project_dir / "out"
        out_dir.mkdir()
        (out_dir / "index.html").write_text("<html>hello</html>")

        orchestrator = DeploymentOrchestrator(verbose=False)
        project_info = _make_static_project_info("test-app")
        build_artifacts = _make_build_artifacts(str(out_dir))
        ipfs_result = _make_ipfs_result("QmTestCID123")

        with patch.object(orchestrator, "_detect_project", return_value=project_info), \
             patch.object(orchestrator, "_compute_project_size", return_value=(1024, 3)), \
             patch.object(orchestrator.builder, "_collect_artifacts", return_value=build_artifacts), \
             patch("varitykit.core.path_rewriter.rewrite_paths_for_static_hosting", return_value=0), \
             patch("varitykit.services.gateway_client.check_availability",
                   return_value={"available": True}), \
             patch("varitykit.services.gateway_client.get_deploy_key",
                   return_value="test-deploy-key"), \
             patch("varitykit.services.gateway_client.sanitize_subdomain",
                   side_effect=lambda name: name.lower().replace(" ", "-")), \
             patch.object(orchestrator, "_upload_to_ipfs", return_value=ipfs_result), \
             patch("varitykit.services.gateway_client.register_domain",
                   return_value={"subdomain": "test-app", "url": "https://varity.app/test-app/",
                                 "cid": "QmTestCID123"}), \
             patch.object(orchestrator, "_save_deployment", return_value="deploy-test-123"), \
             patch.object(orchestrator, "_emit_telemetry"), \
             patch.object(orchestrator, "_detect_services", return_value=[]), \
             patch.object(orchestrator, "_load_env_vars", return_value={}), \
             patch.object(orchestrator, "_has_prisma", return_value=False), \
             patch.object(orchestrator, "_write_wm_entities", create=True):

            result = orchestrator.deploy(
                project_path=str(project_dir),
                hosting="static",
                skip_build=True,
            )

        assert result.frontend_url == "https://varity.app/test-app/", (
            f"Expected varity.app URL but got: {result.frontend_url!r}\n"
            f"Bug: --skip-build bypassed domain registration"
        )
        assert result.custom_domain == "https://varity.app/test-app/", (
            f"custom_domain not set: {result.custom_domain!r}"
        )

    def test_skip_build_with_custom_name_uses_name(self, tmp_path):
        """--name flag must be respected with --skip-build."""
        project_dir = tmp_path / "test-app"
        project_dir.mkdir()
        out_dir = project_dir / "out"
        out_dir.mkdir()
        (out_dir / "index.html").write_text("<html>hello</html>")

        orchestrator = DeploymentOrchestrator(verbose=False)
        project_info = _make_static_project_info("test-app")
        build_artifacts = _make_build_artifacts(str(out_dir))
        ipfs_result = _make_ipfs_result("QmTestCID456")

        captured_register_args = {}

        def fake_register(subdomain, cid, **kwargs):
            captured_register_args["subdomain"] = subdomain
            captured_register_args["cid"] = cid
            return {"subdomain": subdomain, "url": f"https://varity.app/{subdomain}/", "cid": cid}

        with patch.object(orchestrator, "_detect_project", return_value=project_info), \
             patch.object(orchestrator, "_compute_project_size", return_value=(1024, 3)), \
             patch.object(orchestrator.builder, "_collect_artifacts", return_value=build_artifacts), \
             patch("varitykit.core.path_rewriter.rewrite_paths_for_static_hosting", return_value=0), \
             patch("varitykit.services.gateway_client.check_availability",
                   return_value={"available": True}), \
             patch("varitykit.services.gateway_client.get_deploy_key",
                   return_value="test-deploy-key"), \
             patch("varitykit.services.gateway_client.sanitize_subdomain",
                   side_effect=lambda name: name.lower().replace(" ", "-")), \
             patch.object(orchestrator, "_upload_to_ipfs", return_value=ipfs_result), \
             patch("varitykit.services.gateway_client.register_domain",
                   side_effect=fake_register), \
             patch.object(orchestrator, "_save_deployment", return_value="deploy-test-456"), \
             patch.object(orchestrator, "_emit_telemetry"), \
             patch.object(orchestrator, "_detect_services", return_value=[]), \
             patch.object(orchestrator, "_load_env_vars", return_value={}), \
             patch.object(orchestrator, "_has_prisma", return_value=False), \
             patch.object(orchestrator, "_write_wm_entities", create=True):

            result = orchestrator.deploy(
                project_path=str(project_dir),
                hosting="static",
                skip_build=True,
                custom_name="my-custom-app",
            )

        assert captured_register_args.get("subdomain") == "my-custom-app", (
            f"--name flag ignored: register_domain called with "
            f"subdomain={captured_register_args.get('subdomain')!r}"
        )
        assert result.frontend_url == "https://varity.app/my-custom-app/"

    def test_skip_build_false_also_registers_domain(self, tmp_path):
        """Control: normal build (skip_build=False) must register domain (baseline)."""
        project_dir = tmp_path / "test-app"
        project_dir.mkdir()
        out_dir = project_dir / "out"
        out_dir.mkdir()
        (out_dir / "index.html").write_text("<html>hello</html>")

        orchestrator = DeploymentOrchestrator(verbose=False)
        project_info = _make_static_project_info("test-app")
        build_artifacts = _make_build_artifacts(str(out_dir))
        ipfs_result = _make_ipfs_result("QmControlCID")

        register_called = []

        def fake_register(subdomain, cid, **kwargs):
            register_called.append((subdomain, cid))
            return {"subdomain": subdomain, "url": f"https://varity.app/{subdomain}/", "cid": cid}

        with patch.object(orchestrator, "_detect_project", return_value=project_info), \
             patch.object(orchestrator, "_compute_project_size", return_value=(1024, 3)), \
             patch.object(orchestrator, "_build_project", return_value=build_artifacts), \
             patch("varitykit.core.path_rewriter.rewrite_paths_for_static_hosting", return_value=0), \
             patch("varitykit.services.gateway_client.check_availability",
                   return_value={"available": True}), \
             patch("varitykit.services.gateway_client.get_deploy_key",
                   return_value="test-deploy-key"), \
             patch("varitykit.services.gateway_client.sanitize_subdomain",
                   side_effect=lambda name: name.lower().replace(" ", "-")), \
             patch.object(orchestrator, "_upload_to_ipfs", return_value=ipfs_result), \
             patch("varitykit.services.gateway_client.register_domain",
                   side_effect=fake_register), \
             patch.object(orchestrator, "_save_deployment", return_value="deploy-ctrl"), \
             patch.object(orchestrator, "_emit_telemetry"), \
             patch.object(orchestrator, "_detect_services", return_value=[]), \
             patch.object(orchestrator, "_load_env_vars", return_value={}), \
             patch.object(orchestrator, "_has_prisma", return_value=False), \
             patch.object(orchestrator, "_write_wm_entities", create=True):

            result = orchestrator.deploy(
                project_path=str(project_dir),
                hosting="static",
                skip_build=False,
            )

        assert register_called, "register_domain was not called for normal (non-skip-build) deploy"
        assert result.frontend_url == "https://varity.app/test-app/"
