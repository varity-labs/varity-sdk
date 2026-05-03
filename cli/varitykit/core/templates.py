"""
Template management for VarityKit
"""

import json
import shutil
import subprocess
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional

from varitykit.utils.logger import get_logger


@dataclass
class TemplateInfo:
    """Information about a template"""

    name: str
    description: str
    industry: str
    version: str
    repository: Optional[str] = None
    local_path: Optional[Path] = None
    features: Optional[List[str]] = None
    requirements: Optional[Dict[str, str]] = None

    def __post_init__(self):
        if self.features is None:
            self.features = []
        if self.requirements is None:
            self.requirements = {}


def _saas_starter_local_path() -> Optional[Path]:
    """Return the editable or packaged saas-starter path when available."""
    candidates = (
        Path(__file__).parent.parent.parent.parent / "templates" / "saas-starter",
        Path(__file__).parent.parent / "templates" / "saas-starter",
    )
    for candidate in candidates:
        if candidate.exists() and candidate.is_dir():
            return candidate
    return None


VARITY_PACKAGE_VERSIONS: Dict[str, str] = {
    "@varity-labs/sdk": "2.0.0-beta.15",
    "@varity-labs/types": "2.0.0-beta.9",
    "@varity-labs/ui-kit": "2.0.0-beta.16",
}


SAAS_STARTER_REQUIRED_FILES = (
    "package.json",
    "varity.config.json",
    "tsconfig.json",
    "next.config.js",
)

SAAS_STARTER_REQUIRED_DIRS = (
    "app",
    "src",
    "public",
)


