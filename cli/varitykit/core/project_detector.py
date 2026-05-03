"""
Project detection for various framework types.

This module detects project types by analyzing package.json, configuration files,
and directory structure.
"""

import json
from pathlib import Path
from typing import List, Optional, Tuple

from .types import ProjectDetectionError, ProjectInfo


class ProjectDetector:
    """
    Detect project type and configuration.

    Supports:
    - Plain HTML/JS static sites (index.html with no package.json, or varity.config.json framework: static)
    - Next.js (package.json with "next" dependency)
    - Astro (package.json with "astro" dependency)
    - React (package.json with "react" or "@vitejs/plugin-react*")
    - Vue.js (package.json with "vue" or "@vitejs/plugin-vue*")
    - Qwik/QwikCity (package.json with "@builder.io/qwik" or "@builder.io/qwik-city")
    - Vite SPA (package.json with "vite" — framework inferred from plugins)
    - Node.js backend (package.json with "express", "fastify", "@nestjs/core", "koa", or "hono")
    - Plain Node.js (package.json with scripts.start but no framework deps)
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

        # varity.config.json framework hint takes priority over auto-detection
        varity_config = self._read_varity_config(path)
        if varity_config.get("framework") == "static":
            return self._detect_static_html(path, varity_config)

        # Check for JavaScript/TypeScript project
        package_json_path = path / "package.json"
        if package_json_path.exists():
            return self._detect_js_project(path, package_json_path)

        # Dockerfile-only project (no package/requirements) should still be
        # routable as dynamic backend.
        if (path / "Dockerfile").exists():
            return ProjectInfo(
                name=path.name,
                project_type="dockerfile",
                framework_version=None,
                build_command="",
                output_dir=".",
                package_manager="npm",
                has_backend=True,
            )

        # Check for Python project
        requirements_path = path / "requirements.txt"
        pyproject_path = path / "pyproject.toml"
        if requirements_path.exists() or pyproject_path.exists():
            return self._detect_python_project(path)

        # Plain HTML/JS static site: index.html present, no package.json
        if (path / "index.html").exists():
            return self._detect_static_html(path, varity_config)

        # Check for known-but-unsupported languages before giving generic error
        unsupported = self._detect_unsupported_language(path)
        if unsupported:
            marker_file, language = unsupported
            raise ProjectDetectionError(
                f"Found {marker_file} — {language} deployments are not yet supported. "
                "Varity currently supports: Next.js, Astro, React, Vue, Node.js (Express/Fastify/NestJS/Koa/Hono), "
                "Python (FastAPI/Django/Flask). "
                f"Request {language} support at https://github.com/varity-labs/varity/issues/new?title=Support+{language.replace(' ', '+')}"
            )

        # Unable to detect
        raise ProjectDetectionError(
            "Could not detect project type. Supported types:\n"
            "  - Static HTML/JS (index.html or varity.config.json with framework: static)\n"
            "  - Next.js (package.json with 'next')\n"
            "  - Astro (package.json with 'astro')\n"
            "  - React (package.json with 'react' or '@vitejs/plugin-react')\n"
            "  - Vue.js (package.json with 'vue' or '@vitejs/plugin-vue')\n"
            "  - Vite SPA (package.json with 'vite')\n"
            "  - Node.js (package.json with 'express', 'fastify', '@nestjs/core', 'koa', 'hono', or scripts.start)\n"
            "  - Static HTML/JS (index.html in repo root)\n"
            "  - Python (requirements.txt or pyproject.toml)"
        )

    def _read_varity_config(self, project_path: Path) -> dict:
        """Read varity.config.json if present, returning empty dict on any error."""
        config_path = project_path / "varity.config.json"
        if config_path.exists():
            try:
                return json.loads(config_path.read_text(encoding="utf-8"))
            except (json.JSONDecodeError, IOError):
                pass
        return {}

    def _detect_static_html(self, project_path: Path, varity_config: dict) -> ProjectInfo:
        """Detect plain HTML/JS static site (no build step required)."""
        project_name = varity_config.get("name") or project_path.name
        clean = project_name.split("/")[-1] if "/" in project_name else project_name
        display_name = clean.replace("-", " ").replace("_", " ").title()
        return ProjectInfo(
            name=project_name,
            project_type="static",
            framework_version=None,
            build_command="",
            output_dir=".",
            package_manager="npm",
            display_name=display_name,
            has_backend=False,
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

        elif "astro" in dependencies:
            return self._detect_astro(project_path, project_name, display_name, dependencies, package_manager, project_description)

        elif "react" in dependencies or "react-scripts" in dependencies:
            return self._detect_react(project_path, project_name, display_name, dependencies, package_manager, has_backend, project_description)

        elif "vue" in dependencies:
            return self._detect_vue(project_path, project_name, display_name, dependencies, package_manager, has_backend, project_description)

        elif "@builder.io/qwik-city" in dependencies or "@builder.io/qwik" in dependencies:
            return self._detect_qwik(project_path, project_name, display_name, dependencies, package_manager, project_description)

        elif any(fw in dependencies for fw in ("express", "fastify", "@nestjs/core", "koa", "hono")):
            return self._detect_nodejs(project_path, project_name, display_name, dependencies, package_manager, project_description)

        elif "vite" in dependencies:
            # Vite is a build tool, not a framework. Infer actual framework from plugins.
            return self._detect_vite(project_path, project_name, display_name, dependencies, package_manager, has_backend, project_description)

        elif package_json.get("scripts", {}).get("start"):
            # Plain Node.js: scripts.start present but no recognized framework dep
            return self._detect_nodejs(project_path, project_name, display_name, dependencies, package_manager, project_description)

        else:
            workspace_project = self._detect_workspace_project(
                project_path=project_path,
                root_package_json=package_json,
                root_package_manager=package_manager,
                root_project_name=project_name,
                root_display_name=display_name,
            )
            if workspace_project is not None:
                return workspace_project

            dep_list = ", ".join(list(dependencies.keys())[:10])
            raise ProjectDetectionError(
                f"Unknown JavaScript framework. Found dependencies: {dep_list}...\n"
                "Supported: Next.js, Astro, React, Vue, Qwik/QwikCity, Express, Fastify, NestJS, Koa, Hono, "
                "or plain Node.js (package.json with scripts.start)"
            )

    def _detect_workspace_project(
        self,
        project_path: Path,
        root_package_json: dict,
        root_package_manager: str,
        root_project_name: str,
        root_display_name: str,
    ) -> Optional[ProjectInfo]:
        """Fallback detection for monorepos with framework deps inside workspaces.

        Some templates keep root deps minimal (turbo/typescript/prettier) and place
        framework deps in workspace packages such as apps/web.
        """
        workspace_patterns = self._get_workspace_patterns(root_package_json)
        if not workspace_patterns:
            return None

        root_has_build_script = bool(root_package_json.get("scripts", {}).get("build"))
        for member_pkg_path in self._iter_workspace_package_jsons(project_path, workspace_patterns):
            try:
                member_info = self._detect_js_project(
                    member_pkg_path.parent, member_pkg_path
                )
            except ProjectDetectionError:
                continue

            if root_has_build_script:
                member_info.build_command = f"{root_package_manager} run build"

            member_info.name = root_project_name
            member_info.display_name = root_display_name
            return member_info

        return None

    def _get_workspace_patterns(self, package_json: dict) -> List[str]:
        workspaces = package_json.get("workspaces")
        if isinstance(workspaces, list):
            return [p for p in workspaces if isinstance(p, str)]
        if isinstance(workspaces, dict):
            packages = workspaces.get("packages", [])
            if isinstance(packages, list):
                return [p for p in packages if isinstance(p, str)]
        return []

    def _iter_workspace_package_jsons(
        self, project_path: Path, workspace_patterns: List[str]
    ) -> List[Path]:
        candidates: List[Path] = []
        for pattern in workspace_patterns:
            for workspace_dir in project_path.glob(pattern):
                if not workspace_dir.is_dir():
                    continue
                pkg_json = workspace_dir / "package.json"
                if pkg_json.exists():
                    candidates.append(pkg_json)
        return sorted(set(candidates))

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

    def _detect_astro(
        self, project_path: Path, project_name: str, display_name: str,
        dependencies: dict, package_manager: str,
        description: Optional[str] = None,
    ) -> ProjectInfo:
        """Detect Astro project configuration."""
        has_node_adapter = "@astrojs/node" in dependencies
        return ProjectInfo(
            name=project_name,
            project_type="astro",
            framework_version=dependencies.get("astro", "unknown"),
            build_command=f"{package_manager} run build",
            output_dir="dist",
            package_manager=package_manager,
            display_name=display_name,
            description=description,
            has_backend=has_node_adapter,
        )

    def _detect_qwik(
        self, project_path: Path, project_name: str, display_name: str,
        dependencies: dict, package_manager: str,
        description: Optional[str] = None,
    ) -> ProjectInfo:
        """Detect Qwik/QwikCity project configuration."""
        has_qwikcity = "@builder.io/qwik-city" in dependencies
        return ProjectInfo(
            name=project_name,
            project_type="qwik",
            framework_version=dependencies.get("@builder.io/qwik", "unknown"),
            build_command=f"{package_manager} run build",
            output_dir="dist",
            package_manager=package_manager,
            display_name=display_name,
            description=description,
            has_backend=has_qwikcity,
        )

    def _detect_vite(
        self, project_path: Path, project_name: str, display_name: str,
        dependencies: dict, package_manager: str, has_backend: bool,
        description: Optional[str] = None,
    ) -> ProjectInfo:
        """Detect Vite project by inferring framework from installed plugins.

        Vite is a build tool, not a framework. When the framework package
        (react, vue) is not listed directly, we fall back to plugin names.
        """
        if "@vitejs/plugin-vue" in dependencies or "@vitejs/plugin-vue-jsx" in dependencies:
            return self._detect_vue(project_path, project_name, display_name, dependencies, package_manager, has_backend, description)
        # React plugins (SWC or Babel transform) both imply React
        if "@vitejs/plugin-react" in dependencies or "@vitejs/plugin-react-swc" in dependencies:
            return self._detect_react(project_path, project_name, display_name, dependencies, package_manager, has_backend, description)
        # No recognised framework plugin — treat as a generic static SPA (output: dist)
        return ProjectInfo(
            name=project_name,
            project_type="react",
            framework_version=dependencies.get("vite", "unknown"),
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
        framework_to_project_type = {
            "express": "express",
            "fastify": "fastify",
            "@nestjs/core": "nestjs",
            "koa": "koa",
            "hono": "hono",
        }
        framework = "express"
        project_type = "nodejs"
        for fw in framework_to_project_type:
            if fw in dependencies:
                framework = fw
                project_type = framework_to_project_type[fw]
                break

        return ProjectInfo(
            name=project_name,
            project_type=project_type,
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

    _UNSUPPORTED_LANGUAGES: List[Tuple[str, str]] = [
        ("go.mod", "Go"),
        ("Cargo.toml", "Rust"),
        ("Gemfile", "Ruby"),
        ("pom.xml", "Java"),
        ("build.gradle", "Java"),
        ("build.gradle.kts", "Kotlin"),
        ("mix.exs", "Elixir"),
        ("composer.json", "PHP"),
        ("deno.json", "Deno"),
        ("deno.jsonc", "Deno"),
    ]

    def _detect_unsupported_language(self, project_path: Path) -> Optional[Tuple[str, str]]:
        """Return (marker_file, language) if an unsupported language marker is found."""
        for marker, language in self._UNSUPPORTED_LANGUAGES:
            if (project_path / marker).exists():
                return marker, language
        # .csproj uses a glob pattern
        csproj_files = list(project_path.glob("*.csproj"))
        if csproj_files:
            return csproj_files[0].name, "C#"
        return None

    def _detect_package_manager(self, project_path: Path) -> str:
        """
        Detect package manager (bun, pnpm, yarn, npm).

        Args:
            project_path: Path to the project directory

        Returns:
            Package manager name ('bun', 'pnpm', 'yarn', or 'npm')
        """
        if (project_path / "bun.lockb").exists() or (project_path / "bun.lock").exists():
            return "bun"
        elif (project_path / "pnpm-lock.yaml").exists():
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

        # Check next.config.cjs
        next_config_cjs = project_path / "next.config.cjs"
        if next_config_cjs.exists():
            try:
                content = next_config_cjs.read_text(encoding="utf-8")
                if 'output: "export"' in content or "output: 'export'" in content:
                    return True
            except IOError:
                pass

        return False
