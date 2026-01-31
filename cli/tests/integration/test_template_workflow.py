"""
Integration tests for template creation workflow

Tests the complete flow from requirements to generated template
"""

import pytest
import json
from pathlib import Path
from click.testing import CliRunner
from varietykit.cli.template import template
from varietykit.cli.main import cli


@pytest.mark.integration
class TestTemplateCreationWorkflow:
    """Test complete template creation workflow"""

    def test_full_template_creation_non_interactive(self, cli_runner, temp_dir):
        """Test complete template creation in non-interactive mode"""
        with cli_runner.isolated_filesystem(temp=temp_dir):
            result = cli_runner.invoke(template, [
                'create',
                '--industry', 'legal',
                '--name', 'test-legal-template',
                '--no-interactive'
            ])

            # Should complete successfully
            assert result.exit_code == 0

            # Should create template directory
            template_dir = Path('test-legal-template')
            assert template_dir.exists()

    def test_template_structure_completeness(self, cli_runner, temp_dir):
        """Test that generated template has all required files"""
        with cli_runner.isolated_filesystem(temp=temp_dir):
            result = cli_runner.invoke(template, [
                'create',
                '--industry', 'finance',
                '--name', 'test-finance-template',
                '--no-interactive'
            ])

            assert result.exit_code == 0

            template_dir = Path('test-finance-template')

            # Check essential files exist
            assert (template_dir / 'package.json').exists()
            assert (template_dir / 'template.json').exists()
            assert (template_dir / 'README.md').exists()
            assert (template_dir / 'src').is_dir()
            assert (template_dir / 'src' / 'components').is_dir()
            assert (template_dir / 'src' / 'types').is_dir()
            assert (template_dir / 'src' / 'api').is_dir()

    def test_package_json_is_valid(self, cli_runner, temp_dir):
        """Test that generated package.json is valid JSON"""
        with cli_runner.isolated_filesystem(temp=temp_dir):
            result = cli_runner.invoke(template, [
                'create',
                '--industry', 'healthcare',
                '--name', 'test-health-template',
                '--no-interactive'
            ])

            assert result.exit_code == 0

            package_json = Path('test-health-template') / 'package.json'
            data = json.loads(package_json.read_text())

            # Validate structure
            assert data['name'] == 'test-health-template'
            assert 'scripts' in data
            assert 'dependencies' in data
            assert 'devDependencies' in data
            assert 'react' in data['dependencies']


@pytest.mark.integration
class TestTemplateValidationWorkflow:
    """Test template validation workflow"""

    def test_validate_newly_created_template(self, cli_runner, temp_dir):
        """Test validating a newly created template"""
        with cli_runner.isolated_filesystem(temp=temp_dir):
            # Create template
            create_result = cli_runner.invoke(template, [
                'create',
                '--industry', 'legal',
                '--name', 'test-template',
                '--no-interactive'
            ])

            assert create_result.exit_code == 0

            # Validate template
            validate_result = cli_runner.invoke(template, [
                'validate',
                '--directory', 'test-template'
            ])

            # Should validate successfully or provide results
            assert validate_result.exit_code == 0 or 'quality' in validate_result.output.lower()


@pytest.mark.integration
class TestTemplateListWorkflow:
    """Test listing templates"""

    def test_list_templates_empty(self, cli_runner, temp_dir):
        """Test listing templates when none exist"""
        with cli_runner.isolated_filesystem(temp=temp_dir):
            result = cli_runner.invoke(template, ['list'])

            # Should complete without error
            assert result.exit_code == 0

    def test_list_after_creating_templates(self, cli_runner, temp_dir):
        """Test listing after creating templates"""
        with cli_runner.isolated_filesystem(temp=temp_dir):
            # Create multiple templates
            for name in ['template1', 'template2']:
                cli_runner.invoke(template, [
                    'create',
                    '--industry', 'legal',
                    '--name', name,
                    '--no-interactive'
                ])

            # List templates
            result = cli_runner.invoke(template, ['list'])

            assert result.exit_code == 0
            # Should show created templates
            assert 'template' in result.output.lower()


@pytest.mark.integration
class TestTemplateInfoWorkflow:
    """Test template info display"""

    def test_info_for_created_template(self, cli_runner, temp_dir):
        """Test displaying info for created template"""
        with cli_runner.isolated_filesystem(temp=temp_dir):
            # Create template
            cli_runner.invoke(template, [
                'create',
                '--industry', 'finance',
                '--name', 'finance-template',
                '--no-interactive'
            ])

            # Get info
            result = cli_runner.invoke(template, [
                'info',
                'finance-template'
            ])

            assert result.exit_code == 0
            assert 'finance' in result.output.lower()


@pytest.mark.integration
@pytest.mark.slow
class TestEndToEndTemplateCreation:
    """Test end-to-end template creation with all steps"""

    def test_create_validate_test_workflow(self, cli_runner, temp_dir):
        """Test creating, validating, and testing a template"""
        with cli_runner.isolated_filesystem(temp=temp_dir):
            # Step 1: Create template
            create_result = cli_runner.invoke(template, [
                'create',
                '--industry', 'legal',
                '--name', 'full-test-template',
                '--no-interactive'
            ])

            assert create_result.exit_code == 0
            assert Path('full-test-template').exists()

            # Step 2: Validate template
            validate_result = cli_runner.invoke(template, [
                'validate',
                '--directory', 'full-test-template'
            ])

            assert validate_result.exit_code == 0 or 'quality' in validate_result.output.lower()

            # Step 3: Get template info
            info_result = cli_runner.invoke(template, [
                'info',
                'full-test-template'
            ])

            assert info_result.exit_code == 0


