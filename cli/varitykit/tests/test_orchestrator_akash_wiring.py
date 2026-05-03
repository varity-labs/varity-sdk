"""
Integration test for Bug D — DeploymentOrchestrator must thread project_type
and python_start_command into akash_deploy_service.deploy(). Before Phase 1
this was silently lost: project_type was detected but never passed down, so
Python repos went to Akash with a Node SDL and failed at npm install.

Also covers VAR-172: Akash URL slug must use the project directory name, not
the package.json `name` field. Non-technical users never update package.json
`name`, so using it produces wrong slugs (e.g. "dx-express-v2" when the
directory is "dogfood-express-0422").
"""

from unittest.mock import patch, MagicMock

import pytest

from varitykit.core.deployment_orchestrator import DeploymentOrchestrator
from varitykit.core.types import ProjectInfo


def _make_project_info(project_type: str, name: str = "demo") -> ProjectInfo:
    return ProjectInfo(
        name=name,
        project_type=project_type,
        framework_version="0.0.0",
        build_command="",
        output_dir=".",
        package_manager="npm" if project_type in {"nextjs", "react", "vue", "nodejs"} else "pip",
        has_backend=True,
    )


class TestOrchestratorThreadsProjectType:
    """Verify Bug D fix — project_type reaches deploy()."""

    def test_nextjs_project_passes_nextjs_to_deploy(self):
        orchestrator = DeploymentOrchestrator(verbose=False)
        project_info = _make_project_info("nextjs")

        with patch(
            "varitykit.services.akash_deploy_service.deploy"
        ) as mock_deploy, patch(
            "varitykit.services.akash_deploy_service.detect_python_start_command",
            return_value=None,
        ):
            mock_deploy.return_value = MagicMock(success=True)
            orchestrator._deploy_to_akash_service(
                project_path="/tmp/nonexistent",
                project_info=project_info,
                custom_name="demo",
                github_repo_url="https://github.com/x/y.git",
            )

        assert mock_deploy.called
        kwargs = mock_deploy.call_args.kwargs
        assert kwargs["project_type"] == "nextjs"

    def test_python_project_passes_python_to_deploy(self):
        """This is THE regression guard for Bug A — a Python app going through
        the orchestrator must produce a Python-toolchain deploy call."""
        orchestrator = DeploymentOrchestrator(verbose=False)
        project_info = _make_project_info("python")

        with patch(
            "varitykit.services.akash_deploy_service.deploy"
        ) as mock_deploy, patch(
            "varitykit.services.akash_deploy_service.detect_python_start_command",
            return_value="uvicorn main:app --host 0.0.0.0 --port 8000",
        ):
            mock_deploy.return_value = MagicMock(success=True)
            orchestrator._deploy_to_akash_service(
                project_path="/tmp/nonexistent",
                project_info=project_info,
                custom_name="demo",
                github_repo_url="https://github.com/x/y.git",
            )

        assert mock_deploy.called
        kwargs = mock_deploy.call_args.kwargs
        assert kwargs["project_type"] == "python"
        assert kwargs["python_start_command"] == "uvicorn main:app --host 0.0.0.0 --port 8000"

    def test_fastapi_project_threads_detected_start_command(self):
        orchestrator = DeploymentOrchestrator(verbose=False)
        project_info = _make_project_info("fastapi")

        with patch(
            "varitykit.services.akash_deploy_service.deploy"
        ) as mock_deploy, patch(
            "varitykit.services.akash_deploy_service.detect_python_start_command",
            return_value="uvicorn main:app --host 0.0.0.0 --port 8000",
        ):
            mock_deploy.return_value = MagicMock(success=True)
            orchestrator._deploy_to_akash_service(
                project_path="/tmp/nonexistent",
                project_info=project_info,
                custom_name="demo",
                github_repo_url="https://github.com/x/y.git",
            )

        kwargs = mock_deploy.call_args.kwargs
        assert kwargs["project_type"] == "fastapi"
        assert kwargs["python_start_command"] == "uvicorn main:app --host 0.0.0.0 --port 8000"

    def test_missing_github_url_raises_before_deploy(self):
        """UX regression guard — non-technical users need a clear error, not
        a deep stack trace."""
        from varitykit.core.types import DeploymentError

        orchestrator = DeploymentOrchestrator(verbose=False)
        project_info = _make_project_info("nextjs")

        with pytest.raises(DeploymentError) as exc:
            orchestrator._deploy_to_akash_service(
                project_path="/tmp/nonexistent",
                project_info=project_info,
                custom_name="demo",
                github_repo_url=None,
            )
        assert "GitHub" in str(exc.value)


