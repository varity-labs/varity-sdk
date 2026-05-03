"""
Tests for ProjectDetector.

Tests project detection logic with various framework types.
"""

import json
import tempfile
from pathlib import Path

import pytest
from varitykit.core.project_detector import ProjectDetectionError, ProjectDetector


class TestProjectDetector:
    """Test suite for ProjectDetector class."""

    def setup_method(self):
        """Set up test fixtures."""
        self.detector = ProjectDetector()

    def test_detect_nextjs_static_export(self):
        """Test detection of Next.js project with static export."""
        with tempfile.TemporaryDirectory() as tmpdir:
            project_path = Path(tmpdir)

            # Create package.json
            package_json = {"dependencies": {"next": "14.0.0", "react": "18.2.0"}}
            (project_path / "package.json").write_text(json.dumps(package_json))

            # Create next.config.js with static export
            next_config = 'module.exports = { output: "export" }'
            (project_path / "next.config.js").write_text(next_config)

            # Create pnpm-lock.yaml to test package manager detection
            (project_path / "pnpm-lock.yaml").touch()

            # Detect project
            project_info = self.detector.detect(str(project_path))

            assert project_info.project_type == "nextjs"
            assert project_info.framework_version == "14.0.0"
            assert project_info.build_command == "pnpm run build"
            assert project_info.output_dir == "out"
            assert project_info.package_manager == "pnpm"
            assert project_info.has_backend is False

    def test_detect_nextjs_with_api_routes(self):
        """Test detection of Next.js project without static export (has API routes)."""
        with tempfile.TemporaryDirectory() as tmpdir:
            project_path = Path(tmpdir)

            # Create package.json
            package_json = {"dependencies": {"next": "13.5.0", "react": "18.2.0"}}
            (project_path / "package.json").write_text(json.dumps(package_json))

            # Detect project
            project_info = self.detector.detect(str(project_path))

            assert project_info.project_type == "nextjs"
            assert project_info.build_command == "npm run build"
            assert project_info.output_dir == ".next"
            assert project_info.package_manager == "npm"
            assert project_info.has_backend is True  # Next.js API routes count as backend

    def test_detect_react_cra(self):
        """Test detection of Create React App project."""
        with tempfile.TemporaryDirectory() as tmpdir:
            project_path = Path(tmpdir)

            # Create package.json
            package_json = {
                "dependencies": {"react": "18.2.0", "react-dom": "18.2.0", "react-scripts": "5.0.1"}
            }
            (project_path / "package.json").write_text(json.dumps(package_json))

            # Create yarn.lock to test package manager detection
            (project_path / "yarn.lock").touch()

            # Detect project
            project_info = self.detector.detect(str(project_path))

            assert project_info.project_type == "react"
            assert project_info.build_command == "yarn run build"
            assert project_info.output_dir == "build"
            assert project_info.package_manager == "yarn"
            assert project_info.has_backend is False

    def test_detect_react_vite(self):
        """Test detection of React + Vite project."""
        with tempfile.TemporaryDirectory() as tmpdir:
            project_path = Path(tmpdir)

            # Create package.json
            package_json = {
                "dependencies": {"react": "18.2.0", "react-dom": "18.2.0"},
                "devDependencies": {"vite": "4.0.0"},
            }
            (project_path / "package.json").write_text(json.dumps(package_json))

            # Detect project
            project_info = self.detector.detect(str(project_path))

            assert project_info.project_type == "react"
            assert project_info.build_command == "npm run build"
            assert project_info.output_dir == "dist"
            assert project_info.package_manager == "npm"

    def test_detect_vite_react_plugin_only(self):
        """Vite + @vitejs/plugin-react without react in deps → detected as react (VAR-280)."""
        with tempfile.TemporaryDirectory() as tmpdir:
            project_path = Path(tmpdir)
            package_json = {
                "devDependencies": {
                    "vite": "^5.0.0",
                    "@vitejs/plugin-react": "^4.0.0",
                    "typescript": "^5.0.0",
                }
            }
            (project_path / "package.json").write_text(json.dumps(package_json))
            project_info = self.detector.detect(str(project_path))
            assert project_info.project_type == "react"
            assert project_info.output_dir == "dist"
            assert project_info.package_manager == "npm"

    def test_detect_vite_react_swc_plugin(self):
        """Vite + @vitejs/plugin-react-swc → detected as react (VAR-280)."""
        with tempfile.TemporaryDirectory() as tmpdir:
            project_path = Path(tmpdir)
            package_json = {
                "devDependencies": {
                    "vite": "^5.0.0",
                    "@vitejs/plugin-react-swc": "^3.0.0",
                }
            }
            (project_path / "package.json").write_text(json.dumps(package_json))
            project_info = self.detector.detect(str(project_path))
            assert project_info.project_type == "react"
            assert project_info.output_dir == "dist"

    def test_detect_vite_vue_plugin_only(self):
        """Vite + @vitejs/plugin-vue without vue in deps → detected as vue (VAR-280)."""
        with tempfile.TemporaryDirectory() as tmpdir:
            project_path = Path(tmpdir)
            package_json = {
                "devDependencies": {
                    "vite": "^5.0.0",
                    "@vitejs/plugin-vue": "^4.0.0",
                }
            }
            (project_path / "package.json").write_text(json.dumps(package_json))
            project_info = self.detector.detect(str(project_path))
            assert project_info.project_type == "vue"
            assert project_info.output_dir == "dist"

    def test_detect_vite_no_plugin_fallback(self):
        """Bare vite (no framework plugin) → generic static SPA, project_type=react, output=dist."""
        with tempfile.TemporaryDirectory() as tmpdir:
            project_path = Path(tmpdir)
            package_json = {"devDependencies": {"vite": "^5.0.0"}}
            (project_path / "package.json").write_text(json.dumps(package_json))
            project_info = self.detector.detect(str(project_path))
            assert project_info.project_type == "react"
            assert project_info.output_dir == "dist"

    def test_detect_workspace_nextjs_list_workspaces(self):
        """Monorepo root with turbo deps should detect Next.js from workspace package."""
        with tempfile.TemporaryDirectory() as tmpdir:
            project_path = Path(tmpdir)
            (project_path / "apps" / "web").mkdir(parents=True, exist_ok=True)

            root_pkg = {
                "name": "monorepo-app",
                "private": True,
                "workspaces": ["apps/*"],
                "scripts": {"build": "turbo run build"},
                "devDependencies": {
                    "turbo": "^2.0.0",
                    "typescript": "^5.0.0",
                    "prettier": "^3.0.0",
                },
            }
            (project_path / "package.json").write_text(json.dumps(root_pkg))

            web_pkg = {
                "name": "@acme/web",
                "dependencies": {"next": "15.0.0", "react": "18.2.0"},
            }
            (project_path / "apps" / "web" / "package.json").write_text(json.dumps(web_pkg))
            (project_path / "apps" / "web" / "next.config.js").write_text(
                'module.exports = { output: "export" }'
            )

            project_info = self.detector.detect(str(project_path))

            assert project_info.project_type == "nextjs"
            assert project_info.output_dir == "out"
            assert project_info.build_command == "npm run build"
            assert project_info.name == "monorepo-app"

    def test_detect_workspace_nextjs_object_workspaces(self):
        """Yarn/PNPM-style workspaces.packages object should be supported."""
        with tempfile.TemporaryDirectory() as tmpdir:
            project_path = Path(tmpdir)
            (project_path / "apps" / "web").mkdir(parents=True, exist_ok=True)
            (project_path / "pnpm-lock.yaml").touch()

            root_pkg = {
                "name": "workspace-object",
                "private": True,
                "workspaces": {"packages": ["apps/*"]},
                "scripts": {"build": "pnpm -r build"},
                "devDependencies": {"turbo": "^2.0.0", "typescript": "^5.0.0"},
            }
            (project_path / "package.json").write_text(json.dumps(root_pkg))

            web_pkg = {
                "name": "@acme/web",
                "dependencies": {"next": "14.2.0", "react": "18.2.0"},
            }
            (project_path / "apps" / "web" / "package.json").write_text(json.dumps(web_pkg))
            (project_path / "apps" / "web" / "next.config.mjs").write_text(
                "export default { output: 'export' }"
            )

            project_info = self.detector.detect(str(project_path))

            assert project_info.project_type == "nextjs"
            assert project_info.output_dir == "out"
            assert project_info.build_command == "pnpm run build"
            assert project_info.name == "workspace-object"

    def test_detect_vue(self):
        """Test detection of Vue.js project."""
        with tempfile.TemporaryDirectory() as tmpdir:
            project_path = Path(tmpdir)

            # Create package.json
            package_json = {"dependencies": {"vue": "3.3.0"}}
            (project_path / "package.json").write_text(json.dumps(package_json))

            # Detect project
            project_info = self.detector.detect(str(project_path))

            assert project_info.project_type == "vue"
            assert project_info.framework_version == "3.3.0"
            assert project_info.build_command == "npm run build"
            assert project_info.output_dir == "dist"

    def test_detect_nodejs_express(self):
        """Test detection of Express backend."""
        with tempfile.TemporaryDirectory() as tmpdir:
            project_path = Path(tmpdir)

            # Create package.json
            package_json = {"dependencies": {"express": "4.18.2"}}
            (project_path / "package.json").write_text(json.dumps(package_json))

            # Detect project
            project_info = self.detector.detect(str(project_path))

            assert project_info.project_type == "express"
            assert project_info.framework_version == "4.18.2"
            assert project_info.build_command == ""
            assert project_info.output_dir == "."
            assert project_info.has_backend is True

    def test_detect_python_project(self):
        """Test detection of Python project."""
        with tempfile.TemporaryDirectory() as tmpdir:
            project_path = Path(tmpdir)

            # Create requirements.txt
            (project_path / "requirements.txt").write_text("fastapi==0.100.0\nuvicorn==0.23.0")

            # Detect project
            project_info = self.detector.detect(str(project_path))

            assert project_info.project_type == "python"
            assert project_info.framework_version is None
            assert project_info.build_command == ""
            assert project_info.output_dir == "."
            assert project_info.has_backend is True
            assert project_info.package_manager == "pip"

    def test_detect_with_backend(self):
        """Test detection of project with separate backend."""
        with tempfile.TemporaryDirectory() as tmpdir:
            project_path = Path(tmpdir)

            # Create package.json for React
            package_json = {"dependencies": {"react": "18.2.0"}}
            (project_path / "package.json").write_text(json.dumps(package_json))

            # Create server/ directory
            (project_path / "server").mkdir()

            # Detect project
            project_info = self.detector.detect(str(project_path))

            assert project_info.project_type == "react"
            assert project_info.has_backend is True

    def test_detect_nonexistent_path(self):
        """Test detection fails for nonexistent path."""
        with pytest.raises(ProjectDetectionError) as exc_info:
            self.detector.detect("/nonexistent/path")

        assert "does not exist" in str(exc_info.value)

    def test_detect_nestjs(self):
        """Test detection of NestJS backend."""
        with tempfile.TemporaryDirectory() as tmpdir:
            project_path = Path(tmpdir)
            package_json = {"dependencies": {"@nestjs/core": "10.0.0", "@nestjs/platform-express": "10.0.0"}}
            (project_path / "package.json").write_text(json.dumps(package_json))
            project_info = self.detector.detect(str(project_path))
            assert project_info.project_type == "nestjs"
            assert project_info.framework_version == "10.0.0"
            assert project_info.has_backend is True

    def test_detect_hono(self):
        """Test detection of Hono backend."""
        with tempfile.TemporaryDirectory() as tmpdir:
            project_path = Path(tmpdir)
            package_json = {"dependencies": {"hono": "4.0.0"}}
            (project_path / "package.json").write_text(json.dumps(package_json))
            project_info = self.detector.detect(str(project_path))
            assert project_info.project_type == "hono"
            assert project_info.framework_version == "4.0.0"
            assert project_info.has_backend is True

    def test_detect_koa(self):
        """Test detection of Koa backend."""
        with tempfile.TemporaryDirectory() as tmpdir:
            project_path = Path(tmpdir)
            package_json = {"dependencies": {"koa": "2.15.0"}}
            (project_path / "package.json").write_text(json.dumps(package_json))
            project_info = self.detector.detect(str(project_path))
            assert project_info.project_type == "koa"
            assert project_info.framework_version == "2.15.0"
            assert project_info.has_backend is True

    def test_detect_unsupported_project(self):
        """Test detection fails for unsupported project type."""
        with tempfile.TemporaryDirectory() as tmpdir:
            project_path = Path(tmpdir)

            # Create package.json with unsupported framework
            package_json = {"dependencies": {"svelte": "3.0.0"}}
            (project_path / "package.json").write_text(json.dumps(package_json))

            with pytest.raises(ProjectDetectionError) as exc_info:
                self.detector.detect(str(project_path))

            assert "Unknown JavaScript framework" in str(exc_info.value)

    def test_detect_no_project_files(self):
        """Test detection fails when no recognized project files exist."""
        with tempfile.TemporaryDirectory() as tmpdir:
            with pytest.raises(ProjectDetectionError) as exc_info:
                self.detector.detect(tmpdir)

            assert "Could not detect project type" in str(exc_info.value)

    @pytest.mark.parametrize(
        "marker_file,language",
        [
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
        ],
    )
    def test_detect_unsupported_language(self, marker_file, language):
        """Test actionable error for unsupported languages."""
        with tempfile.TemporaryDirectory() as tmpdir:
            project_path = Path(tmpdir)
            (project_path / marker_file).touch()

            with pytest.raises(ProjectDetectionError) as exc_info:
                self.detector.detect(str(project_path))

            error_msg = str(exc_info.value)
            assert f"Found {marker_file}" in error_msg
            assert f"{language} deployments are not yet supported" in error_msg
            assert "Varity currently supports" in error_msg
            assert f"Request {language} support" in error_msg

    def test_detect_unsupported_csproj(self):
        """Test actionable error for C# projects (.csproj)."""
        with tempfile.TemporaryDirectory() as tmpdir:
            project_path = Path(tmpdir)
            (project_path / "MyApp.csproj").touch()

            with pytest.raises(ProjectDetectionError) as exc_info:
                self.detector.detect(str(project_path))

            error_msg = str(exc_info.value)
            assert "Found MyApp.csproj" in error_msg
            assert "C# deployments are not yet supported" in error_msg

    def test_detect_invalid_package_json(self):
        """Test detection fails for invalid package.json."""
        with tempfile.TemporaryDirectory() as tmpdir:
            project_path = Path(tmpdir)

            # Create invalid JSON
            (project_path / "package.json").write_text("{ invalid json")

            with pytest.raises(ProjectDetectionError) as exc_info:
                self.detector.detect(str(project_path))

            assert "Failed to read package.json" in str(exc_info.value)


