"""
Project detection for various framework types.

This module detects project types by analyzing package.json, configuration files,
and directory structure.
"""

import json
from pathlib import Path
from typing import Optional

from .types import ProjectDetectionError, ProjectInfo


class ProjectDetector:
    """
    Detect project type and configuration.

    Supports:
    - Next.js (package.json with "next" dependency)
    - React (package.json with "react" but no "next")
    - Vue.js (package.json with "vue")
    - Node.js backend (package.json with "express" or "fastify")
    - Python backend (requirements.txt or pyproject.toml)
    """

    def detect(self, project_path: str) -> ProjectInfo:
        """
        Detect project type by analyzing files in directory.

        Args:
            project_path: Path to the project directory

        Returns:
            ProjectInfo with detected project details

        Raises:
            ProjectDetectionError: If project type cannot be detected
        """
        path = Path(project_path)

        if not path.exists():
            raise ProjectDetectionError(f"Project path does not exist: {project_path}")

        # Check for JavaScript/TypeScript project
        package_json_path = path / "package.json"
        if package_json_path.exists():
            return self._detect_js_project(path, package_json_path)

        # Check for Python project
        requirements_path = path / "requirements.txt"
        pyproject_path = path / "pyproject.toml"
        if requirements_path.exists() or pyproject_path.exists():
            return self._detect_python_project(path)

        # Unable to detect
        raise ProjectDetectionError(
            "Could not detect project type. Supported types:\n"
            "  - Next.js (package.json with 'next')\n"
            "  - React (package.json with 'react')\n"
            "  - Vue.js (package.json with 'vue')\n"
            "  - Node.js (package.json with 'express' or 'fastify')\n"
            "  - Python (requirements.txt or pyproject.toml)"
        )

    def _detect_js_project(self, project_path: Path, package_json_path: Path) -> ProjectInfo:
        """
        Detect JavaScript/TypeScript project type.

        Args:
            project_path: Path to the project directory
            package_json_path: Path to package.json

        Returns:
            ProjectInfo for the detected project

        Raises:
            ProjectDetectionError: If project type is unsupported
        """
        try:
            with open(package_json_path, "r", encoding="utf-8") as f:
                package_json = json.load(f)
        except (json.JSONDecodeError, IOError) as e:
            raise ProjectDetectionError(f"Failed to read package.json: {e}")

        # Get project name and description from package.json
        raw_name = package_json.get("name", project_path.name)
        project_description = package_json.get("description") or None

        # Resolve display name for the deployment card hero text
        # Priority: varity.displayName > auto title-cased name
        varity_config = package_json.get("varity", {})
        display_name = varity_config.get("displayName")
        if not display_name:
            # Strip npm scope (@org/name → name), replace hyphens/underscores, title-case
            clean = raw_name.split("/")[-1] if "/" in raw_name else raw_name
            display_name = clean.replace("-", " ").replace("_", " ").title()

        # project_name stays as the raw slug (used for subdomain)
        project_name = raw_name

        # Merge dependencies and devDependencies
        dependencies = {
            **package_json.get("dependencies", {}),
            **package_json.get("devDependencies", {}),
        }

        # Detect package manager
        package_manager = self._detect_package_manager(project_path)

        # Check for backend
        has_backend = (project_path / "server").exists()

        # Detect framework
        if "next" in dependencies:
            return self._detect_nextjs(project_path, project_name, display_name, dependencies, package_manager, has_backend, project_description)

        elif "react" in dependencies or "react-scripts" in dependencies:
            return self._detect_react(project_path, project_name, display_name, dependencies, package_manager, has_backend, project_description)

        elif "vue" in dependencies:
            return self._detect_vue(project_path, project_name, display_name, dependencies, package_manager, has_backend, project_description)

        elif "express" in dependencies or "fastify" in dependencies:
            return self._detect_nodejs(project_path, project_name, display_name, dependencies, package_manager, project_description)

        else:
            dep_list = ", ".join(list(dependencies.keys())[:10])
            raise ProjectDetectionError(
                f"Unknown JavaScript framework. Found dependencies: {dep_list}...\n"
                "Supported: Next.js, React, Vue, Express, Fastify"
            )

    def _detect_nextjs(
        self, project_path: Path, project_name: str, display_name: str,
        dependencies: dict, package_manager: str, has_backend: bool,
        description: Optional[str] = None,
    ) -> ProjectInfo:
        """Detect Next.js project configuration."""
        is_static_export = self._is_nextjs_static_export(project_path)

        return ProjectInfo(
            name=project_name,
            project_type="nextjs",
            framework_version=dependencies.get("next", "unknown"),
            build_command=f"{package_manager} run build",
            output_dir="out" if is_static_export else ".next",
            package_manager=package_manager,
            display_name=display_name,
            description=description,
            has_backend=has_backend or not is_static_export,
        )

    def _detect_react(
        self, project_path: Path, project_name: str, display_name: str,
        dependencies: dict, package_manager: str, has_backend: bool,
        description: Optional[str] = None,
    ) -> ProjectInfo:
        """Detect React project configuration (CRA or Vite)."""
        is_vite = "vite" in dependencies

        return ProjectInfo(
            name=project_name,
            project_type="react",
            framework_version=dependencies.get("react", "unknown"),
            build_command=f"{package_manager} run build",
            output_dir="dist" if is_vite else "build",
            package_manager=package_manager,
            display_name=display_name,
            description=description,
            has_backend=has_backend,
        )

    def _detect_vue(
        self, project_path: Path, project_name: str, display_name: str,
        dependencies: dict, package_manager: str, has_backend: bool,
        description: Optional[str] = None,
    ) -> ProjectInfo:
        """Detect Vue.js project configuration."""
        return ProjectInfo(
            name=project_name,
            project_type="vue",
            framework_version=dependencies.get("vue", "unknown"),
            build_command=f"{package_manager} run build",
            output_dir="dist",
            package_manager=package_manager,
            display_name=display_name,
            description=description,
            has_backend=has_backend,
        )

    def _detect_nodejs(
        self, project_path: Path, project_name: str, display_name: str,
        dependencies: dict, package_manager: str,
        description: Optional[str] = None,
    ) -> ProjectInfo:
        """Detect Node.js backend project configuration."""
        framework = "express" if "express" in dependencies else "fastify"

        return ProjectInfo(
            name=project_name,
            project_type="nodejs",
            framework_version=dependencies.get(framework, "unknown"),
            build_command="",
            output_dir=".",
            package_manager=package_manager,
            display_name=display_name,
            description=description,
            has_backend=True,
        )

    def _detect_python_project(self, project_path: Path) -> ProjectInfo:
        """
        Detect Python project configuration.

        Args:
            project_path: Path to the project directory

        Returns:
            ProjectInfo for Python project
        """
        # Use directory name as project name for Python projects
        project_name = project_path.name

        return ProjectInfo(
            name=project_name,
            project_type="python",
            framework_version=None,
            build_command="",  # Python typically doesn't require build step
            output_dir=".",
            package_manager="pip",
            has_backend=True,
        )

    def _detect_package_manager(self, project_path: Path) -> str:
        """
        Detect package manager (npm, pnpm, yarn).

        Args:
            project_path: Path to the project directory

        Returns:
            Package manager name ('npm', 'pnpm', or 'yarn')
        """
        if (project_path / "pnpm-lock.yaml").exists():
            return "pnpm"
        elif (project_path / "yarn.lock").exists():
            return "yarn"
        else:
            return "npm"

    def _is_nextjs_static_export(self, project_path: Path) -> bool:
        """
        Check if Next.js project uses static export.

        Args:
            project_path: Path to the project directory

        Returns:
            True if using static export (output: 'export')
        """
        # Check next.config.js
        next_config_js = project_path / "next.config.js"
        if next_config_js.exists():
            try:
                content = next_config_js.read_text(encoding="utf-8")
                if 'output: "export"' in content or "output: 'export'" in content:
                    return True
            except IOError:
                pass

        # Check next.config.mjs
        next_config_mjs = project_path / "next.config.mjs"
        if next_config_mjs.exists():
            try:
                content = next_config_mjs.read_text(encoding="utf-8")
                if 'output: "export"' in content or "output: 'export'" in content:
                    return True
            except IOError:
                pass

        # Check next.config.ts
        next_config_ts = project_path / "next.config.ts"
        if next_config_ts.exists():
            try:
                content = next_config_ts.read_text(encoding="utf-8")
                if 'output: "export"' in content or "output: 'export'" in content:
                    return True
            except IOError:
                pass

        return False
