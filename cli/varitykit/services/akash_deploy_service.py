"""
Akash Deploy Service — End-to-end dynamic app deployment.

Handles the complete flow:
1. Detect if app needs dynamic hosting (Next.js server, Express, etc.)
2. Build Docker image via Nixpacks (or use existing Dockerfile)
3. Push to GitHub Container Registry (GHCR)
4. Deploy to compute network via Akash Console API
5. Wait for provider assignment and app readiness
6. Register with Gateway for clean URL (varity.app/{name})

Zero crypto jargon in any user-facing output.
"""

import json
import os
import shutil
import subprocess
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, Optional

from rich.console import Console

from varitykit.core.akash.console_deployer import AkashConsoleDeployer
from varitykit.core.akash.types import (
    AkashError,
)
from varitykit.core.types import ProjectInfo


# Default free credits for new accounts
FREE_CREDITS_USD = 100.0

# GHCR registry prefix
GHCR_REGISTRY = "ghcr.io/varity-labs"

# Console for rich output
console = Console()


@dataclass
class AkashDeployConfig:
    """Configuration for an Akash deployment."""

    app_name: str
    project_path: str
    project_info: ProjectInfo
    docker_image: Optional[str] = None  # Pre-built image, skip build step
    port: int = 3000
    cpu: float = 0.5
    memory: str = "512Mi"
    storage: str = "1Gi"
    env_vars: Dict[str, str] = field(default_factory=dict)
    api_key: Optional[str] = None  # Akash Console API key


@dataclass
class AkashDeployResult:
    """Result of a complete Akash deployment."""

    success: bool
    app_url: str = ""  # Clean URL: https://varity.app/{name}
    provider_url: str = ""  # Raw provider URL
    deployment_id: str = ""
    docker_image: str = ""
    estimated_monthly_cost: float = 0.0
    free_credits_remaining: float = FREE_CREDITS_USD
    error_message: str = ""

    def to_dict(self) -> dict:
        return {
            "success": self.success,
            "app_url": self.app_url,
            "provider_url": self.provider_url,
            "deployment_id": self.deployment_id,
            "docker_image": self.docker_image,
            "estimated_monthly_cost": self.estimated_monthly_cost,
            "free_credits_remaining": self.free_credits_remaining,
            "error_message": self.error_message,
        }