class TestRealProject:
    """Test detection with the actual generic-template-dashboard."""

    def test_detect_generic_template_dashboard(self):
        """Test detection of the real generic-template-dashboard project."""
        detector = ProjectDetector()
        project_path = "/home/macoding/varity-workspace/varity-sdk/apps/generic-template-dashboard"

        # Skip if project doesn't exist
        if not Path(project_path).exists():
            pytest.skip("generic-template-dashboard not found")

        project_info = detector.detect(project_path)

        # Verify it's detected as Next.js
        assert project_info.project_type == "nextjs"
        assert project_info.package_manager in ["npm", "pnpm", "yarn"]
        assert "build" in project_info.build_command
        # Check it detected either static export or API routes
        assert project_info.output_dir in ["out", ".next"]


class TestStaticHtmlDetection:
    """Tests for plain HTML/JS static site detection (VAR-97)."""

    def setup_method(self):
        self.detector = ProjectDetector()

    def test_varity_config_framework_static_no_package_json(self):
        """varity.config.json framework:static with no package.json → static."""
        with tempfile.TemporaryDirectory() as tmpdir:
            project_path = Path(tmpdir)
            (project_path / "index.html").write_text("<h1>Hello</h1>")
            (project_path / "varity.config.json").write_text(
                '{"name": "static-test", "framework": "static", "hosting": "static"}'
            )

            info = self.detector.detect(str(project_path))

            assert info.project_type == "static"
            assert info.name == "static-test"
            assert info.build_command == ""
            assert info.output_dir == "."
            assert info.has_backend is False

    def test_index_html_no_package_json(self):
        """index.html present, no package.json → static."""
        with tempfile.TemporaryDirectory() as tmpdir:
            project_path = Path(tmpdir)
            (project_path / "index.html").write_text("<h1>Hello</h1>")
            (project_path / "style.css").write_text("body { margin: 0; }")

            info = self.detector.detect(str(project_path))

            assert info.project_type == "static"
            assert info.build_command == ""
            assert info.output_dir == "."
            assert info.has_backend is False

    def test_varity_config_static_hint_overrides_js_detection(self):
        """varity.config.json framework:static takes priority even when package.json is present."""
        with tempfile.TemporaryDirectory() as tmpdir:
            project_path = Path(tmpdir)
            # package.json would normally trigger JS detection
            package_json = {"dependencies": {"react": "18.0.0"}}
            (project_path / "package.json").write_text(json.dumps(package_json))
            (project_path / "varity.config.json").write_text(
                '{"framework": "static"}'
            )

            info = self.detector.detect(str(project_path))

            assert info.project_type == "static"
            assert info.build_command == ""

    def test_varity_config_non_static_framework_still_autodetects(self):
        """varity.config.json with framework other than static does not block auto-detection."""
        with tempfile.TemporaryDirectory() as tmpdir:
            project_path = Path(tmpdir)
            package_json = {"dependencies": {"next": "14.0.0"}}
            (project_path / "package.json").write_text(json.dumps(package_json))
            (project_path / "varity.config.json").write_text(
                '{"framework": "nextjs"}'
            )

            info = self.detector.detect(str(project_path))

            assert info.project_type == "nextjs"

    def test_no_index_html_no_package_json_still_raises(self):
        """Empty directory with no index.html and no package.json still raises detection error."""
        with tempfile.TemporaryDirectory() as tmpdir:
            project_path = Path(tmpdir)

            with pytest.raises(ProjectDetectionError) as exc_info:
                self.detector.detect(str(project_path))

            assert "Could not detect project type" in str(exc_info.value)
            assert "Static HTML/JS" in str(exc_info.value)


