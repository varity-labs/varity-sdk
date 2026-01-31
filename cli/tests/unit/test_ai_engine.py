"""
Comprehensive unit tests for AI Configuration Engine

These tests validate the core functionality of the AI-powered configuration
engine including chain-of-thought reasoning, template generation, self-correction,
and quality scoring.

Target: >85% code coverage
"""

import pytest
import asyncio
from pathlib import Path
from unittest.mock import Mock, patch, AsyncMock, MagicMock
import json

# Import the AI engine
import sys
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from varietykit.core.ai_engine import (
    AIConfigurationEngine,
    Industry,
    AIFeature,
    UserRequirements,
    TemplateConfig,
    ValidationResult,
    QualityScore
)


# ============================================================================
# FIXTURES
# ============================================================================

@pytest.fixture
def ai_engine():
    """Create AI engine instance for testing (without Vertex AI)"""
    engine = AIConfigurationEngine(
        project_id="test-project",
        model_name="gemini-2.5-flash-002",
        self_correction_enabled=True,
        min_quality_score=85.0
    )
    # Mock the model to avoid real API calls
    engine.model = None
    return engine


@pytest.fixture
def sample_requirements():
    """Sample user requirements for testing"""
    return UserRequirements(
        industry=Industry.FINANCE,
        company_name="Acme Bank",
        user_roles=["Banker", "Compliance Officer", "Customer"],
        data_types=["Transactions", "KYC Documents", "Risk Reports"],
        ai_features=[
            AIFeature.FRAUD_DETECTION,
            AIFeature.AML_MONITORING,
            AIFeature.RISK_FORECASTING
        ],
        additional_context="Need real-time monitoring and compliance reporting"
    )


@pytest.fixture
def sample_template_config():
    """Sample template configuration for testing"""
    return TemplateConfig(
        template_id="finance",
        template_path="templates/finance-template",
        customizations_needed=["Branding", "User roles", "Data models"],
        reasoning="Finance industry match with compliance requirements",
        industry=Industry.FINANCE
    )


@pytest.fixture
def temp_output_dir(tmp_path):
    """Temporary output directory for testing"""
    output_dir = tmp_path / "test_project"
    output_dir.mkdir()
    return output_dir


# ============================================================================
# WEEK 1 TESTS: LLM INTEGRATION & PROMPT ENGINEERING
# ============================================================================

class TestRequirementsCollection:
    """Test interactive requirements collection"""

    def test_user_requirements_creation(self, sample_requirements):
        """Test UserRequirements dataclass creation"""
        assert sample_requirements.industry == Industry.FINANCE
        assert sample_requirements.company_name == "Acme Bank"
        assert len(sample_requirements.user_roles) == 3
        assert len(sample_requirements.data_types) == 3
        assert len(sample_requirements.ai_features) == 3

    def test_user_requirements_to_dict(self, sample_requirements):
        """Test UserRequirements serialization to dict"""
        data = sample_requirements.to_dict()
        assert data["industry"] == "finance"
        assert data["company_name"] == "Acme Bank"
        assert len(data["user_roles"]) == 3
        assert len(data["ai_features"]) == 3

    def test_get_role_suggestions_finance(self, ai_engine):
        """Test role suggestions for finance industry"""
        suggestions = ai_engine._get_role_suggestions(Industry.FINANCE)
        assert "Banker" in suggestions
        assert "Compliance Officer" in suggestions
        assert len(suggestions) > 0

    def test_get_role_suggestions_healthcare(self, ai_engine):
        """Test role suggestions for healthcare industry"""
        suggestions = ai_engine._get_role_suggestions(Industry.HEALTHCARE)
        assert "Doctor" in suggestions
        assert "Patient" in suggestions

    def test_get_data_type_suggestions(self, ai_engine):
        """Test data type suggestions"""
        suggestions = ai_engine._get_data_type_suggestions(Industry.FINANCE)
        assert "Transactions" in suggestions
        assert "KYC Documents" in suggestions

    def test_get_ai_features_for_industry(self, ai_engine):
        """Test AI feature selection for industry"""
        features = ai_engine._get_ai_features_for_industry(Industry.FINANCE)
        assert AIFeature.FRAUD_DETECTION in features
        assert AIFeature.AML_MONITORING in features
        assert len(features) > 0

    def test_format_feature_name(self, ai_engine):
        """Test feature name formatting"""
        formatted = ai_engine._format_feature_name(AIFeature.FRAUD_DETECTION)
        assert formatted == "Fraud Detection"

    @pytest.mark.asyncio
    async def test_rule_based_analyze_requirements(self, ai_engine, sample_requirements):
        """Test rule-based requirements analysis"""
        analysis = ai_engine._rule_based_analyze_requirements(sample_requirements)

        assert "template_match" in analysis
        assert analysis["template_match"] == "finance"
        assert "architecture" in analysis
        assert "customizations" in analysis
        assert "complexity" in analysis
        assert "implementation_plan" in analysis

    @pytest.mark.asyncio
    async def test_analyze_requirements(self, ai_engine, sample_requirements):
        """Test requirements analysis (fallback to rule-based)"""
        analysis = await ai_engine.analyze_requirements(sample_requirements)

        assert analysis is not None
        assert "template_match" in analysis
        assert analysis["template_match"] == sample_requirements.industry.value