class TestOrchestratorThreadsServices:
    """Bug C regression lock — detected services MUST flow into deploy()
    call. Before Phase 2 the services list was always empty or [postgres];
    redis/ollama/mongodb could never reach the SDL."""

    def test_redis_dep_triggers_redis_sidecar(self, tmp_path):
        import json as _json
        (tmp_path / "package.json").write_text(
            _json.dumps({"dependencies": {"ioredis": "^5.0.0"}})
        )
        orchestrator = DeploymentOrchestrator(verbose=False)
        project_info = _make_project_info("nextjs")

        with patch(
            "varitykit.services.akash_deploy_service.deploy"
        ) as mock_deploy, patch(
            "varitykit.services.akash_deploy_service.detect_python_start_command",
            return_value=None,
        ):
            mock_deploy.return_value = MagicMock(success=True)
            orchestrator._deploy_to_akash_service(
                project_path=str(tmp_path),
                project_info=project_info,
                custom_name="demo",
                github_repo_url="https://github.com/x/y.git",
            )

        assert mock_deploy.called
        assert mock_deploy.call_args.kwargs["services"] == ["redis"]

    def test_mongoose_dep_triggers_mongodb_sidecar(self, tmp_path):
        import json as _json
        (tmp_path / "package.json").write_text(
            _json.dumps({"dependencies": {"mongoose": "^8.0.0"}})
        )
        orchestrator = DeploymentOrchestrator(verbose=False)
        project_info = _make_project_info("nextjs")

        with patch(
            "varitykit.services.akash_deploy_service.deploy"
        ) as mock_deploy, patch(
            "varitykit.services.akash_deploy_service.detect_python_start_command",
            return_value=None,
        ):
            mock_deploy.return_value = MagicMock(success=True)
            orchestrator._deploy_to_akash_service(
                project_path=str(tmp_path),
                project_info=project_info,
                custom_name="demo",
                github_repo_url="https://github.com/x/y.git",
            )

        assert mock_deploy.call_args.kwargs["services"] == ["mongodb"]

    def test_ai_agent_stack_triggers_three_sidecars(self, tmp_path):
        """End-to-end: a Python FastAPI AI agent app with Postgres+Redis+Ollama
        must produce all three sidecars in the deploy call."""
        (tmp_path / "requirements.txt").write_text(
            "fastapi\nuvicorn\nasyncpg\nredis\nlangchain-ollama\n"
        )
        orchestrator = DeploymentOrchestrator(verbose=False)
        project_info = _make_project_info("fastapi")

        with patch(
            "varitykit.services.akash_deploy_service.deploy"
        ) as mock_deploy, patch(
            "varitykit.services.akash_deploy_service.detect_python_start_command",
            return_value="uvicorn main:app --host 0.0.0.0 --port 8000",
        ):
            mock_deploy.return_value = MagicMock(success=True)
            orchestrator._deploy_to_akash_service(
                project_path=str(tmp_path),
                project_info=project_info,
                custom_name="demo",
                github_repo_url="https://github.com/x/y.git",
            )

        kwargs = mock_deploy.call_args.kwargs
        assert kwargs["services"] == ["postgres", "redis", "ollama"]
        assert kwargs["project_type"] == "fastapi"


