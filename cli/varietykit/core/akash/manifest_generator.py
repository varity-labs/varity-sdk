"""
Akash SDL Manifest Generator

Generates Akash SDL (Stack Definition Language) manifests for deploying
applications to Akash Network.

Supports:
- Frontend deployments (static sites served via Nginx)
- Backend deployments (Node.js, Python services)
- Custom resource allocation
- Environment variable injection
"""

import os
from pathlib import Path
from typing import Dict, List, Optional, Tuple, cast

from jinja2 import Template

from ..types import BuildArtifacts, ProjectInfo
from .types import AkashManifest


class ManifestGenerator:
    """
    Generates Akash SDL manifests from project configurations.

    Uses Jinja2 templates to create SDL YAML files for different deployment types.
    """

    def __init__(self, templates_dir: Optional[str] = None):
        """
        Initialize manifest generator.

        Args:
            templates_dir: Path to SDL template directory (defaults to built-in templates)
        """
        if templates_dir is None:
            # Use built-in templates
            # From varitykit/core/akash/manifest_generator.py
            # → parent (akash) → parent (core) → parent (varitykit) → parent (cli) → templates/akash
            self.templates_dir = Path(__file__).parent.parent.parent.parent / "templates" / "akash"
        else:
            self.templates_dir = Path(templates_dir)

        if not self.templates_dir.exists():
            raise FileNotFoundError(f"Akash templates directory not found: {self.templates_dir}")

    def generate_frontend_manifest(
        self,
        project_info: ProjectInfo,
        build_artifacts: BuildArtifacts,
        docker_image: str = "nginx:alpine",
        cpu_units: float = 0.5,
        memory_size: str = "512Mi",
        storage_size: str = "1Gi",
        env_vars: Optional[Dict[str, str]] = None,
    ) -> AkashManifest:
        """
        Generate SDL manifest for frontend deployment.

        Creates a manifest for deploying static frontend applications using Nginx.

        Args:
            project_info: Detected project information
            build_artifacts: Built frontend artifacts
            docker_image: Docker image to use (default: nginx:alpine)
            cpu_units: CPU allocation (default: 0.5 = 500m)
            memory_size: Memory allocation (default: 512Mi)
            storage_size: Storage allocation (default: 1Gi)
            env_vars: Optional environment variables

        Returns:
            AkashManifest with frontend SDL configuration

        Example:
            manifest = generator.generate_frontend_manifest(
                project_info,
                build_artifacts,
                cpu_units=1.0,
                memory_size="1Gi"
            )
        """
        template_path = self.templates_dir / "frontend.sdl.yaml"

        if not template_path.exists():
            raise FileNotFoundError(f"Frontend template not found: {template_path}")

        # Load template
        with open(template_path, "r") as f:
            template_content = f.read()

        template = Template(template_content)

        # Prepare template variables
        context = {
            "docker_image": docker_image,
            "cpu_units": cpu_units,
            "memory_size": memory_size,
            "storage_size": storage_size,
            "env_vars": env_vars or {},
            "project_name": project_info.name,
            "framework": project_info.framework_version,
        }

        # Render template
        yaml_content = template.render(**context)

        # Create manifest object
        manifest = AkashManifest(version="2.0", yaml_content=yaml_content)

        return manifest

    def generate_backend_manifest(
        self,
        project_info: ProjectInfo,
        build_artifacts: BuildArtifacts,
        runtime: str = "nodejs",
        docker_image: Optional[str] = None,
        port: int = 3000,
        cpu_units: float = 1.0,
        memory_size: str = "1Gi",
        storage_size: str = "2Gi",
        env_vars: Optional[Dict[str, str]] = None,
        command: Optional[List[str]] = None,
    ) -> AkashManifest:
        """
        Generate SDL manifest for backend deployment.

        Creates a manifest for deploying backend services (Node.js, Python, etc).

        Args:
            project_info: Detected project information
            build_artifacts: Built backend artifacts
            runtime: Runtime type ('nodejs', 'python', 'go')
            docker_image: Docker image (auto-selected if None)
            port: Application port (default: 3000)
            cpu_units: CPU allocation (default: 1.0)
            memory_size: Memory allocation (default: 1Gi)
            storage_size: Storage allocation (default: 2Gi)
            env_vars: Optional environment variables
            command: Custom start command

        Returns:
            AkashManifest with backend SDL configuration

        Example:
            manifest = generator.generate_backend_manifest(
                project_info,
                build_artifacts,
                runtime='nodejs',
                port=4000,
                env_vars={'DATABASE_URL': 'postgresql://...'}
            )
        """
        template_path = self.templates_dir / "backend.sdl.yaml"

        if not template_path.exists():
            raise FileNotFoundError(f"Backend template not found: {template_path}")

        # Auto-select Docker image if not provided
        if docker_image is None:
            docker_image = self._get_default_docker_image(runtime)

        # Auto-select command if not provided
        if command is None:
            command = self._get_default_command(runtime)

        # Load template
        with open(template_path, "r") as f:
            template_content = f.read()

        template = Template(template_content)

        # Prepare template variables
        context = {
            "docker_image": docker_image,
            "port": port,
            "cpu_units": cpu_units,
            "memory_size": memory_size,
            "storage_size": storage_size,
            "env_vars": env_vars or {},
            "command": command,
            "runtime": runtime,
            "project_name": project_info.project_type,
        }

        # Render template
        yaml_content = template.render(**context)

        # Create manifest object
        manifest = AkashManifest(version="2.0", yaml_content=yaml_content)

        return manifest

    def generate_fullstack_manifest(
        self,
        project_info: ProjectInfo,
        frontend_artifacts: BuildArtifacts,
        backend_artifacts: BuildArtifacts,
        backend_runtime: str = "nodejs",
        backend_port: int = 3000,
        frontend_cpu: float = 0.5,
        backend_cpu: float = 1.0,
        frontend_memory: str = "512Mi",
        backend_memory: str = "1Gi",
        env_vars: Optional[Dict[str, str]] = None,
    ) -> AkashManifest:
        """
        Generate SDL manifest for full-stack deployment.

        Creates a manifest deploying both frontend and backend services together.

        Args:
            project_info: Detected project information
            frontend_artifacts: Built frontend artifacts
            backend_artifacts: Built backend artifacts
            backend_runtime: Backend runtime type
            backend_port: Backend service port
            frontend_cpu: Frontend CPU allocation
            backend_cpu: Backend CPU allocation
            frontend_memory: Frontend memory allocation
            backend_memory: Backend memory allocation
            env_vars: Optional environment variables

        Returns:
            AkashManifest with full-stack SDL configuration
        """
        # Build combined manifest
        services = {
            "frontend": {
                "image": "nginx:alpine",
                "expose": [{"port": 80, "as": 80, "to": [{"global": True}]}],
            },
            "backend": {
                "image": self._get_default_docker_image(backend_runtime),
                "expose": [{"port": backend_port, "as": backend_port, "to": [{"global": True}]}],
                "env": list(env_vars.items()) if env_vars else [],
            },
        }

        profiles = {
            "compute": {
                "frontend": {
                    "resources": {
                        "cpu": {"units": frontend_cpu},
                        "memory": {"size": frontend_memory},
                        "storage": {"size": "1Gi"},
                    }
                },
                "backend": {
                    "resources": {
                        "cpu": {"units": backend_cpu},
                        "memory": {"size": backend_memory},
                        "storage": {"size": "2Gi"},
                    }
                },
            },
            "placement": {
                "default": {
                    "pricing": {
                        "frontend": {"denom": "uakt", "amount": 1000},
                        "backend": {"denom": "uakt", "amount": 2000},
                    }
                }
            },
        }

        deployment = {
            "frontend": {"default": {"profile": "frontend", "count": 1}},
            "backend": {"default": {"profile": "backend", "count": 1}},
        }

        manifest = AkashManifest(
            version="2.0", services=services, profiles=profiles, deployment=deployment
        )

        return manifest

    def _get_default_docker_image(self, runtime: str) -> str:
        """
        Get default Docker image for runtime.

        Args:
            runtime: Runtime type ('nodejs', 'python', 'go')

        Returns:
            Default Docker image name
        """
        images = {
            "nodejs": "node:18-alpine",
            "python": "python:3.11-slim",
            "go": "golang:1.21-alpine",
            "rust": "rust:1.74-alpine",
        }
        return images.get(runtime, "node:18-alpine")

    def _get_default_command(self, runtime: str) -> List[str]:
        """
        Get default start command for runtime.

        Args:
            runtime: Runtime type

        Returns:
            Default command as list of strings
        """
        commands = {
            "nodejs": ["node", "index.js"],
            "python": ["python", "main.py"],
            "go": ["./app"],
            "rust": ["./target/release/app"],
        }
        return commands.get(runtime, ["node", "index.js"])

    def validate_manifest(self, manifest: AkashManifest) -> Tuple[bool, Optional[str]]:
        """
        Validate SDL manifest structure.

        Args:
            manifest: Manifest to validate

        Returns:
            Tuple of (is_valid, error_message)
        """
        try:
            yaml_content = manifest.to_yaml()

            # Basic validation checks
            if not yaml_content:
                return False, "Manifest is empty"

            if "version" not in yaml_content:
                return False, "Manifest missing version field"

            if "services" not in yaml_content:
                return False, "Manifest missing services section"

            return True, None

        except Exception as e:
            return False, f"Validation error: {str(e)}"