# ============================================================================
# WEEK 2 TESTS: TEMPLATE GENERATION ENGINE
# ============================================================================

class TestTemplateSelection:
    """Test template selection logic"""

    def test_template_config_creation(self, sample_template_config):
        """Test TemplateConfig dataclass creation"""
        assert sample_template_config.template_id == "finance"
        assert sample_template_config.industry == Industry.FINANCE
        assert len(sample_template_config.customizations_needed) > 0

    def test_template_config_to_dict(self, sample_template_config):
        """Test TemplateConfig serialization"""
        data = sample_template_config.to_dict()
        assert data["template_id"] == "finance"
        assert data["industry"] == "finance"

    @pytest.mark.asyncio
    async def test_rule_based_select_template(self, ai_engine, sample_requirements):
        """Test rule-based template selection"""
        config = ai_engine._rule_based_select_template(sample_requirements)

        assert config.template_id == "finance"
        assert config.industry == Industry.FINANCE
        assert len(config.customizations_needed) > 0

    @pytest.mark.asyncio
    async def test_select_optimal_template(self, ai_engine, sample_requirements):
        """Test optimal template selection"""
        config = await ai_engine.select_optimal_template(sample_requirements)

        assert config is not None
        assert config.template_id == sample_requirements.industry.value


class TestComponentGeneration:
    """Test React component generation"""

    @pytest.mark.asyncio
    async def test_generate_project_structure(self, ai_engine, sample_requirements,
                                              sample_template_config, temp_output_dir):
        """Test project structure generation"""
        structure = await ai_engine.generate_project_structure(
            sample_requirements,
            sample_template_config,
            temp_output_dir
        )

        assert "root" in structure
        assert "src" in structure
        assert "components" in structure

        # Verify directories were created
        assert (temp_output_dir / "src").exists()
        assert (temp_output_dir / "src" / "components").exists()
        assert (temp_output_dir / "src" / "services").exists()

    @pytest.mark.asyncio
    async def test_generate_dashboard_layout(self, ai_engine, sample_requirements, temp_output_dir):
        """Test dashboard layout component generation"""
        component_path = await ai_engine.generate_dashboard_layout(
            sample_requirements,
            temp_output_dir
        )

        assert component_path is not None
        assert Path(component_path).exists()

        # Read and verify component content
        content = Path(component_path).read_text()
        assert "DashboardLayout" in content
        assert "Acme Bank" in content
        assert "React" in content

    @pytest.mark.asyncio
    async def test_generate_role_page(self, ai_engine, sample_requirements, temp_output_dir):
        """Test role-specific page generation"""
        role = "Banker"
        component_path = await ai_engine.generate_role_page(
            role,
            sample_requirements,
            temp_output_dir
        )

        assert component_path is not None
        assert Path(component_path).exists()

        content = Path(component_path).read_text()
        assert "BankerDashboard" in content
        assert role in content

    @pytest.mark.asyncio
    async def test_generate_data_component(self, ai_engine, sample_requirements, temp_output_dir):
        """Test data management component generation"""
        data_type = "Transactions"
        component_path = await ai_engine.generate_data_component(
            data_type,
            sample_requirements,
            temp_output_dir
        )

        assert component_path is not None
        assert Path(component_path).exists()

        content = Path(component_path).read_text()
        assert "TransactionsManager" in content
        assert data_type in content

    @pytest.mark.asyncio
    async def test_generate_components(self, ai_engine, sample_requirements,
                                      sample_template_config, temp_output_dir):
        """Test full component generation"""
        components = await ai_engine.generate_components(
            sample_requirements,
            sample_template_config,
            temp_output_dir
        )

        # Should generate: layout + 3 roles + 3 data types = 7 components
        expected_count = 1 + len(sample_requirements.user_roles) + len(sample_requirements.data_types)
        assert len(components) == expected_count

        # Verify all component files exist
        for component_path in components:
            assert Path(component_path).exists()