class TestPlainNodeJsDetection:
    """Tests for plain Node.js detection via scripts.start (VAR-361)."""

    def setup_method(self):
        self.detector = ProjectDetector()

    def test_plain_nodejs_http_module_scripts_start(self):
        """package.json with scripts.start but no framework dep → nodejs."""
        with tempfile.TemporaryDirectory() as tmpdir:
            project_path = Path(tmpdir)
            package_json = {
                "name": "my-server",
                "scripts": {"start": "node server.js"},
            }
            (project_path / "package.json").write_text(json.dumps(package_json))

            info = self.detector.detect(str(project_path))

            assert info.project_type == "nodejs"
            assert info.has_backend is True
            assert info.build_command == ""

    def test_plain_nodejs_with_no_deps_at_all(self):
        """package.json with scripts.start and empty dependencies → nodejs."""
        with tempfile.TemporaryDirectory() as tmpdir:
            project_path = Path(tmpdir)
            package_json = {
                "name": "bare-server",
                "scripts": {"start": "node index.js"},
                "dependencies": {},
            }
            (project_path / "package.json").write_text(json.dumps(package_json))

            info = self.detector.detect(str(project_path))

            assert info.project_type == "nodejs"
            assert info.has_backend is True

    def test_no_scripts_start_no_framework_raises(self):
        """package.json with unknown deps and no scripts.start → error."""
        with tempfile.TemporaryDirectory() as tmpdir:
            project_path = Path(tmpdir)
            package_json = {
                "name": "unknown-app",
                "dependencies": {"some-unknown-lib": "1.0.0"},
            }
            (project_path / "package.json").write_text(json.dumps(package_json))

            with pytest.raises(ProjectDetectionError) as exc_info:
                self.detector.detect(str(project_path))

            assert "Unknown JavaScript framework" in str(exc_info.value)
            assert "scripts.start" in str(exc_info.value)