class TestAkashUrlSlugUsesDirectoryName:
    """VAR-172 regression guard: Akash URL slug must come from the project
    directory name, NOT from package.json `name`.

    Non-technical users never update package.json `name`. A project in
    directory "dogfood-express-0422" with package.json `name: "dx-express-v2"`
    must get slug "dogfood-express-0422", not "dx-express-v2".
    """

    def _make_deploy_result(self):
        from varitykit.core.akash.types import AkashDeploymentResult
        return AkashDeploymentResult(
            success=True,
            dseq="12345",
            url="http://provider.akash.example.com",
            provider="akash-provider",
            estimated_monthly_cost=5.0,
        )

    def test_slug_uses_directory_name_when_no_custom_name(self, tmp_path):
        """Directory name takes precedence over package.json name."""
        import json as _json
        # Directory is "dogfood-express-0422" but package.json name is "dx-express-v2"
        project_dir = tmp_path / "dogfood-express-0422"
        project_dir.mkdir()
        (project_dir / "package.json").write_text(
            _json.dumps({"name": "dx-express-v2", "dependencies": {"express": "^4"}})
        )

        orchestrator = DeploymentOrchestrator(verbose=False)
        captured_subdomain = {}

        def _fake_register(subdomain, **_):
            captured_subdomain["value"] = subdomain
            return {"subdomain": subdomain, "url": f"https://varity.app/{subdomain}/"}

        # register_akash_domain is imported lazily inside deploy() — patch at source
        with patch.object(orchestrator, "_deploy_to_akash_service",
                          return_value=self._make_deploy_result()), \
             patch.object(orchestrator, "_resolve_github_url",
                          return_value="https://github.com/x/y.git"), \
             patch("varitykit.services.gateway_client.register_akash_domain",
                   side_effect=_fake_register), \
             patch("varitykit.services.gateway_client.sanitize_subdomain",
                   side_effect=lambda x: x.lower().replace(" ", "-")), \
             patch("varitykit.services.gateway_client.get_deploy_key",
                   return_value="test-key"), \
             patch("varitykit.services.gateway_client.check_availability",
                   return_value={"available": True}), \
             patch("varitykit.services.gateway_client.register_domain"), \
             patch.object(orchestrator, "_detect_project") as mock_detect, \
             patch.object(orchestrator, "_save_deployment", return_value="deploy-123"):

            from varitykit.core.types import ProjectInfo
            mock_detect.return_value = ProjectInfo(
                name="dx-express-v2",
                project_type="nodejs",
                framework_version="4.0.0",
                build_command="",
                output_dir=".",
                package_manager="npm",
                has_backend=True,
            )
            orchestrator.deploy(
                project_path=str(project_dir),
                hosting="akash",
                custom_name=None,
            )

        assert captured_subdomain.get("value") == "dogfood-express-0422", (
            f"Expected slug 'dogfood-express-0422' (directory name) but got "
            f"'{captured_subdomain.get('value')}'. The slug must use the directory "
            "name, not package.json `name`, to avoid silent slug mismatches."
        )

    def test_custom_name_overrides_directory_name(self, tmp_path):
        """--name flag always wins, regardless of directory name."""
        import json as _json
        project_dir = tmp_path / "my-project-dir"
        project_dir.mkdir()
        (project_dir / "package.json").write_text(
            _json.dumps({"name": "pkg-name", "dependencies": {"express": "^4"}})
        )

        orchestrator = DeploymentOrchestrator(verbose=False)
        captured_subdomain = {}

        def _fake_register(subdomain, **_):
            captured_subdomain["value"] = subdomain
            return {"subdomain": subdomain, "url": f"https://varity.app/{subdomain}/"}

        with patch.object(orchestrator, "_deploy_to_akash_service",
                          return_value=self._make_deploy_result()), \
             patch.object(orchestrator, "_resolve_github_url",
                          return_value="https://github.com/x/y.git"), \
             patch("varitykit.services.gateway_client.register_akash_domain",
                   side_effect=_fake_register), \
             patch("varitykit.services.gateway_client.sanitize_subdomain",
                   side_effect=lambda x: x.lower().replace(" ", "-")), \
             patch("varitykit.services.gateway_client.get_deploy_key",
                   return_value="test-key"), \
             patch("varitykit.services.gateway_client.check_availability",
                   return_value={"available": True}), \
             patch("varitykit.services.gateway_client.register_domain"), \
             patch.object(orchestrator, "_detect_project") as mock_detect, \
             patch.object(orchestrator, "_save_deployment", return_value="deploy-123"):

            from varitykit.core.types import ProjectInfo
            mock_detect.return_value = ProjectInfo(
                name="pkg-name",
                project_type="nodejs",
                framework_version="4.0.0",
                build_command="",
                output_dir=".",
                package_manager="npm",
                has_backend=True,
            )
            orchestrator.deploy(
                project_path=str(project_dir),
                hosting="akash",
                custom_name="my-custom-slug",
            )

        assert captured_subdomain.get("value") == "my-custom-slug", (
            f"Expected slug 'my-custom-slug' (--name flag) but got "
            f"'{captured_subdomain.get('value')}'"
        )