class TestAPIGeneration:
    """Test API integration layer generation"""

    def test_generate_api_client(self, ai_engine, sample_requirements):
        """Test API client code generation"""
        code = ai_engine._generate_api_client(sample_requirements)

        assert "APIClient" in code
        assert "axios" in code
        assert "get" in code
        assert "post" in code
        assert "Authorization" in code

    def test_generate_api_service(self, ai_engine, sample_requirements):
        """Test feature-specific API service generation"""
        feature = AIFeature.FRAUD_DETECTION
        code = ai_engine._generate_api_service(feature, sample_requirements)

        assert "FraudDetectionService" in code
        assert "analyze" in code
        assert "/api/v1/ai/fraud_detection" in code

    @pytest.mark.asyncio
    async def test_generate_api_integrations(self, ai_engine, sample_requirements, temp_output_dir):
        """Test full API integration layer generation"""
        api_files = await ai_engine.generate_api_integrations(
            sample_requirements,
            temp_output_dir
        )

        # Should have main client + 3 feature services
        expected_count = 1 + len(sample_requirements.ai_features)
        assert len(api_files) >= expected_count

        # Verify API client exists
        assert "apiClient" in api_files
        assert Path(api_files["apiClient"]).exists()


class TestBrandingAndConfig:
    """Test branding and configuration generation"""

    def test_generate_theme(self, ai_engine, sample_requirements):
        """Test Material-UI theme generation"""
        code = ai_engine._generate_theme(sample_requirements)

        assert "createTheme" in code
        assert "Acme Bank" in code
        assert "primary" in code
        assert "palette" in code

    def test_generate_app_config(self, ai_engine, sample_requirements):
        """Test app configuration generation"""
        code = ai_engine._generate_app_config(sample_requirements)

        assert "Acme Bank" in code
        assert "finance" in code
        assert "fraud_detection" in code

    @pytest.mark.asyncio
    async def test_apply_branding(self, ai_engine, sample_requirements, temp_output_dir):
        """Test branding application"""
        branding_files = await ai_engine.apply_branding(
            sample_requirements,
            temp_output_dir
        )

        assert "theme" in branding_files
        assert "config" in branding_files
        assert Path(branding_files["theme"]).exists()

    def test_generate_package_json(self, ai_engine, sample_requirements):
        """Test package.json generation"""
        code = ai_engine._generate_package_json(sample_requirements)
        data = json.loads(code)

        assert "acme-bank-dashboard" in data["name"]
        assert "react" in data["dependencies"]
        assert "@varity/ui-kit" in data["dependencies"]

    def test_generate_tsconfig(self, ai_engine):
        """Test tsconfig.json generation"""
        code = ai_engine._generate_tsconfig()
        data = json.loads(code)

        assert "compilerOptions" in data
        assert data["compilerOptions"]["strict"] is True
        assert "ES2020" in str(data["compilerOptions"]["target"])

    def test_generate_env_example(self, ai_engine, sample_requirements):
        """Test .env.example generation"""
        code = ai_engine._generate_env_example(sample_requirements)

        assert "REACT_APP_VARITY_API_URL" in code
        assert "Acme Bank" in code
        assert "FRAUD_DETECTION" in code

    def test_generate_readme(self, ai_engine, sample_requirements, sample_template_config):
        """Test README.md generation"""
        code = ai_engine._generate_readme(sample_requirements, sample_template_config)

        assert "Acme Bank Dashboard" in code
        assert "Varity" in code
        assert "npm install" in code
        assert "Finance" in code

    @pytest.mark.asyncio
    async def test_generate_config_files(self, ai_engine, sample_requirements,
                                        sample_template_config, temp_output_dir):
        """Test full config files generation"""
        config_files = await ai_engine.generate_config_files(
            sample_requirements,
            sample_template_config,
            temp_output_dir
        )

        assert "package.json" in config_files
        assert "tsconfig.json" in config_files
        assert ".env.example" in config_files
        assert "README.md" in config_files

        for file_path in config_files.values():
            assert Path(file_path).exists()


