"""
Unit tests for template management
"""

import pytest
from pathlib import Path
import tempfile

from varietykit.core.templates import TemplateManager, TemplateInfo


class TestTemplateInfo:
    """Test TemplateInfo dataclass"""

    def test_template_info_creation(self):
        """Test creating TemplateInfo"""
        template = TemplateInfo(
            name="finance-dashboard",
            description="Finance template",
            industry="finance",
            version="1.0.0"
        )

        assert template.name == "finance-dashboard"
        assert template.industry == "finance"
        assert isinstance(template.features, list)
        assert isinstance(template.requirements, dict)


class TestTemplateManager:
    """Test TemplateManager"""

    def test_list_templates(self):
        """Test listing available templates"""
        manager = TemplateManager()
        templates = manager.list_templates()

        assert len(templates) > 0
        assert any(t.industry == "finance" for t in templates)
        assert any(t.industry == "healthcare" for t in templates)
        assert any(t.industry == "retail" for t in templates)

    def test_get_template(self):
        """Test getting template by name"""
        manager = TemplateManager()

        # Get official template
        template = manager.get_template("finance")
        assert template is not None
        assert template.industry == "finance"

        # Non-existent template
        template = manager.get_template("nonexistent")
        assert template is None

    def test_official_templates_structure(self):
        """Test that official templates have required fields"""
        manager = TemplateManager()

        for template_key, template in manager.OFFICIAL_TEMPLATES.items():
            assert template.name
            assert template.description
            assert template.industry
            assert template.version
            assert template.repository  # Official templates should have repo
            assert isinstance(template.features, list)
            assert isinstance(template.requirements, dict)

    def test_apply_template_context(self):
        """Test applying template context to files"""
        with tempfile.TemporaryDirectory() as tmpdir:
            project_path = Path(tmpdir)

            # Create test package.json
            package_json = project_path / "package.json"
            package_json.write_text('{"name": "{{project_name}}"}')

            # Apply context
            manager = TemplateManager()
            context = {"project_name": "test-project"}
            manager._apply_template_context(project_path, context)

            # Check result
            content = package_json.read_text()
            assert "test-project" in content
            assert "{{project_name}}" not in content
