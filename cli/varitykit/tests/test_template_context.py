"""Tests for template context application — APP_NAME substitution and workspace:^ rewriting."""

import json
from pathlib import Path

from varitykit.core.templates import TemplateManager, VARITY_PACKAGE_VERSIONS


class TestToDisplayName:
    def test_simple_slug(self):
        assert TemplateManager._to_display_name("my-app") == "My App"

    def test_acronym_saas(self):
        assert TemplateManager._to_display_name("my-saas-app") == "My SAAS App"

    def test_acronym_crm(self):
        assert TemplateManager._to_display_name("custom-crm") == "Custom CRM"

    def test_acronym_ai(self):
        assert TemplateManager._to_display_name("cool-ai-tool") == "Cool AI Tool"

    def test_single_word(self):
        assert TemplateManager._to_display_name("dashboard") == "Dashboard"

    def test_multiple_acronyms(self):
        assert TemplateManager._to_display_name("ai-saas-api") == "AI SAAS API"


class TestApplyTemplateContext:
    def test_constants_taskflow_replaced(self, tmp_path: Path):
        """varitykit init must replace 'TaskFlow' in constants.ts with the project display name."""
        src_lib = tmp_path / "src" / "lib"
        src_lib.mkdir(parents=True)
        constants = src_lib / "constants.ts"
        constants.write_text("export const APP_NAME = 'TaskFlow';\n")

        tm = TemplateManager()
        tm._apply_template_context(tmp_path, {"project_name": "my-cool-app"})

        result = constants.read_text()
        assert "'TaskFlow'" not in result
        assert "'My Cool App'" in result

    def test_constants_saas_acronym(self, tmp_path: Path):
        """SaaS acronym should be uppercased in the display name."""
        src_lib = tmp_path / "src" / "lib"
        src_lib.mkdir(parents=True)
        constants = src_lib / "constants.ts"
        constants.write_text("export const APP_NAME = 'TaskFlow';\n")

        tm = TemplateManager()
        tm._apply_template_context(tmp_path, {"project_name": "my-saas-app"})

        result = constants.read_text()
        assert "'My SAAS App'" in result

    def test_no_constants_file_no_error(self, tmp_path: Path):
        """Missing constants.ts should not raise an error."""
        tm = TemplateManager()
        tm._apply_template_context(tmp_path, {"project_name": "my-app"})

    def test_no_project_name_no_error(self, tmp_path: Path):
        """Empty context should not crash."""
        src_lib = tmp_path / "src" / "lib"
        src_lib.mkdir(parents=True)
        (src_lib / "constants.ts").write_text("export const APP_NAME = 'TaskFlow';\n")

        tm = TemplateManager()
        tm._apply_template_context(tmp_path, {})

        result = (src_lib / "constants.ts").read_text()
        assert "'TaskFlow'" in result  # unchanged when no project_name