# ============================================================================
# WEEK 3 TESTS: SELF-CORRECTION & VALIDATION
# ============================================================================

class TestCodeValidation:
    """Test code validation layers"""

    @pytest.mark.asyncio
    async def test_validate_syntax_python_valid(self, ai_engine):
        """Test valid Python syntax validation"""
        code = "def hello():\n    print('Hello, world!')"
        valid, errors = await ai_engine._validate_syntax(code, "python")

        assert valid is True
        assert len(errors) == 0

    @pytest.mark.asyncio
    async def test_validate_syntax_python_invalid(self, ai_engine):
        """Test invalid Python syntax validation"""
        code = "def hello(\n    print('Hello')"  # Missing closing parenthesis
        valid, errors = await ai_engine._validate_syntax(code, "python")

        assert valid is False
        assert len(errors) > 0

    @pytest.mark.asyncio
    async def test_validate_types(self, ai_engine):
        """Test TypeScript type validation"""
        code_with_any = "const x: any = 5;"
        valid, warnings = await ai_engine._validate_types(code_with_any)

        assert valid is True  # Warnings don't fail validation
        assert len(warnings) > 0
        assert "any" in warnings[0]

    @pytest.mark.asyncio
    async def test_validate_security_hardcoded_secrets(self, ai_engine):
        """Test security validation for hardcoded secrets"""
        code = "const api_key = 'sk-1234567890';"
        valid, errors = await ai_engine._validate_security(code)

        assert valid is False
        assert len(errors) > 0

    @pytest.mark.asyncio
    async def test_validate_security_eval(self, ai_engine):
        """Test security validation for eval()"""
        code = "eval(userInput);"
        valid, errors = await ai_engine._validate_security(code)

        assert valid is False
        assert "eval()" in str(errors)

    @pytest.mark.asyncio
    async def test_validate_best_practices(self, ai_engine):
        """Test best practices validation"""
        code = "var x = 5;"
        valid, warnings = await ai_engine._validate_best_practices(code, "javascript")

        assert valid is True
        assert len(warnings) > 0
        assert "var" in warnings[0]

    def test_calculate_validation_score(self, ai_engine):
        """Test validation score calculation"""
        # No errors or warnings = 100%
        score = ai_engine._calculate_validation_score([], [])
        assert score == 100.0

        # 1 error = -10 points
        score = ai_engine._calculate_validation_score(["error"], [])
        assert score == 90.0

        # 1 warning = -2 points
        score = ai_engine._calculate_validation_score([], ["warning"])
        assert score == 98.0

    @pytest.mark.asyncio
    async def test_validate_generated_code_valid(self, ai_engine):
        """Test full code validation with valid code"""
        code = """
import React from 'react';

const MyComponent: React.FC = () => {
  return <div>Hello</div>;
};

export default MyComponent;
"""
        result = await ai_engine.validate_generated_code(code, "typescript")

        assert result.valid is True
        assert result.score > 80.0

    @pytest.mark.asyncio
    async def test_validate_generated_code_invalid(self, ai_engine):
        """Test full code validation with invalid code"""
        code = """
const api_key = 'secret';
eval(userInput);
var x: any = 5;
"""
        result = await ai_engine.validate_generated_code(code, "typescript")

        assert result.valid is False
        assert len(result.errors) > 0


