"""
Unit tests for TemplateGenerator

Tests AI-powered template generation functionality
"""

import pytest
from pathlib import Path
from unittest.mock import Mock, patch
from varietykit.core.template_generator import TemplateGenerator


@pytest.mark.unit
class TestTemplateGenerator:
    """Test suite for TemplateGenerator class"""

    def test_init(self):
        """Test TemplateGenerator initialization"""
        generator = TemplateGenerator()
        assert generator is not None
        assert generator.logger is not None
        assert generator.generation_start_time is None

    def test_init_with_console_and_logger(self):
        """Test TemplateGenerator with custom console and logger"""
        mock_console = Mock()
        mock_logger = Mock()

        generator = TemplateGenerator(console=mock_console, logger=mock_logger)
        assert generator.console == mock_console
        assert generator.logger == mock_logger


@pytest.mark.unit
class TestRequirementsAnalysis:
    """Test requirements analysis functionality"""

    def test_analyze_requirements_basic(self, sample_template_config):
        """Test basic requirements analysis"""
        generator = TemplateGenerator()
        analysis = generator.analyze_requirements(sample_template_config)

        assert 'industry' in analysis
        assert 'recommended_components' in analysis
        assert 'recommended_pages' in analysis
        assert 'tech_stack' in analysis
        assert analysis['industry'] == 'legal'

    def test_analyze_requirements_components_generated(self, sample_template_config):
        """Test that components are recommended based on industry"""
        generator = TemplateGenerator()
        analysis = generator.analyze_requirements(sample_template_config)

        components = analysis['recommended_components']
        assert len(components) > 0
        assert isinstance(components, list)
        # Legal industry should have case management
        assert any('Case' in comp for comp in components)

    def test_analyze_requirements_pages_generated(self, sample_template_config):
        """Test that pages are recommended based on company size"""
        generator = TemplateGenerator()
        analysis = generator.analyze_requirements(sample_template_config)

        pages = analysis['recommended_pages']
        assert len(pages) > 0
        assert isinstance(pages, list)
        # Should always have HomePage
        assert any('Home' in page for page in pages)

    def test_analyze_requirements_tech_stack(self, sample_template_config):
        """Test that tech stack is properly configured"""
        generator = TemplateGenerator()
        analysis = generator.analyze_requirements(sample_template_config)

        tech_stack = analysis['tech_stack']
        assert 'frontend' in tech_stack
        assert 'React' in tech_stack['frontend']
        assert 'styling' in tech_stack
        assert 'testing' in tech_stack

    def test_analyze_requirements_different_industries(self):
        """Test analysis adapts to different industries"""
        generator = TemplateGenerator()

        # Finance
        finance_config = {'industry': 'finance', 'features_description': 'transactions', 'company_size': 'large'}
        finance_analysis = generator.analyze_requirements(finance_config)
        finance_components = finance_analysis['recommended_components']

        # Healthcare
        health_config = {'industry': 'healthcare', 'features_description': 'patients', 'company_size': 'large'}
        health_analysis = generator.analyze_requirements(health_config)
        health_components = health_analysis['recommended_components']

        # Components should be different for different industries
        assert finance_components != health_components

    def test_analyze_requirements_sets_generation_time(self, sample_template_config):
        """Test that generation start time is set"""
        generator = TemplateGenerator()
        assert generator.generation_start_time is None

        generator.analyze_requirements(sample_template_config)
        assert generator.generation_start_time is not None
        assert isinstance(generator.generation_start_time, (int, float))


@pytest.mark.unit
class TestComponentStructureGeneration:
    """Test component structure generation"""

    def test_generate_component_structure_basic(self, sample_template_config):
        """Test basic component structure generation"""
        generator = TemplateGenerator()
        analysis = generator.analyze_requirements(sample_template_config)
        structure = generator.generate_component_structure(analysis)

        assert 'components' in structure
        assert 'pages' in structure
        assert 'types' in structure
        assert 'api' in structure

    def test_generate_component_structure_components(self, sample_template_config):
        """Test that components are properly structured"""
        generator = TemplateGenerator()
        analysis = generator.analyze_requirements(sample_template_config)
        structure = generator.generate_component_structure(analysis)

        components = structure['components']
        assert len(components) > 0

        # Check first component structure
        component = components[0]
        assert 'name' in component
        assert 'type' in component
        assert 'path' in component
        assert 'props' in component
        assert 'hooks' in component
        assert 'dependencies' in component

    def test_generate_component_structure_pages(self, sample_template_config):
        """Test that pages are properly structured"""
        generator = TemplateGenerator()
        analysis = generator.analyze_requirements(sample_template_config)
        structure = generator.generate_component_structure(analysis)

        pages = structure['pages']
        assert len(pages) > 0

        # Check first page structure
        page = pages[0]
        assert 'name' in page
        assert 'type' in page
        assert 'path' in page
        assert 'components_used' in page
        assert 'route' in page

    def test_generate_component_structure_api_endpoints(self, sample_template_config):
        """Test that API endpoints are generated"""
        generator = TemplateGenerator()
        analysis = generator.analyze_requirements(sample_template_config)
        structure = generator.generate_component_structure(analysis)

        api = structure['api']
        assert 'endpoints' in api
        assert 'hooks' in api
        assert isinstance(api['endpoints'], list)
        assert isinstance(api['hooks'], list)