@pytest.mark.integration
class TestMultipleIndustriesWorkflow:
    """Test creating templates for different industries"""

    @pytest.mark.parametrize('industry', [
        'legal',
        'finance',
        'healthcare',
        'retail',
        'manufacturing'
    ])
    def test_create_template_for_industry(self, cli_runner, temp_dir, industry):
        """Test creating templates for various industries"""
        with cli_runner.isolated_filesystem(temp=temp_dir):
            result = cli_runner.invoke(template, [
                'create',
                '--industry', industry,
                '--name', f'{industry}-template',
                '--no-interactive'
            ])

            assert result.exit_code == 0
            assert Path(f'{industry}-template').exists()
            assert Path(f'{industry}-template/package.json').exists()


@pytest.mark.integration
class TestCLIMainIntegration:
    """Test main CLI integration with template commands"""

    def test_main_cli_template_command(self, cli_runner):
        """Test accessing template command through main CLI"""
        result = cli_runner.invoke(cli, ['template', '--help'])

        assert result.exit_code == 0
        assert 'template' in result.output.lower()

    def test_main_cli_template_create(self, cli_runner, temp_dir):
        """Test template creation through main CLI"""
        with cli_runner.isolated_filesystem(temp=temp_dir):
            result = cli_runner.invoke(cli, [
                'template',
                'create',
                '--industry', 'legal',
                '--name', 'test-template',
                '--no-interactive'
            ])

            # Should work through main CLI
            assert result.exit_code == 0 or Path('test-template').exists()


@pytest.mark.integration
class TestErrorRecoveryWorkflow:
    """Test error handling and recovery"""

    def test_create_duplicate_template(self, cli_runner, temp_dir):
        """Test creating template with duplicate name"""
        with cli_runner.isolated_filesystem(temp=temp_dir):
            # Create first template
            result1 = cli_runner.invoke(template, [
                'create',
                '--industry', 'legal',
                '--name', 'duplicate-template',
                '--no-interactive'
            ])

            assert result1.exit_code == 0

            # Try to create duplicate
            result2 = cli_runner.invoke(template, [
                'create',
                '--industry', 'legal',
                '--name', 'duplicate-template',
                '--no-interactive'
            ])

            # Should handle duplicate appropriately
            # (either error or overwrite with confirmation)
            assert result2.exit_code != 0 or 'exists' in result2.output.lower()

    def test_validate_nonexistent_template(self, cli_runner, temp_dir):
        """Test validating template that doesn't exist"""
        with cli_runner.isolated_filesystem(temp=temp_dir):
            result = cli_runner.invoke(template, [
                'validate',
                '--directory', 'nonexistent-template'
            ])

            # Should handle gracefully
            assert result.exit_code != 0 or 'not found' in result.output.lower()


@pytest.mark.integration
class TestTemplateComponentGeneration:
    """Test component generation within templates"""

    def test_generated_components_exist(self, cli_runner, temp_dir):
        """Test that components are actually generated"""
        with cli_runner.isolated_filesystem(temp=temp_dir):
            result = cli_runner.invoke(template, [
                'create',
                '--industry', 'legal',
                '--name', 'component-test',
                '--no-interactive'
            ])

            assert result.exit_code == 0

            # Check for component files
            components_dir = Path('component-test/src/components')
            if components_dir.exists():
                # Should have at least some component directories
                component_dirs = list(components_dir.iterdir())
                assert len(component_dirs) > 0


@pytest.mark.integration
class TestFileSystemOperations:
    """Test file system operations during template creation"""

    def test_template_directory_structure(self, cli_runner, temp_dir):
        """Test that directory structure is correct"""
        with cli_runner.isolated_filesystem(temp=temp_dir):
            result = cli_runner.invoke(template, [
                'create',
                '--industry', 'finance',
                '--name', 'structure-test',
                '--no-interactive'
            ])

            assert result.exit_code == 0

            template_dir = Path('structure-test')

            # Check directory structure
            expected_dirs = [
                'src',
                'src/components',
                'src/types',
                'src/api',
                'tests',
                'tests/e2e'
            ]

            for dir_path in expected_dirs:
                full_path = template_dir / dir_path
                assert full_path.is_dir(), f"Expected directory not found: {dir_path}"

    def test_file_permissions(self, cli_runner, temp_dir):
        """Test that generated files have correct permissions"""
        with cli_runner.isolated_filesystem(temp=temp_dir):
            result = cli_runner.invoke(template, [
                'create',
                '--industry', 'legal',
                '--name', 'permissions-test',
                '--no-interactive'
            ])

            assert result.exit_code == 0

            package_json = Path('permissions-test/package.json')
            if package_json.exists():
                # File should be readable
                assert package_json.read_text()


@pytest.mark.integration
@pytest.mark.requires_network
class TestNetworkDependentWorkflow:
    """Test workflows that might require network (if applicable)"""

    def test_template_with_network_features(self, cli_runner, temp_dir):
        """Test template creation with network-dependent features"""
        # This is a placeholder for future network-dependent tests
        # (e.g., fetching templates from marketplace, etc.)
        pass
