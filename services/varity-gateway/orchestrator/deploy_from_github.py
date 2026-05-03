#!/usr/bin/env python3
"""Gateway bridge to the canonical VarityKit deployment orchestrator.

The developer portal is TypeScript, but the source-of-truth deployment
algorithm used by `varitykit app deploy` lives in the Python CLI package.
This bridge keeps the portal deploy path on that same code path instead of
maintaining a second SDL generator in the gateway.
"""

from __future__ import annotations

import json
import os
import shutil
import subprocess
import sys
import tempfile
from contextlib import redirect_stdout
from io import StringIO
from pathlib import Path
from typing import Any, Dict

from varitykit.core.deployment_orchestrator import DeploymentOrchestrator
from varitykit.core.types import ProjectDetectionError
from varitykit.services.akash_deploy_service import (
    detect_app_port,
    detect_python_start_command,
    deploy as deploy_to_akash,
)


def _run(cmd: list[str], cwd: str | None = None) -> None:
    subprocess.run(cmd, cwd=cwd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=120)


def _write_env_file(project_dir: Path, env_vars: Dict[str, str]) -> None:
    if not env_vars:
        return

    lines = []
    for key, value in env_vars.items():
        if not key or not (key[0].isalpha() or key[0] == "_"):
            continue
        if not all(c.isalnum() or c == "_" for c in key):
            continue
        escaped = str(value).replace("\\", "\\\\").replace("\n", "\\n").replace('"', '\\"')
        lines.append(f'{key}="{escaped}"')

    if lines:
        (project_dir / ".env.varity").write_text("\n".join(lines) + "\n", encoding="utf-8")


def _safe_json_error(message: str) -> None:
    print(json.dumps({"success": False, "error": message}), flush=True)


def _result_value(result: Any, *names: str, default: Any = None) -> Any:
    if isinstance(result, dict):
        for name in names:
            value = result.get(name)
            if value:
                return value
        return default

    for name in names:
        value = getattr(result, name, None)
        if value:
            return value
    return default


def main() -> int:
    try:
        payload = json.loads(sys.stdin.read() or "{}")
    except json.JSONDecodeError as exc:
        _safe_json_error(f"Invalid bridge payload: {exc}")
        return 1

    github_url = str(payload.get("githubUrl") or "").strip()
    app_name = str(payload.get("appName") or payload.get("subdomain") or "app").strip()
    env_vars = payload.get("envVars") if isinstance(payload.get("envVars"), dict) else {}

    if not github_url.startswith("https://github.com/"):
        _safe_json_error("A public HTTPS GitHub repository URL is required")
        return 1

    tmp = Path(tempfile.mkdtemp(prefix="varity-gateway-deploy-"))
    try:
        project_dir = tmp / "repo"
        _run(["git", "clone", "--depth", "1", github_url, str(project_dir)])
        _write_env_file(project_dir, {str(k): str(v) for k, v in env_vars.items()})

        orchestrator = DeploymentOrchestrator(verbose=False)
        try:
            project_info = orchestrator._detect_project(str(project_dir))
        except ProjectDetectionError as exc:
            _safe_json_error(str(exc))
            return 1

        services = orchestrator._detect_services(str(project_dir))
        user_env = orchestrator._load_env_vars(str(project_dir))
        port = detect_app_port(str(project_dir), project_info.project_type)
        python_start = detect_python_start_command(str(project_dir))

        deploy_stdout = StringIO()
        with redirect_stdout(deploy_stdout):
            result = deploy_to_akash(
                github_repo_url=github_url,
                app_name=app_name,
                project_type=project_info.project_type,
                services=services,
                port=port,
                python_start_command=python_start,
                env_vars=user_env,
                package_manager=project_info.package_manager or "npm",
                api_key=os.environ.get("VARITY_AKASH_CONSOLE_KEY") or os.environ.get("AKASH_CONSOLE_API_KEY"),
                verbose=False,
                wait_for_health=False,
            )
        captured_logs = deploy_stdout.getvalue().strip()
        if captured_logs:
            print(captured_logs, file=sys.stderr, flush=True)

        if not result.success:
            _safe_json_error(result.error_message or "Deployment failed")
            return 1

        deployment_id = _result_value(result, "dseq", "deployment_id", "deploymentId")
        provider_url = _result_value(result, "url", "service_url", "frontend_url", default="")
        provider = _result_value(result, "provider", default="")

        print(json.dumps({
            "success": True,
            "deploymentId": deployment_id,
            "providerUrl": provider_url,
            "provider": provider,
            "estimatedMonthlyCost": _result_value(result, "estimated_monthly_cost", "estimatedMonthlyCost", default=0.0),
            "plan": {
                "projectType": project_info.project_type,
                "displayName": project_info.display_name or project_info.name,
                "description": project_info.description,
                "packageManager": project_info.package_manager,
                "services": services,
                "port": port,
                "pythonStartCommand": python_start,
                "envVarCount": len(user_env),
            },
        }), flush=True)
        return 0
    except subprocess.CalledProcessError as exc:
        stderr = exc.stderr.strip() if exc.stderr else str(exc)
        _safe_json_error(stderr[-1200:])
        return 1
    except Exception as exc:
        _safe_json_error(str(exc))
        return 1
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


if __name__ == "__main__":
    raise SystemExit(main())