@pytest.mark.unit
class TestComponentGeneration:
    """Test individual component generation"""

    def test_generate_component_creates_files(self, temp_dir):
        """Test that component generation creates correct files"""
        generator = TemplateGenerator()
        component = {
            'name': 'TestComponent',
            'type': 'component',
            'path': 'src/components/TestComponent',
            'props': {},
            'hooks': [],
            'has_styles': True
        }

        generator.generate_component(component, temp_dir)

        component_dir = temp_dir / 'src/components/TestComponent'
        assert component_dir.exists()
        assert (component_dir / 'TestComponent.tsx').exists()
        assert (component_dir / 'TestComponent.test.tsx').exists()
        assert (component_dir / 'TestComponent.module.css').exists()
        assert (component_dir / 'index.ts').exists()

    def test_generate_component_without_styles(self, temp_dir):
        """Test component generation without styles"""
        generator = TemplateGenerator()
        component = {
            'name': 'TestComponent',
            'type': 'component',
            'path': 'src/components/TestComponent',
            'props': {},
            'hooks': [],
            'has_styles': False
        }

        generator.generate_component(component, temp_dir)

        component_dir = temp_dir / 'src/components/TestComponent'
        assert (component_dir / 'TestComponent.tsx').exists()
        assert not (component_dir / 'TestComponent.module.css').exists()

    def test_generate_component_index_exports(self, temp_dir):
        """Test that index file exports component correctly"""
        generator = TemplateGenerator()
        component = {
            'name': 'TestComponent',
            'type': 'component',
            'path': 'src/components/TestComponent',
            'props': {},
            'hooks': []
        }

        generator.generate_component(component, temp_dir)

        index_file = temp_dir / 'src/components/TestComponent/index.ts'
        content = index_file.read_text()
        assert 'export { default }' in content
        assert 'TestComponent' in content


@pytest.mark.unit
class TestTypeGeneration:
    """Test TypeScript type generation"""

    def test_generate_types_creates_file(self, temp_dir, sample_template_structure):
        """Test that type generation creates types file"""
        generator = TemplateGenerator()
        generator.generate_types(sample_template_structure, temp_dir)

        types_file = temp_dir / 'src/types/index.ts'
        assert types_file.exists()

    def test_generate_types_content(self, temp_dir, sample_template_structure):
        """Test that generated types have correct content"""
        generator = TemplateGenerator()
        generator.generate_types(sample_template_structure, temp_dir)

        types_file = temp_dir / 'src/types/index.ts'
        content = types_file.read_text()
        # Should export TypeScript interfaces/types
        assert 'export' in content or 'interface' in content or 'type' in content


@pytest.mark.unit
class TestAPIIntegrationGeneration:
    """Test API integration code generation"""

    def test_generate_api_integration_creates_files(self, temp_dir, sample_template_structure):
        """Test that API integration creates client and hooks"""
        generator = TemplateGenerator()
        generator.generate_api_integration(sample_template_structure, temp_dir)

        api_dir = temp_dir / 'src/api'
        assert api_dir.exists()
        assert (api_dir / 'client.ts').exists()
        assert (api_dir / 'hooks.ts').exists()

    def test_generate_api_client_content(self, temp_dir, sample_template_structure):
        """Test that API client has correct content"""
        generator = TemplateGenerator()
        generator.generate_api_integration(sample_template_structure, temp_dir)

        client_file = temp_dir / 'src/api/client.ts'
        content = client_file.read_text()
        # Should have API client class or functions
        assert 'export' in content

    def test_generate_api_hooks_content(self, temp_dir, sample_template_structure):
        """Test that API hooks have correct content"""
        generator = TemplateGenerator()
        generator.generate_api_integration(sample_template_structure, temp_dir)

        hooks_file = temp_dir / 'src/api/hooks.ts'
        content = hooks_file.read_text()
        # Should have React hooks
        assert 'export' in content