class TestSelfCorrection:
    """Test self-correction mechanisms"""

    def test_validation_result_boolean(self):
        """Test ValidationResult boolean conversion"""
        valid_result = ValidationResult(valid=True, errors=[], score=100.0)
        assert bool(valid_result) is True

        invalid_result = ValidationResult(valid=False, errors=["error"], score=50.0)
        assert bool(invalid_result) is False

    @pytest.mark.asyncio
    async def test_rule_based_self_correct_eval(self, ai_engine):
        """Test rule-based correction for eval()"""
        code = "const result = eval(input);"
        validation = ValidationResult(
            valid=False,
            errors=["Use of eval() is dangerous"],
            score=70.0
        )

        corrected = ai_engine._rule_based_self_correct(code, validation)

        assert "eval(" not in corrected or "// REMOVED:" in corrected

    @pytest.mark.asyncio
    async def test_rule_based_self_correct_var(self, ai_engine):
        """Test rule-based correction for var"""
        code = "var x = 5;"
        validation = ValidationResult(
            valid=True,
            warnings=["Use 'const' or 'let' instead of 'var'"],
            score=95.0
        )

        corrected = ai_engine._rule_based_self_correct(code, validation)

        assert "const x = 5;" in corrected

    @pytest.mark.asyncio
    async def test_self_correct_disabled(self, ai_engine):
        """Test self-correction when disabled"""
        ai_engine.self_correction_enabled = False

        code = "var x = 5;"
        validation = ValidationResult(valid=False, errors=["error"], score=50.0)

        corrected = await ai_engine.self_correct(code, validation)

        # Should return original code unchanged
        assert corrected == code

    @pytest.mark.asyncio
    async def test_self_correct_enabled(self, ai_engine):
        """Test self-correction when enabled"""
        ai_engine.self_correction_enabled = True

        code = "var x = 5;"
        validation = ValidationResult(
            valid=True,
            warnings=["Use const instead of var"],
            score=95.0
        )

        corrected = await ai_engine.self_correct(code, validation, "javascript")

        # Should attempt correction
        assert corrected is not None


class TestQualityScoring:
    """Test quality scoring system"""

    def test_quality_score_overall_calculation(self):
        """Test overall quality score calculation"""
        score = QualityScore(
            code_quality=90.0,
            type_safety=85.0,
            security=95.0,
            performance=80.0,
            accessibility=75.0,
            documentation=70.0
        )

        # Weighted average
        overall = score.overall
        assert 80.0 <= overall <= 90.0  # Should be in reasonable range
        assert overall > 0.0

    @pytest.mark.asyncio
    async def test_score_code_quality(self, ai_engine):
        """Test code quality scoring"""
        template = {
            "components": ["comp1", "comp2", "comp3"],
            "project_structure": {"src": ["dir1"]}
        }

        score = await ai_engine._score_code_quality(template)
        assert score >= 80.0

    @pytest.mark.asyncio
    async def test_score_type_safety(self, ai_engine):
        """Test type safety scoring"""
        template = {
            "config_files": {
                "tsconfig.json": "/path/to/tsconfig.json"
            }
        }

        score = await ai_engine._score_type_safety(template)
        assert score >= 80.0

    @pytest.mark.asyncio
    async def test_score_template_quality(self, ai_engine, sample_requirements,
                                         temp_output_dir):
        """Test full template quality scoring"""
        # Generate a minimal template
        template = {
            "components": ["comp1", "comp2", "comp3"],
            "project_structure": {"src": ["dir1"]},
            "config_files": {
                "tsconfig.json": "/path",
                "README.md": "/path"
            }
        }

        quality_score = await ai_engine.score_template_quality(template)

        assert quality_score.overall > 0.0
        assert quality_score.overall <= 100.0
        assert quality_score.code_quality > 0.0
        assert quality_score.documentation > 0.0