class TemplateManager:
    """Manages project templates"""

    OFFICIAL_TEMPLATES = {
        "saas-starter": TemplateInfo(
            name="saas-starter",
            description="Full-stack SaaS starter — Next.js, auth, database, and payments",
            industry="saas-starter",
            version="1.0.0",
            repository="https://github.com/varity-labs/varity-sdk.git",
            local_path=_saas_starter_local_path(),
            features=["nextjs", "auth", "database", "payments"],
            requirements={"node": ">=20.0.0"},
        ),
    }

    def __init__(self, templates_dir: Optional[Path] = None):
        self.logger = get_logger()
        if templates_dir is None:
            # Default to ~/.varity/templates
            self.templates_dir = Path.home() / ".varity" / "templates"
        else:
            self.templates_dir = templates_dir

        self.templates_dir.mkdir(parents=True, exist_ok=True)

    def list_templates(self) -> List[TemplateInfo]:
        """List all available templates"""
        templates: List[TemplateInfo] = []

        # Add official templates
        templates.extend(self.OFFICIAL_TEMPLATES.values())

        # TODO: Add custom/community templates from local directory

        return templates

    def get_template(self, template_name: str) -> Optional[TemplateInfo]:
        """Get template by name"""
        # Check official templates
        if template_name in self.OFFICIAL_TEMPLATES:
            return self.OFFICIAL_TEMPLATES[template_name]

        # Check local templates
        local_template_path = self.templates_dir / template_name
        if local_template_path.exists():
            # Try to load template.json
            template_json = local_template_path / "template.json"
            if template_json.exists():
                try:
                    with open(template_json, "r") as f:
                        data = json.load(f)
                    return TemplateInfo(**data, local_path=local_template_path)
                except Exception as e:
                    self.logger.error(f"Failed to load template {template_name}: {e}")

        return None

    def install_template(self, template_name: str, force: bool = False) -> Path:
        """
        Install template from repository to local templates directory

        Args:
            template_name: Name of the template to install
            force: If True, reinstall even if already exists

        Returns:
            Path to installed template
        """
        template = self.get_template(template_name)
        if template is None:
            raise ValueError(f"Template '{template_name}' not found")

        target_path = self.templates_dir / template_name

        # Check if already installed
        if target_path.exists() and not force:
            self.logger.info(f"Template '{template_name}' already installed at {target_path}")
            return target_path

        # Remove existing if force
        if target_path.exists() and force:
            self.logger.info(f"Removing existing template at {target_path}")
            shutil.rmtree(target_path)

        # Install from repository
        if template.repository:
            self.logger.info(f"Installing template '{template_name}' from {template.repository}")
            try:
                subprocess.run(
                    ["git", "clone", template.repository, str(target_path)],
                    check=True,
                    capture_output=True,
                    text=True,
                )
                self.logger.info(f"Template '{template_name}' installed successfully")
                return target_path
            except subprocess.CalledProcessError as e:
                raise RuntimeError(f"Failed to install template: {e.stderr}")
        else:
            raise ValueError(f"Template '{template_name}' has no repository URL")

    def scaffold_project(
        self,
        template_name: str,
        project_path: Path,
        project_name: str,
        context: Optional[Dict[str, Any]] = None,
    ) -> Path:
        """
        Scaffold a new project from template using Copier

        Args:
            template_name: Name of template to use
            project_path: Path where project should be created
            project_name: Name of the project
            context: Additional context variables for template rendering

        Returns:
            Path to created project
        """
        template = self.get_template(template_name)
        if template is None:
            raise ValueError(f"Template '{template_name}' not found")

        # Ensure template is available. The published Python wheel does not
        # include the monorepo-level templates directory, so saas-starter must
        # have a no-network fallback for first-run init.
        if template.local_path:
            template_path = template.local_path
        elif template_name == "saas-starter":
            template_path = self.templates_dir / template_name
            if not self._is_valid_saas_template_dir(template_path):
                template_path = None
        elif template.repository:
            template_path = self.install_template(template_name)
        else:
            raise ValueError(f"Template '{template_name}' has no source")

        # Resolve template source directory. In packaged installs, official
        # template repositories may be cloned as full monorepos; in that case
        # we must use the nested template directory, not repo root.
        if template_path is not None:
            template_path = self._resolve_template_source(template_path, template_name)

        # Guard against stale cached templates in ~/.varity/templates that may
        # predate required scaffold paths (e.g. missing root app/).
        if template_name == "saas-starter" and (
            template_path is None or not self._is_valid_saas_template_dir(template_path)
        ):
            if template.repository and template_path is not None:
                self.logger.warning(
                    "Cached saas-starter template is missing required paths; reinstalling template cache"
                )
                try:
                    refreshed = self.install_template(template_name, force=True)
                    template_path = self._resolve_template_source(refreshed, template_name)
                except Exception as e:
                    self.logger.warning(f"Template cache refresh failed; using built-in fallback: {e}")

        # Prepare context
        template_context = {
            "project_name": project_name,
            "project_slug": project_name.lower().replace(" ", "-"),
            "industry": template.industry,
            **(context or {}),
        }

        self.logger.info(f"Scaffolding project '{project_name}' from template '{template_name}'")

        try:
            # Use copier to generate project
            # For now, we'll use a simple copy approach
            # TODO: Integrate with copier library for full templating support
            if template_name == "saas-starter" and (
                template_path is None or not self._is_valid_saas_template_dir(template_path)
            ):
                self._write_saas_starter_fallback(project_path, template_context)
            else:
                self._copy_template(template_path, project_path, template_context)

            if not self._scaffold_has_required_paths(template_name, project_path):
                raise RuntimeError("Scaffold output missing required app directory (expected app/)")

            self.logger.info(f"Project scaffolded successfully at {project_path}")
            return project_path

        except Exception as e:
            raise RuntimeError(f"Failed to scaffold project: {e}")

    @staticmethod
    def _resolve_template_source(template_path: Path, template_name: str) -> Path:
        """Return the concrete directory that contains the scaffold files."""
        if template_name != "saas-starter":
            nested = template_path / "templates" / template_name
            if nested.exists() and nested.is_dir():
                return nested
            return template_path

        candidates = (
            template_path,
            template_path / "templates" / template_name,
            template_path / "packages" / "cli" / "create-varity-app" / "template",
            template_path / "saas-starter",
        )
        for candidate in candidates:
            if candidate.exists() and candidate.is_dir() and TemplateManager._is_valid_saas_template_dir(candidate):
                return candidate

        return template_path

    @staticmethod
    def _scaffold_has_app_dir(path: Path) -> bool:
        return (path / "app").is_dir()

    @classmethod
    def _scaffold_has_required_paths(cls, template_name: str, path: Path) -> bool:
        if template_name == "saas-starter":
            files_ok = all((path / file_name).exists() for file_name in SAAS_STARTER_REQUIRED_FILES)
            dirs_ok = all((path / dir_name).is_dir() for dir_name in SAAS_STARTER_REQUIRED_DIRS)
            return files_ok and dirs_ok
        return cls._scaffold_has_app_dir(path) or (path / "src" / "app").is_dir()

    @classmethod
    def _is_valid_saas_template_dir(cls, path: Path) -> bool:
        files_ok = all((path / file_name).exists() for file_name in SAAS_STARTER_REQUIRED_FILES)
        dirs_ok = all((path / dir_name).is_dir() for dir_name in SAAS_STARTER_REQUIRED_DIRS)
        return files_ok and dirs_ok

    def _copy_template(self, source: Path, destination: Path, context: Dict[str, Any]):
        """
        Copy template files and render with context
        This is a simplified implementation - will be replaced with Copier integration
        """
        destination.mkdir(parents=True, exist_ok=True)

        _SKIP = {".git", "node_modules", ".next", "out", ".turbo", "__pycache__"}

        # Copy all files except build artifacts and dependency directories
        for item in source.iterdir():
            if item.name in _SKIP:
                continue

            dest_item = destination / item.name

            if item.is_dir():
                shutil.copytree(item, dest_item, dirs_exist_ok=True)
            else:
                shutil.copy2(item, dest_item)

        # TODO: Render template files with Jinja2
        # For now, just do basic string replacement in package.json and similar files
        self._apply_template_context(destination, context)

    @staticmethod
    def _to_display_name(slug: str) -> str:
        """Convert a hyphenated slug to a display-friendly title.

        e.g. "my-saas-app" -> "My SaaS App", "custom-crm" -> "Custom CRM"
        """
        acronyms = {
            "crm", "api", "saas", "ui", "ux", "db", "id", "hr",
            "b2b", "b2c", "ai", "ml", "sdk", "url", "seo", "kpi", "cms", "erp",
        }
        parts = []
        for word in slug.split("-"):
            lower = word.lower()
            if lower in acronyms:
                parts.append(word.upper())
            else:
                parts.append(word.capitalize())
        return " ".join(parts)

    def _apply_template_context(self, project_path: Path, context: Dict[str, Any]):
        """Apply template context to files"""
        # Files to process with {{key}} placeholder substitution
        files_to_process = ["package.json", "pyproject.toml", "README.md", ".varitykit.toml"]

        for filename in files_to_process:
            file_path = project_path / filename
            if not file_path.exists():
                continue

            try:
                with open(file_path, "r") as f:
                    content = f.read()

                # Simple string replacement
                for key, value in context.items():
                    placeholder = f"{{{{{key}}}}}"
                    content = content.replace(placeholder, str(value))

                with open(file_path, "w") as f:
                    f.write(content)

            except Exception as e:
                self.logger.warning(f"Failed to process {filename}: {e}")

        # Replace workspace:^ specifiers with real published npm versions so that
        # npm install works outside the monorepo (workspace: is pnpm-only).
        pkg_path = project_path / "package.json"
        if pkg_path.exists():
            try:
                with open(pkg_path) as f:
                    pkg = json.load(f)
                changed = False
                for dep_key in ("dependencies", "devDependencies"):
                    deps = pkg.get(dep_key, {})
                    for name, version in list(deps.items()):
                        if isinstance(version, str) and version.startswith("workspace:"):
                            deps[name] = VARITY_PACKAGE_VERSIONS.get(name, "latest")
                            changed = True
                if changed:
                    with open(pkg_path, "w") as f:
                        json.dump(pkg, f, indent=2)
                        f.write("\n")
            except Exception as e:
                self.logger.warning(f"Failed to rewrite workspace:^ in package.json: {e}")

        # Replace the placeholder app name in constants.ts so the page title,
        # sidebar, and any other APP_NAME consumers show the user's project name.
        project_name = context.get("project_name", "")
        if project_name:
            display_name = self._to_display_name(project_name)
            constants_path = project_path / "src" / "lib" / "constants.ts"
            if constants_path.exists():
                try:
                    content = constants_path.read_text()
                    content = content.replace("'TaskFlow'", f"'{display_name}'")
                    constants_path.write_text(content)
                except Exception as e:
                    self.logger.warning(f"Failed to patch constants.ts: {e}")

    def _write_saas_starter_fallback(self, destination: Path, context: Dict[str, Any]) -> None:
        """Create a small, buildable SaaS starter when no template files are bundled."""
        destination.mkdir(parents=True, exist_ok=True)
        project_name = str(context.get("project_name") or "my-varity-app")
        display_name = self._to_display_name(project_name)

        files = {
            "package.json": {
                "name": project_name,
                "version": "0.1.0",
                "private": True,
                "scripts": {
                    "dev": "next dev",
                    "build": "next build",
                    "start": "next start",
                    "lint": "next lint",
                },
                "dependencies": {
                    "@varity-labs/sdk": VARITY_PACKAGE_VERSIONS["@varity-labs/sdk"],
                    "@varity-labs/types": VARITY_PACKAGE_VERSIONS["@varity-labs/types"],
                    "@varity-labs/ui-kit": VARITY_PACKAGE_VERSIONS["@varity-labs/ui-kit"],
                    "next": "^14.2.0",
                    "react": "^18.2.0",
                    "react-dom": "^18.2.0",
                },
                "devDependencies": {
                    "@types/node": "^20.0.0",
                    "@types/react": "^18.2.0",
                    "@types/react-dom": "^18.2.0",
                    "typescript": "^5.4.0",
                },
            },
            "varity.config.json": {
                "name": project_name,
                "framework": "nextjs",
                "hosting": "auto",
            },
        }

        for relative, data in files.items():
            (destination / relative).write_text(json.dumps(data, indent=2) + "\n")

        text_files = {
            "next.config.js": "/** @type {import('next').NextConfig} */\n"
            "const nextConfig = { output: 'standalone' };\n"
            "module.exports = nextConfig;\n",
            "tsconfig.json": json.dumps(
                {
                    "compilerOptions": {
                        "target": "es5",
                        "lib": ["dom", "dom.iterable", "esnext"],
                        "allowJs": True,
                        "skipLibCheck": True,
                        "strict": True,
                        "noEmit": True,
                        "esModuleInterop": True,
                        "module": "esnext",
                        "moduleResolution": "bundler",
                        "resolveJsonModule": True,
                        "isolatedModules": True,
                        "jsx": "preserve",
                        "incremental": True,
                        "paths": {"@/*": ["./src/*"]},
                    },
                    "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
                    "exclude": ["node_modules"],
                },
                indent=2,
            )
            + "\n",
            "next-env.d.ts": "/// <reference types=\"next\" />\n"
            "/// <reference types=\"next/image-types/global\" />\n",
            "app/layout.tsx": "import './globals.css';\n\n"
            "export default function RootLayout({ children }: { children: React.ReactNode }) {\n"
            "  return (\n"
            "    <html lang=\"en\">\n"
            "      <body>{children}</body>\n"
            "    </html>\n"
            "  );\n"
            "}\n",
            "app/page.tsx": "import { APP_NAME } from '@/lib/constants';\n\n"
            "export default function Page() {\n"
            "  return (\n"
            "    <main className=\"main\">\n"
            "      <section>\n"
            "        <p className=\"eyebrow\">Varity SaaS Starter</p>\n"
            "        <h1>{APP_NAME}</h1>\n"
            "        <p>Deploy-ready Next.js app with Varity defaults.</p>\n"
            "      </section>\n"
            "    </main>\n"
            "  );\n"
            "}\n",
            "app/globals.css": "html, body { margin: 0; font-family: Arial, sans-serif; }\n"
            ".main { min-height: 100vh; display: grid; place-items: center; padding: 48px; }\n"
            "section { max-width: 720px; }\n"
            ".eyebrow { color: #2563eb; font-weight: 700; }\n"
            "h1 { font-size: 48px; margin: 0 0 16px; }\n",
            "src/lib/constants.ts": f"export const APP_NAME = '{display_name}';\n",
            "src/lib/varity.ts": "export const varityConfig = { hosting: 'auto' };\n",
            "public/robots.txt": "User-agent: *\nAllow: /\n",
        }

        for relative, content in text_files.items():
            path = destination / relative
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(content)

    def create_custom_template(
        self, template_name: str, source_path: Path, description: str, industry: str
    ) -> TemplateInfo:
        """
        Create a custom template from an existing project

        Args:
            template_name: Name for the template
            source_path: Path to source project
            description: Template description
            industry: Industry category

        Returns:
            Created template info
        """
        target_path = self.templates_dir / template_name

        if target_path.exists():
            raise ValueError(f"Template '{template_name}' already exists")

        # Copy source to templates directory
        shutil.copytree(source_path, target_path)

        # Create template.json
        template_info = TemplateInfo(
            name=template_name,
            description=description,
            industry=industry,
            version="1.0.0",
            local_path=target_path,
        )

        template_json = target_path / "template.json"
        with open(template_json, "w") as f:
            json.dump(
                {
                    "name": template_info.name,
                    "description": template_info.description,
                    "industry": template_info.industry,
                    "version": template_info.version,
                    "features": template_info.features,
                    "requirements": template_info.requirements,
                },
                f,
                indent=2,
            )

        self.logger.info(f"Custom template '{template_name}' created at {target_path}")
        return template_info