class AkashDeployService:
    """
    End-to-end deployment service for dynamic apps on Akash.

    Abstracts away all infrastructure complexity. Developer sees:
      varitykit app deploy --hosting akash
      -> Building app image...
      -> Deploying to compute network...
      -> Done! https://varity.app/my-app
    """

    def __init__(self, verbose: bool = True):
        self.verbose = verbose
        self._console_deployer: Optional[AkashConsoleDeployer] = None

    def deploy(self, config: AkashDeployConfig) -> AkashDeployResult:
        """
        Execute full deployment pipeline.

        Args:
            config: Deployment configuration

        Returns:
            AkashDeployResult with URLs and deployment info
        """
        try:
            # Step 1: Build Docker image (if not pre-built)
            docker_image = config.docker_image
            if not docker_image:
                self._log("Building app image...")
                docker_image = self._build_image(config)
                self._log(f"  Image: {docker_image}")

            # Step 2: Push to registry
            self._log("Pushing to container registry...")
            self._push_image(docker_image)

            # Step 3: Generate SDL manifest
            self._log("Preparing deployment...")
            sdl = self._generate_sdl(
                docker_image=docker_image,
                app_name=config.app_name,
                port=config.port,
                cpu=config.cpu,
                memory=config.memory,
                storage=config.storage,
                env_vars=config.env_vars,
            )

            # Step 4: Deploy via Console API
            self._log("Deploying to compute network...")
            deployer = self._get_deployer(config.api_key)
            akash_result = deployer.deploy(sdl=sdl, deposit=5.0, wait_for_active=True)

            if not akash_result.success:
                return AkashDeployResult(
                    success=False,
                    error_message=akash_result.error_message or "Deployment failed",
                )

            self._log("  App running")

            # Step 5: Calculate costs
            monthly_cost = akash_result.estimated_monthly_cost
            free_remaining = max(0, FREE_CREDITS_USD - monthly_cost)

            return AkashDeployResult(
                success=True,
                provider_url=akash_result.url or "",
                deployment_id=akash_result.deployment_id or "",
                docker_image=docker_image,
                estimated_monthly_cost=monthly_cost,
                free_credits_remaining=free_remaining,
            )

        except AkashError as e:
            return AkashDeployResult(
                success=False,
                error_message=f"Compute deployment failed: {e}",
            )
        except Exception as e:
            return AkashDeployResult(
                success=False,
                error_message=str(e),
            )

    def _get_deployer(self, api_key: Optional[str] = None) -> AkashConsoleDeployer:
        """Get or create AkashConsoleDeployer instance."""
        if self._console_deployer is None:
            # Try to get API key from multiple sources
            key = api_key
            if not key:
                key = os.getenv("AKASH_CONSOLE_API_KEY")
            if not key:
                # Try credential proxy
                try:
                    from varitykit.services.credential_fetcher import (
                        CREDENTIAL_PROXY_URL,
                        _get_cli_api_key,
                    )
                    import urllib.request

                    cli_key = _get_cli_api_key()
                    if cli_key:
                        url = f"{CREDENTIAL_PROXY_URL}/api/credentials/akash"
                        req = urllib.request.Request(
                            url,
                            headers={"Authorization": f"Bearer {cli_key}"},
                        )
                        with urllib.request.urlopen(req, timeout=10) as response:
                            data = json.loads(response.read().decode())
                            key = data.get("api_key") or data.get("console_key")
                except Exception:
                    pass

            if not key:
                raise AkashError(
                    "Compute hosting not configured yet.\n"
                    "Set AKASH_CONSOLE_API_KEY environment variable or contact support."
                )

            self._console_deployer = AkashConsoleDeployer(api_key=key)
        return self._console_deployer

    def _build_image(self, config: AkashDeployConfig) -> str:
        """
        Build a Docker image from the project source.

        Uses Nixpacks if available, falls back to Dockerfile if present.
        Returns the full image tag (e.g., ghcr.io/varity-labs/my-app:abc123).
        """
        project_path = Path(config.project_path)
        app_name = _sanitize_image_name(config.app_name)

        # Generate a short tag from timestamp
        tag = hex(int(time.time()))[2:]
        image_name = f"{GHCR_REGISTRY}/{app_name}:{tag}"

        # Check for existing Dockerfile first
        dockerfile_path = project_path / "Dockerfile"
        has_dockerfile = dockerfile_path.exists()

        # Check if Docker is available
        if not _command_exists("docker"):
            raise AkashError(
                "Docker is required for dynamic hosting.\n"
                "Install Docker: https://docs.docker.com/get-docker/\n\n"
                "Alternatively, use --hosting static for static sites."
            )

        if has_dockerfile:
            # Build from Dockerfile
            self._log(f"  Using Dockerfile")
            result = subprocess.run(
                ["docker", "build", "-t", image_name, "."],
                cwd=str(project_path),
                capture_output=True,
                text=True,
                timeout=600,
            )
            if result.returncode != 0:
                # Show last 10 lines of build output for debugging
                stderr_lines = result.stderr.strip().split("\n")[-10:]
                raise AkashError(
                    f"Docker build failed:\n" + "\n".join(stderr_lines)
                )
        elif _command_exists("nixpacks"):
            # Build with Nixpacks (auto-detects framework)
            framework = config.project_info.project_type
            self._log(f"  Detected {framework} (using Nixpacks)")
            result = subprocess.run(
                ["nixpacks", "build", str(project_path), "--name", image_name],
                capture_output=True,
                text=True,
                timeout=600,
            )
            if result.returncode != 0:
                stderr_lines = result.stderr.strip().split("\n")[-10:]
                raise AkashError(
                    f"Build failed:\n" + "\n".join(stderr_lines)
                )
        else:
            # Generate a Dockerfile on-the-fly based on project type
            self._log(f"  Generating build configuration for {config.project_info.project_type}")
            temp_dockerfile = self._generate_dockerfile(config)
            try:
                result = subprocess.run(
                    ["docker", "build", "-t", image_name, "-f", str(temp_dockerfile), "."],
                    cwd=str(project_path),
                    capture_output=True,
                    text=True,
                    timeout=600,
                )
                if result.returncode != 0:
                    stderr_lines = result.stderr.strip().split("\n")[-10:]
                    raise AkashError(
                        f"Build failed:\n" + "\n".join(stderr_lines)
                    )
            finally:
                # Clean up generated Dockerfile (don't leave artifacts)
                if temp_dockerfile.exists() and temp_dockerfile.name == ".Dockerfile.varity":
                    temp_dockerfile.unlink()

        return image_name

    def _generate_dockerfile(self, config: AkashDeployConfig) -> Path:
        """
        Generate a Dockerfile based on the project type.

        This is the fallback when neither a Dockerfile nor Nixpacks is available.
        """
        project_path = Path(config.project_path)
        project_type = config.project_info.project_type
        pm = config.project_info.package_manager

        # Determine install command
        if pm == "pnpm":
            install_cmd = "corepack enable && pnpm install --frozen-lockfile"
        elif pm == "yarn":
            install_cmd = "yarn install --frozen-lockfile"
        else:
            install_cmd = "npm ci"

        # Determine build/start commands based on framework
        if project_type == "nextjs":
            dockerfile_content = f"""FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json pnpm-lock.yaml* yarn.lock* ./
RUN {install_cmd}
COPY . .
RUN {pm} run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE {config.port}
CMD ["node", "server.js"]
"""
        elif project_type in ("react", "vue"):
            # Static SPA served via nginx
            dockerfile_content = f"""FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json pnpm-lock.yaml* yarn.lock* ./
RUN {install_cmd}
COPY . .
RUN {pm} run build

FROM nginx:alpine
COPY --from=builder /app/{config.project_info.output_dir} /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
"""
        elif project_type == "nodejs":
            dockerfile_content = f"""FROM node:18-alpine
WORKDIR /app
COPY package*.json pnpm-lock.yaml* yarn.lock* ./
RUN {install_cmd}
COPY . .
EXPOSE {config.port}
CMD ["{pm}", "start"]
"""
        elif project_type == "python":
            dockerfile_content = f"""FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt* pyproject.toml* ./
RUN pip install --no-cache-dir -r requirements.txt 2>/dev/null || pip install --no-cache-dir .
COPY . .
EXPOSE {config.port}
CMD ["python", "main.py"]
"""
        else:
            # Generic Node.js fallback
            dockerfile_content = f"""FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install
EXPOSE {config.port}
CMD ["npm", "start"]
"""

        # Write to a temp Dockerfile in the project directory
        dockerfile_path = project_path / ".Dockerfile.varity"
        with open(dockerfile_path, "w") as f:
            f.write(dockerfile_content)

        return dockerfile_path

    def _push_image(self, image_name: str) -> None:
        """
        Push Docker image to GHCR.

        Requires either:
        - GITHUB_TOKEN env var (CI)
        - docker login to ghcr.io already done
        """
        # Check if we're already logged in by attempting push
        result = subprocess.run(
            ["docker", "push", image_name],
            capture_output=True,
            text=True,
            timeout=300,
        )

        if result.returncode != 0:
            # Try to login with GITHUB_TOKEN if available
            gh_token = os.getenv("GITHUB_TOKEN") or os.getenv("GH_TOKEN")
            if gh_token:
                login_result = subprocess.run(
                    ["docker", "login", "ghcr.io", "-u", "varity-labs", "--password-stdin"],
                    input=gh_token,
                    capture_output=True,
                    text=True,
                    timeout=30,
                )
                if login_result.returncode == 0:
                    # Retry push after login
                    result = subprocess.run(
                        ["docker", "push", image_name],
                        capture_output=True,
                        text=True,
                        timeout=300,
                    )
                    if result.returncode == 0:
                        return

            # If push still fails, provide helpful error
            raise AkashError(
                "Could not push image to container registry.\n\n"
                "To fix, run one of:\n"
                "  1. Set GITHUB_TOKEN env var with ghcr.io write access\n"
                "  2. Run: echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin\n"
                "  3. Use --docker-image to specify a pre-built image"
            )

    def _generate_sdl(
        self,
        docker_image: str,
        app_name: str,
        port: int = 3000,
        cpu: float = 0.5,
        memory: str = "512Mi",
        storage: str = "1Gi",
        env_vars: Optional[Dict[str, str]] = None,
    ) -> str:
        """
        Generate an Akash SDL manifest for the Docker image.

        Returns the SDL as a YAML string.
        """
        # Build env section
        env_section = ""
        if env_vars:
            env_lines = "\n".join(f'        - "{k}={v}"' for k, v in env_vars.items())
            env_section = f"\n      env:\n{env_lines}"

        # Determine expose port — if nginx-based (react/vue static), use 80
        expose_port = port

        sdl = f"""---
version: "2.0"

services:
  {app_name}:
    image: {docker_image}
    expose:
      - port: {expose_port}
        as: 80
        to:
          - global: true{env_section}

profiles:
  compute:
    {app_name}:
      resources:
        cpu:
          units: {cpu}
        memory:
          size: {memory}
        storage:
          size: {storage}
  placement:
    global:
      pricing:
        {app_name}:
          denom: uakt
          amount: 10000

deployment:
  {app_name}:
    global:
      profile: {app_name}
      count: 1
"""
        return sdl

    def _log(self, message: str):
        """Log a message if verbose mode is on."""
        if self.verbose:
            console.print(f"  {message}")