@pytest.mark.unit
class TestTestGeneration:
    """Test test suite generation"""

    def test_generate_tests_creates_directory(self, temp_dir, sample_template_structure):
        """Test that test generation creates tests directory"""
        generator = TemplateGenerator()
        # Set start time first
        generator.generation_start_time = 0

        results = generator.generate_tests(sample_template_structure, temp_dir)

        tests_dir = temp_dir / 'tests'
        assert tests_dir.exists()

    def test_generate_tests_creates_e2e(self, temp_dir, sample_template_structure):
        """Test that E2E tests are generated"""
        generator = TemplateGenerator()
        generator.generation_start_time = 0

        results = generator.generate_tests(sample_template_structure, temp_dir)

        e2e_dir = temp_dir / 'tests/e2e'
        assert e2e_dir.exists()
        assert (e2e_dir / 'dashboard.spec.ts').exists()

    def test_generate_tests_returns_results(self, temp_dir, sample_template_structure):
        """Test that test generation returns results"""
        generator = TemplateGenerator()
        generator.generation_start_time = 0

        results = generator.generate_tests(sample_template_structure, temp_dir)

        assert 'coverage' in results
        assert 'quality_score' in results
        assert 'generation_time' in results
        assert results['coverage'] > 0
        assert results['quality_score'] > 0
        assert isinstance(results['generation_time'], (int, float))


@pytest.mark.unit
class TestConfigFileGeneration:
    """Test configuration file generation"""

    def test_generate_config_creates_package_json(self, temp_dir, sample_template_config):
        """Test that package.json is created"""
        generator = TemplateGenerator()
        generator.generate_config_files(sample_template_config, temp_dir)

        package_json = temp_dir / 'package.json'
        assert package_json.exists()

    def test_generate_config_creates_template_json(self, temp_dir, sample_template_config):
        """Test that template.json metadata is created"""
        generator = TemplateGenerator()
        generator.generate_config_files(sample_template_config, temp_dir)

        template_json = temp_dir / 'template.json'
        assert template_json.exists()

    def test_package_json_structure(self, temp_dir, sample_template_config):
        """Test that package.json has correct structure"""
        generator = TemplateGenerator()
        generator.generate_config_files(sample_template_config, temp_dir)

        import json
        package_json = temp_dir / 'package.json'
        data = json.loads(package_json.read_text())

        assert data['name'] == sample_template_config['name']
        assert 'scripts' in data
        assert 'dependencies' in data
        assert 'devDependencies' in data
        assert 'react' in data['dependencies']
        assert 'typescript' in data['devDependencies']

    def test_template_json_structure(self, temp_dir, sample_template_config):
        """Test that template.json has correct metadata"""
        generator = TemplateGenerator()
        generator.generate_config_files(sample_template_config, temp_dir)

        import json
        template_json = temp_dir / 'template.json'
        data = json.loads(template_json.read_text())

        assert data['name'] == sample_template_config['name']
        assert data['industry'] == sample_template_config['industry']
        assert 'version' in data
        assert 'created_at' in data
        assert 'varity' in data


@pytest.mark.unit
class TestIndustryRecommendations:
    """Test industry-specific recommendations"""

    @pytest.mark.parametrize('industry,expected_component', [
        ('legal', 'Case'),
        ('finance', 'Transaction'),
        ('healthcare', 'Patient'),
        ('retail', 'Inventory'),
    ])
    def test_industry_specific_components(self, industry, expected_component):
        """Test that different industries get appropriate components"""
        generator = TemplateGenerator()
        config = {
            'industry': industry,
            'features_description': 'standard features',
            'company_size': 'medium'
        }

        analysis = generator.analyze_requirements(config)
        components = analysis['recommended_components']

        # Check that industry-appropriate component is recommended
        assert any(expected_component in comp for comp in components), \
            f"Expected {expected_component} component for {industry} industry"


@pytest.mark.unit
class TestCompanySizeScaling:
    """Test scaling based on company size"""

    @pytest.mark.parametrize('company_size,min_pages', [
        ('small', 3),
        ('medium', 4),
        ('large', 5),
    ])
    def test_company_size_affects_pages(self, company_size, min_pages):
        """Test that company size affects number of pages"""
        generator = TemplateGenerator()
        config = {
            'industry': 'legal',
            'features_description': 'standard',
            'company_size': company_size
        }

        analysis = generator.analyze_requirements(config)
        pages = analysis['recommended_pages']

        assert len(pages) >= min_pages, \
            f"Expected at least {min_pages} pages for {company_size} company"


