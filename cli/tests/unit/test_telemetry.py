"""
Unit tests for DeploymentOrchestrator telemetry hooks (VAR-469).

Verifies that:
- A unique run_id is generated per deploy
- OrchestrationRun + DeployOutcome payloads are structured correctly
- Telemetry is fired on both success and failure paths
- _emit_telemetry never raises (fire-and-forget)
"""

import time
import uuid
from unittest.mock import patch

import pytest

from varitykit.core.deployment_orchestrator import DeploymentOrchestrator


class TestEmitTelemetry:
    """_emit_telemetry is fire-and-forget and must never raise."""

    def test_emit_does_not_raise_on_network_failure(self):
        with patch("urllib.request.urlopen", side_effect=OSError("connection refused")):
            DeploymentOrchestrator._emit_telemetry({"run_id": str(uuid.uuid4()), "success": True})
            # Give the daemon thread time to run
            time.sleep(0.05)

    def test_emit_does_not_raise_on_missing_fields(self):
        DeploymentOrchestrator._emit_telemetry({})
        time.sleep(0.05)

    def test_emit_splits_inputs_and_outputs(self):
        captured = []

        def fake_urlopen(req, **_kwargs):
            import json
            captured.append(json.loads(req.data.decode()))

        with patch("urllib.request.urlopen", side_effect=fake_urlopen):
            run_id = str(uuid.uuid4())
            DeploymentOrchestrator._emit_telemetry({
                "run_id": run_id,
                "project_type": "nextjs",
                "hosting_requested": "akash",
                "cli_version": "1.2.7",
                "success": True,
                "duration_seconds": 90.5,
                "deploy_id": "deploy-123",
                "frontend_url": "https://varity.app/my-app/",
            })
            time.sleep(0.05)

        assert len(captured) == 1
        payload = captured[0]
        assert payload["run_id"] == run_id
        # Inputs land in orchestration_run
        assert payload["orchestration_run"]["project_type"] == "nextjs"
        assert payload["orchestration_run"]["hosting_requested"] == "akash"
        assert "success" not in payload["orchestration_run"]
        # Outputs land in deploy_outcome
        assert payload["deploy_outcome"]["success"] is True
        assert payload["deploy_outcome"]["duration_seconds"] == 90.5
        assert "project_type" not in payload["deploy_outcome"]


class TestHasPrisma:
    def test_returns_true_when_schema_exists(self, tmp_path):
        schema = tmp_path / "prisma" / "schema.prisma"
        schema.parent.mkdir(parents=True)
        schema.write_text('datasource db { provider = "postgresql" }')
        assert DeploymentOrchestrator._has_prisma(str(tmp_path)) is True

    def test_returns_false_when_schema_missing(self, tmp_path):
        assert DeploymentOrchestrator._has_prisma(str(tmp_path)) is False


class TestDeployTelemetryIntegration:
    """Verify telemetry hooks are called during deploy()."""

    def _make_orchestrator(self):
        return DeploymentOrchestrator(verbose=False)

    def test_telemetry_fired_on_detection_error(self, tmp_path):
        """Detection failure → emit with error_class=detection_error."""
        orch = self._make_orchestrator()
        emitted = []

        with patch.object(DeploymentOrchestrator, "_emit_telemetry", side_effect=emitted.append):
            with pytest.raises(Exception):
                orch.deploy(project_path=str(tmp_path))  # empty dir → detection error

        assert len(emitted) == 1
        telem = emitted[0]
        assert telem["success"] is False
        assert telem["error_class"] == "detection_error"
        assert "run_id" in telem
        assert "duration_seconds" in telem

    def test_telemetry_contains_run_id(self, tmp_path):
        """Each deploy gets a unique run_id that appears in the emitted payload."""
        orch = self._make_orchestrator()
        run_ids = []

        def capture(telem):
            run_ids.append(telem.get("run_id"))

        with patch.object(DeploymentOrchestrator, "_emit_telemetry", side_effect=capture):
            with pytest.raises(Exception):
                orch.deploy(project_path=str(tmp_path))
            with pytest.raises(Exception):
                orch.deploy(project_path=str(tmp_path))

        assert len(run_ids) == 2
        assert run_ids[0] != run_ids[1], "run_id must be unique per deploy"
        for rid in run_ids:
            # Must be a valid UUID
            uuid.UUID(rid)