def detect_hosting_type(project_path: str) -> str:
    """
    Auto-detect whether a project needs static or dynamic hosting.

    Returns:
        "static" or "akash"
    """
    path = Path(project_path)
    package_json_path = path / "package.json"

    # Check for explicit Dockerfile -> definitely dynamic
    if (path / "Dockerfile").exists():
        return "akash"

    # Check for server directory -> dynamic
    if (path / "server").exists():
        return "akash"

    # Check package.json for clues
    if package_json_path.exists():
        try:
            with open(package_json_path, "r", encoding="utf-8") as f:
                pkg = json.load(f)
        except (json.JSONDecodeError, IOError):
            return "static"

        dependencies = {
            **pkg.get("dependencies", {}),
            **pkg.get("devDependencies", {}),
        }

        # Express, Fastify, NestJS, Koa -> definitely dynamic
        dynamic_deps = {"express", "fastify", "@nestjs/core", "koa", "hapi", "hono"}
        if dynamic_deps & set(dependencies.keys()):
            return "akash"

        # Next.js: check if it's server-rendered (not static export)
        if "next" in dependencies:
            # Check next.config for output: 'export'
            for config_file in ["next.config.js", "next.config.mjs", "next.config.ts"]:
                config_path = path / config_file
                if config_path.exists():
                    try:
                        content = config_path.read_text(encoding="utf-8")
                        if "output: 'export'" in content or 'output: "export"' in content:
                            return "static"
                    except IOError:
                        pass

            # Next.js without static export -> dynamic
            return "akash"

    # Python projects with requirements.txt -> dynamic
    if (path / "requirements.txt").exists() or (path / "pyproject.toml").exists():
        return "akash"

    # Default: static
    return "static"