class TestWorkspaceVersionRewrite:
    """workspace:^ must be replaced with real published versions on scaffold (VAR-620)."""

    def _write_pkg(self, path: Path, deps: dict, dev_deps: dict | None = None) -> None:
        pkg = {"name": "test-app", "dependencies": deps}
        if dev_deps:
            pkg["devDependencies"] = dev_deps
        (path / "package.json").write_text(json.dumps(pkg, indent=2))

    def _read_pkg(self, path: Path) -> dict:
        return json.loads((path / "package.json").read_text())

    def test_workspace_sdk_replaced(self, tmp_path: Path):
        self._write_pkg(tmp_path, {"@varity-labs/sdk": "workspace:^"})
        TemplateManager()._apply_template_context(tmp_path, {})
        pkg = self._read_pkg(tmp_path)
        assert pkg["dependencies"]["@varity-labs/sdk"] == VARITY_PACKAGE_VERSIONS["@varity-labs/sdk"]
        assert not pkg["dependencies"]["@varity-labs/sdk"].startswith("workspace:")

    def test_workspace_types_replaced(self, tmp_path: Path):
        self._write_pkg(tmp_path, {"@varity-labs/types": "workspace:^"})
        TemplateManager()._apply_template_context(tmp_path, {})
        pkg = self._read_pkg(tmp_path)
        assert pkg["dependencies"]["@varity-labs/types"] == VARITY_PACKAGE_VERSIONS["@varity-labs/types"]

    def test_workspace_ui_kit_replaced(self, tmp_path: Path):
        self._write_pkg(tmp_path, {"@varity-labs/ui-kit": "workspace:^"})
        TemplateManager()._apply_template_context(tmp_path, {})
        pkg = self._read_pkg(tmp_path)
        assert pkg["dependencies"]["@varity-labs/ui-kit"] == VARITY_PACKAGE_VERSIONS["@varity-labs/ui-kit"]

    def test_all_three_replaced_together(self, tmp_path: Path):
        self._write_pkg(tmp_path, {
            "@varity-labs/sdk": "workspace:^",
            "@varity-labs/types": "workspace:^",
            "@varity-labs/ui-kit": "workspace:^",
            "next": "^15.0.0",
        })
        TemplateManager()._apply_template_context(tmp_path, {})
        pkg = self._read_pkg(tmp_path)
        deps = pkg["dependencies"]
        assert not any(v.startswith("workspace:") for v in deps.values())
        assert deps["next"] == "^15.0.0"  # non-workspace dep untouched

    def test_workspace_in_dev_deps_replaced(self, tmp_path: Path):
        self._write_pkg(tmp_path, {}, dev_deps={"@varity-labs/sdk": "workspace:^"})
        TemplateManager()._apply_template_context(tmp_path, {})
        pkg = self._read_pkg(tmp_path)
        assert not pkg["devDependencies"]["@varity-labs/sdk"].startswith("workspace:")

    def test_unknown_workspace_dep_falls_back_to_latest(self, tmp_path: Path):
        self._write_pkg(tmp_path, {"@varity-labs/unknown-pkg": "workspace:^"})
        TemplateManager()._apply_template_context(tmp_path, {})
        pkg = self._read_pkg(tmp_path)
        assert pkg["dependencies"]["@varity-labs/unknown-pkg"] == "latest"

    def test_no_package_json_no_error(self, tmp_path: Path):
        TemplateManager()._apply_template_context(tmp_path, {})  # should not raise

    def test_non_workspace_versions_untouched(self, tmp_path: Path):
        self._write_pkg(tmp_path, {"react": "^18.3.0", "next": "^15.0.0"})
        TemplateManager()._apply_template_context(tmp_path, {})
        pkg = self._read_pkg(tmp_path)
        assert pkg["dependencies"]["react"] == "^18.3.0"
        assert pkg["dependencies"]["next"] == "^15.0.0"

    def test_varity_package_versions_not_stale(self):
        """Guard against WORKSPACE_DEPS map falling behind published versions."""
        for pkg_name, version in VARITY_PACKAGE_VERSIONS.items():
            # Must be a proper semver with pre-release tag — e.g. "2.0.0-beta.14"
            assert "-" in version, f"{pkg_name} version '{version}' has no pre-release tag"
            assert version.startswith("2.0.0-beta."), f"{pkg_name} version '{version}' is unexpected format"


class TestScaffoldPathRules:
    def test_saas_starter_requires_root_app(self, tmp_path: Path):
        (tmp_path / "src" / "app").mkdir(parents=True)
        assert not TemplateManager._scaffold_has_required_paths("saas-starter", tmp_path)

        (tmp_path / "package.json").write_text("{}")
        (tmp_path / "varity.config.json").write_text("{}")
        (tmp_path / "tsconfig.json").write_text("{}")
        (tmp_path / "next.config.js").write_text("module.exports = {}")
        (tmp_path / "app").mkdir(parents=True)
        (tmp_path / "public").mkdir()
        assert TemplateManager._scaffold_has_required_paths("saas-starter", tmp_path)

    def test_non_saas_allows_src_app(self, tmp_path: Path):
        (tmp_path / "src" / "app").mkdir(parents=True)
        assert TemplateManager._scaffold_has_required_paths("custom-template", tmp_path)