@pytest.mark.unit
class TestErrorHandling:
    """Test error handling in template generation"""

    def test_generate_component_creates_parent_directories(self, temp_dir):
        """Test that nested directories are created automatically"""
        generator = TemplateGenerator()
        component = {
            'name': 'DeepComponent',
            'type': 'component',
            'path': 'src/components/nested/very/deep/DeepComponent',
            'props': {},
            'hooks': []
        }

        generator.generate_component(component, temp_dir)

        component_file = temp_dir / 'src/components/nested/very/deep/DeepComponent/DeepComponent.tsx'
        assert component_file.exists()

    def test_analyze_requirements_with_missing_fields(self):
        """Test that analysis works with minimal config"""
        generator = TemplateGenerator()
        minimal_config = {'industry': 'legal'}

        analysis = generator.analyze_requirements(minimal_config)

        assert 'recommended_components' in analysis
        assert 'recommended_pages' in analysis
        assert 'tech_stack' in analysis


@pytest.mark.unit
class TestPerformance:
    """Test performance characteristics"""

    @pytest.mark.slow
    def test_generation_time_is_reasonable(self, temp_dir, sample_template_config):
        """Test that template generation completes in reasonable time"""
        import time
        generator = TemplateGenerator()

        start = time.time()
        analysis = generator.analyze_requirements(sample_template_config)
        structure = generator.generate_component_structure(analysis)

        # Generate a few components
        for component in structure['components'][:3]:
            generator.generate_component(component, temp_dir)

        elapsed = time.time() - start

        # Should complete in less than 5 seconds for basic generation
        assert elapsed < 5.0, f"Generation took {elapsed}s, expected < 5s"

    def test_analyze_requirements_is_fast(self, sample_template_config):
        """Test that analysis is fast"""
        import time
        generator = TemplateGenerator()

        start = time.time()
        analysis = generator.analyze_requirements(sample_template_config)
        elapsed = time.time() - start

        # Analysis should be near-instant
        assert elapsed < 1.0, f"Analysis took {elapsed}s, expected < 1s"


@pytest.mark.unit
class TestCodeQuality:
    """Test generated code quality"""

    def test_generated_component_is_valid_tsx(self, temp_dir):
        """Test that generated component has valid TSX syntax"""
        generator = TemplateGenerator()
        component = {
            'name': 'ValidComponent',
            'type': 'component',
            'path': 'src/components/ValidComponent',
            'props': {},
            'hooks': []
        }

        generator.generate_component(component, temp_dir)

        component_file = temp_dir / 'src/components/ValidComponent/ValidComponent.tsx'
        content = component_file.read_text()

        # Basic TSX validation
        assert 'import' in content or 'export' in content
        assert 'function' in content or 'const' in content
        assert 'export default' in content

    def test_generated_test_has_test_syntax(self, temp_dir):
        """Test that generated test file has valid test syntax"""
        generator = TemplateGenerator()
        component = {
            'name': 'TestedComponent',
            'type': 'component',
            'path': 'src/components/TestedComponent',
            'props': {},
            'hooks': []
        }

        generator.generate_component(component, temp_dir)

        test_file = temp_dir / 'src/components/TestedComponent/TestedComponent.test.tsx'
        content = test_file.read_text()

        # Basic test syntax validation
        assert 'test' in content or 'it' in content or 'describe' in content


# Integration-level unit tests
@pytest.mark.unit
class TestFullGenerationFlow:
    """Test complete generation flow"""

    def test_complete_template_generation_flow(self, temp_dir, sample_template_config):
        """Test full template generation from start to finish"""
        generator = TemplateGenerator()

        # Step 1: Analyze
        analysis = generator.analyze_requirements(sample_template_config)
        assert analysis is not None

        # Step 2: Generate structure
        structure = generator.generate_component_structure(analysis)
        assert structure is not None

        # Step 3: Generate components
        for component in structure['components'][:2]:  # Just first 2 for speed
            generator.generate_component(component, temp_dir)

        # Step 4: Generate types
        generator.generate_types(structure, temp_dir)

        # Step 5: Generate API
        generator.generate_api_integration(structure, temp_dir)

        # Step 6: Generate tests
        results = generator.generate_tests(structure, temp_dir)

        # Step 7: Generate config
        generator.generate_config_files(sample_template_config, temp_dir)

        # Verify all key files exist
        assert (temp_dir / 'package.json').exists()
        assert (temp_dir / 'template.json').exists()
        assert (temp_dir / 'src/types/index.ts').exists()
        assert (temp_dir / 'src/api/client.ts').exists()
        assert (temp_dir / 'tests/e2e/dashboard.spec.ts').exists()

        # Verify results
        assert results['coverage'] > 0
        assert results['quality_score'] > 0
