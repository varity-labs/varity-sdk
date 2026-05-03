from pathlib import Path

from varitykit.core.templates import TemplateInfo, TemplateManager


def test_is_valid_saas_template_dir_accepts_beta_required_shape(tmp_path: Path):
    (tmp_path / "package.json").write_text("{}")
    (tmp_path / "next.config.js").write_text("module.exports = {}")
    (tmp_path / "tsconfig.json").write_text("{}")
    (tmp_path / "varity.config.json").write_text("{}")
    (tmp_path / "app").mkdir()
    (tmp_path / "src").mkdir()
    (tmp_path / "public").mkdir()

    assert TemplateManager._is_valid_saas_template_dir(tmp_path) is True


def test_is_valid_saas_template_dir_rejects_missing_app_dirs(tmp_path: Path):
    (tmp_path / "package.json").write_text("{}")
    (tmp_path / "next.config.js").write_text("module.exports = {}")
    (tmp_path / "varity.config.json").write_text("{}")

    assert TemplateManager._is_valid_saas_template_dir(tmp_path) is False


def test_saas_starter_fallback_scaffolds_required_paths(tmp_path: Path):
    manager = TemplateManager(templates_dir=tmp_path / "cache")
    project_path = tmp_path / "app"

    manager.scaffold_project("saas-starter", project_path, "beta-test-app")

    for relative in (
        "package.json",
        "varity.config.json",
        "tsconfig.json",
        "next.config.js",
        "app/page.tsx",
        "app/layout.tsx",
        "app/globals.css",
        "src/lib/constants.ts",
        "src/lib/varity.ts",
        "public/robots.txt",
    ):
        assert (project_path / relative).exists()

    assert TemplateManager._scaffold_has_required_paths("saas-starter", project_path)


def test_packaged_saas_starter_source_is_valid():
    packaged = Path(__file__).parents[2] / "varitykit" / "templates" / "saas-starter"

    assert TemplateManager._is_valid_saas_template_dir(packaged)


def test_packaged_saas_starter_can_scaffold_when_monorepo_template_absent(
    tmp_path: Path, monkeypatch
):
    packaged = Path(__file__).parents[2] / "varitykit" / "templates" / "saas-starter"
    manager = TemplateManager(templates_dir=tmp_path / "cache")
    monkeypatch.setattr(
        TemplateManager,
        "OFFICIAL_TEMPLATES",
        {
            "saas-starter": TemplateInfo(
                name="saas-starter",
                description="Packaged SaaS starter",
                industry="saas-starter",
                version="1.0.0",
                local_path=packaged,
            )
        },
    )

    project_path = tmp_path / "packaged-app"
    manager.scaffold_project("saas-starter", project_path, "packaged-app")

    assert (project_path / "app" / "page.tsx").exists()
    assert "'Packaged App'" in (project_path / "src" / "lib" / "constants.ts").read_text()
    assert "output: 'export'" in (project_path / "next.config.js").read_text()
    assert TemplateManager._scaffold_has_required_paths("saas-starter", project_path)