def detect_app_port(project_path: str, project_type: str) -> int:
    """Detect the port the app listens on."""
    path = Path(project_path)

    # Check package.json scripts for port hints
    package_json_path = path / "package.json"
    if package_json_path.exists():
        try:
            with open(package_json_path, "r") as f:
                pkg = json.load(f)
            scripts = pkg.get("scripts", {})
            start_script = scripts.get("start", "") + scripts.get("dev", "")
            # Look for --port or PORT= in scripts
            if "--port" in start_script:
                import re
                match = re.search(r"--port\s+(\d+)", start_script)
                if match:
                    return int(match.group(1))
            if "PORT=" in start_script:
                import re
                match = re.search(r"PORT=(\d+)", start_script)
                if match:
                    return int(match.group(1))
        except Exception:
            pass

    # Default ports by framework
    port_map = {
        "nextjs": 3000,
        "react": 3000,
        "vue": 3000,
        "nodejs": 3000,
        "python": 8000,
    }
    return port_map.get(project_type, 3000)


def _sanitize_image_name(name: str) -> str:
    """Sanitize app name for use as a Docker image name."""
    import re

    # Strip npm scope
    if "/" in name:
        name = name.split("/")[-1]
    # Lowercase, replace invalid chars
    name = name.lower()
    name = re.sub(r"[^a-z0-9._-]", "-", name)
    name = re.sub(r"-{2,}", "-", name)
    name = name.strip("-.")
    if not name:
        name = "varity-app"
    return name


def _command_exists(cmd: str) -> bool:
    """Check if a command exists on the system."""
    return shutil.which(cmd) is not None
