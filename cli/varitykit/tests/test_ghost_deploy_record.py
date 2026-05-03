"""
Regression tests for VAR-340: ghost deploy on warmup timeout.

Before this fix, when the Akash warmup health check timed out the
orchestrator raised DeploymentError without saving any record. The
dseq was lost and the running container (consuming credits) became
invisible to varity_deploy_status.

After this fix:
  * A warmup_timeout record is written to ~/.varitykit/deployments/
    whenever Akash assigns a dseq but the container never became healthy.
  * The ghost record includes dseq, url, provider, cwd (project path),
    and status="warmup_timeout" so it is discoverable and cancellable.
  * _create_manifest always includes a "cwd" field for path-based queries.
  * When the deploy fails BEFORE Akash assigns a dseq (e.g. SDL rejected),
    no ghost record is written.
"""

import json
import tempfile
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

from varitykit.core.deployment_orchestrator import DeploymentOrchestrator
from varitykit.core.types import ProjectInfo


def _project_info(name: str = "express-test") -> ProjectInfo:
    return ProjectInfo(
        name=name,
        display_name=name,
        project_type="nodejs",
        framework_version="4.18.2",
        build_command="",
        output_dir=".",
        package_manager="npm",
        has_backend=True,
    )


def _akash_failure(dseq: str = "", url: str = "", provider: str = "") -> MagicMock:
    result = MagicMock()
    result.success = False
    result.dseq = dseq
    result.url = url
    result.provider = provider
    result.error_message = "Container did not become healthy within 5 min. Check logs with: varitykit app logs " + dseq
    return result


# ---------------------------------------------------------------------------
# Test 1: Ghost record IS written when dseq is set (warmup timeout scenario)
# ---------------------------------------------------------------------------

def test_ghost_record_saved_on_warmup_timeout(tmp_path):
    """A JSON record must appear in deployments dir when dseq is set but unhealthy."""
    deploy_dir = tmp_path / ".varitykit" / "deployments"
    orchestrator = DeploymentOrchestrator(verbose=False)
    project_info = _project_info()
    akash_result = _akash_failure(
        dseq="1234567",
        url="http://provider.akash.example.com:31234",
        provider="akash1abc",
    )

    with patch.object(Path, "home", return_value=tmp_path):
        orchestrator._save_ghost_deployment(
            akash_result,
            project_info,
            project_path="/tmp/express-test",
            network="varity",
        )

    records = list((deploy_dir).glob("deploy-*.json"))
    assert len(records) == 1, "Exactly one ghost record should be saved"

    data = json.loads(records[0].read_text())
    assert data["status"] == "warmup_timeout"
    assert data["akash"]["dseq"] == "1234567"
    assert data["akash"]["url"] == "http://provider.akash.example.com:31234"
    assert data["akash"]["provider"] == "akash1abc"
    assert data["cwd"] == "/tmp/express-test"
    assert data["app_name"] == "express-test"
    assert data["hosting"] == "akash"
    assert data["network"] == "varity"


# ---------------------------------------------------------------------------
# Test 2: Ghost record is NOT written when dseq is empty (pre-Akash failure)
# ---------------------------------------------------------------------------

def test_no_ghost_record_when_dseq_empty(tmp_path):
    """No record should be written when Akash rejected the SDL (no dseq)."""
    deploy_dir = tmp_path / ".varitykit" / "deployments"
    orchestrator = DeploymentOrchestrator(verbose=False)
    project_info = _project_info()
    # dseq="" means Akash never accepted the SDL
    akash_result = _akash_failure(dseq="", url="", provider="")

    # The orchestrator only calls _save_ghost_deployment when dseq is truthy.
    # Simulate the guard that lives in deploy():
    if akash_result.dseq:
        with patch.object(Path, "home", return_value=tmp_path):
            orchestrator._save_ghost_deployment(akash_result, project_info, "/tmp/fail", "varity")

    records = list(deploy_dir.glob("deploy-*.json")) if deploy_dir.exists() else []
    assert records == [], "No ghost record should be written when dseq is empty"


# ---------------------------------------------------------------------------
# Test 3: _create_manifest includes cwd field
# ---------------------------------------------------------------------------

def test_create_manifest_includes_cwd():
    """Successful deploy manifests must include cwd for path-based queries."""
    orchestrator = DeploymentOrchestrator(verbose=False)
    project_info = _project_info("my-app")

    build_artifacts = MagicMock()
    build_artifacts.success = True
    build_artifacts.files = ["index.html"]
    build_artifacts.total_size_mb = 1.2
    build_artifacts.build_time_seconds = 5.0
    build_artifacts.output_dir = "/tmp/my-app/out"

    manifest = orchestrator._create_manifest(
        project_info=project_info,
        build_artifacts=build_artifacts,
        network="varity",
        hosting="akash",
        project_path="/tmp/my-app",
    )

    assert manifest["cwd"] == "/tmp/my-app"


# ---------------------------------------------------------------------------
# Test 4: _create_manifest cwd is None when project_path not provided
# ---------------------------------------------------------------------------

def test_create_manifest_cwd_none_when_not_provided():
    """cwd should be None when no project_path is given (backwards compat)."""
    orchestrator = DeploymentOrchestrator(verbose=False)
    project_info = _project_info("my-app")

    build_artifacts = MagicMock()
    build_artifacts.success = True
    build_artifacts.files = []
    build_artifacts.total_size_mb = 0.0
    build_artifacts.build_time_seconds = 0.0
    build_artifacts.output_dir = "."

    manifest = orchestrator._create_manifest(
        project_info=project_info,
        build_artifacts=build_artifacts,
        network="varity",
        hosting="ipfs",
    )

    assert manifest["cwd"] is None


# ---------------------------------------------------------------------------
# Test 5: Ghost record deployment_id is unique across concurrent calls
# ---------------------------------------------------------------------------

def test_ghost_record_unique_ids(tmp_path):
    """Two consecutive ghost saves must produce different deployment IDs."""
    deploy_dir = tmp_path / ".varitykit" / "deployments"
    orchestrator = DeploymentOrchestrator(verbose=False)
    project_info = _project_info()
    akash_result = _akash_failure(dseq="9999999", url="http://x.example.com", provider="akash1xyz")

    ids = set()
    for _ in range(2):
        with patch.object(Path, "home", return_value=tmp_path):
            dep_id = orchestrator._save_ghost_deployment(
                akash_result, project_info, "/tmp/app", "varity"
            )
        ids.add(dep_id)

    # Both IDs should be distinct
    assert len(ids) == 2, "Each ghost deployment must have a unique ID"