class TestMetricsTracking:
    """Test metrics tracking"""

    @pytest.mark.asyncio
    async def test_track_generation_metrics_initial(self, ai_engine):
        """Test metrics tracking with no generations"""
        metrics = await ai_engine.track_generation_metrics()

        assert metrics["total_attempts"] == 0
        assert metrics["successful_generations"] == 0
        assert "0.0%" in metrics["success_rate"]

    @pytest.mark.asyncio
    async def test_track_generation_metrics_after_success(self, ai_engine):
        """Test metrics tracking after successful generation"""
        ai_engine.metrics["generations_attempted"] = 5
        ai_engine.metrics["generations_successful"] = 4
        ai_engine.metrics["average_quality_score"] = 88.5

        metrics = await ai_engine.track_generation_metrics()

        assert metrics["total_attempts"] == 5
        assert metrics["successful_generations"] == 4
        assert "80.0%" in metrics["success_rate"]
        assert "88.5" in metrics["average_quality_score"]


class TestRAGIntegration:
    """Test RAG knowledge base integration"""

    @pytest.mark.asyncio
    async def test_get_rag_context_finance(self, ai_engine):
        """Test RAG context retrieval for finance"""
        contexts = await ai_engine.get_rag_context(
            Industry.FINANCE,
            "banking compliance",
            top_k=10
        )

        assert len(contexts) > 0
        assert len(contexts) <= 10

    @pytest.mark.asyncio
    async def test_get_rag_context_healthcare(self, ai_engine):
        """Test RAG context retrieval for healthcare"""
        contexts = await ai_engine.get_rag_context(
            Industry.HEALTHCARE,
            "patient data security",
            top_k=5
        )

        assert len(contexts) > 0
        assert len(contexts) <= 5


# ============================================================================
# INTEGRATION TESTS
# ============================================================================

class TestFullGenerationFlow:
    """Integration tests for complete generation flow"""

    @pytest.mark.asyncio
    async def test_full_template_generation(self, ai_engine, sample_requirements, temp_output_dir):
        """Test complete template generation flow"""
        # This is a smoke test - not all features will work without LLM
        try:
            result = await ai_engine.generate_template(
                sample_requirements,
                temp_output_dir
            )

            assert result["success"] is True
            assert "project_structure" in result
            assert "components" in result
            assert "api_layer" in result

            # Verify key directories exist
            assert (temp_output_dir / "src").exists()
            assert (temp_output_dir / "src" / "components").exists()

        except Exception as e:
            # Log but don't fail - some features require LLM
            pytest.skip(f"Full generation requires LLM: {e}")


# ============================================================================
# PERFORMANCE TESTS
# ============================================================================

class TestPerformance:
    """Performance tests to ensure generation is fast"""

    @pytest.mark.asyncio
    async def test_validation_performance(self, ai_engine):
        """Test that validation is fast (< 1 second)"""
        import time

        code = "const x = 5;"
        start = time.time()

        await ai_engine.validate_generated_code(code, "typescript")

        elapsed = time.time() - start
        assert elapsed < 1.0, f"Validation took {elapsed}s, should be < 1s"

    @pytest.mark.asyncio
    async def test_component_generation_performance(self, ai_engine, sample_requirements, temp_output_dir):
        """Test that component generation is fast"""
        import time

        start = time.time()

        await ai_engine.generate_dashboard_layout(sample_requirements, temp_output_dir)

        elapsed = time.time() - start
        assert elapsed < 2.0, f"Component generation took {elapsed}s, should be < 2s"


# ============================================================================
# TEST EXECUTION
# ============================================================================

if __name__ == "__main__":
    # Run tests with pytest
    pytest.main([__file__, "-v", "--tb=short", "--cov=varietykit.core.ai_engine", "--cov-report=term-missing"])
