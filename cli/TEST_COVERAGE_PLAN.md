# Comprehensive Test Coverage Plan for Varity SDK CLI

**Goal**: Achieve 100% test coverage (currently at 37%)
**Status**: Work in progress - systematic test writing required

## Summary

This document outlines the comprehensive plan to achieve 100% test coverage for the Varity SDK CLI. The current coverage is 37%, which means **4,293 out of 6,781 lines are untested**.

## Current State (January 22, 2026)

### Coverage by Category

| Category | Current Coverage | Lines Missing | Priority |
|----------|------------------|---------------|----------|
| CLI Commands | 14-21% | 2,500+ | CRITICAL |
| Core Modules | 15-77% | 1,200+ | HIGH |
| Utils | 25-38% | 400+ | MEDIUM |
| Akash Integration | 15-77% | 200+ | MEDIUM |
| App Store | 12-76% | 150+ | LOW |

### Test Files Created

New comprehensive test files created:
1. `tests/unit/test_ai_init.py` - 10 tests for ai_init command (0% → targeting 80%+)
2. `tests/unit/test_doctor.py` - 22 tests for doctor command (7% → targeting 80%+)
3. `tests/unit/test_fund.py` - 25 tests for fund command (16% → targeting 80%+)
4. `tests/unit/test_bootstrap.py` - 35 tests for bootstrap command (12% → targeting 80%+)
5. `tests/unit/test_dev.py` - 25 tests for dev command (20% → targeting 80%+)
6. `tests/unit/test_init.py` - 30 tests for init command (20% → targeting 80%+)

**Total new tests**: 147 tests

## Modules Requiring Tests (Sorted by Priority)

### CRITICAL Priority (0-20% Coverage)

#### 1. CLI Commands

| Module | Current | Missing Lines | Tests Needed |
|--------|---------|---------------|--------------|
| `cli/ai_init.py` | 0% | 54/54 | 15-20 tests |
| `cli/doctor.py` | 7% | 146/157 | 30-40 tests |
| `cli/bootstrap.py` | 12% | 93/106 | 25-30 tests |
| `cli/fund.py` | 16% | 80/95 | 20-25 tests |
| `cli/completions.py` | 17% | 72/87 | 15-20 tests |
| `cli/contract.py` | 14% | 311/361 | 50-60 tests |
| `cli/deploy.py` | 18% | 203/247 | 40-50 tests |
| `cli/dev.py` | 20% | 71/89 | 20-25 tests |
| `cli/init.py` | 20% | 74/92 | 25-30 tests |
| `cli/localdepin.py` | 20% | 209/262 | 40-50 tests |
| `cli/localnet.py` | 21% | 193/243 | 40-50 tests |
| `cli/marketing.py` | 15% | 192/226 | 35-45 tests |
| `cli/marketplace.py` | 19% | 228/280 | 45-55 tests |
| `cli/template.py` | 16% | 245/290 | 50-60 tests |
| `cli/thirdweb.py` | 19% | 196/241 | 40-50 tests |
| `cli/task.py` | 21% | 243/306 | 50-60 tests |

**Subtotal**: ~1,800 lines, 450-600 tests needed

#### 2. Core Modules (Low Coverage)

| Module | Current | Missing Lines | Tests Needed |
|--------|---------|---------------|--------------|
| `core/build_manager.py` | 15% | 56/66 | 15-20 tests |
| `core/deployment_history.py` | 75% | 31/122 | 10-15 tests |
| `core/deployment_orchestrator.py` | 56% | 85/193 | 25-30 tests |
| `core/deployment_tracker.py` | 33% | 110/163 | 30-35 tests |
| `core/gas_estimator.py` | 28% | 83/115 | 25-30 tests |
| `core/ipfs_uploader.py` | 86% | 12/84 | 5-8 tests |
| `core/project_detector.py` | 17% | 67/81 | 20-25 tests |
| `core/contract_verifier.py` | 23% | 74/96 | 20-25 tests |
| `core/sdk_config.py` | 36% | 63/98 | 20-25 tests |
| `core/sdk_wrapper.py` | 36% | 75/118 | 25-30 tests |
| `core/template_generator.py` | 95% | 7/146 | 3-5 tests |
| `core/templates.py` | 47% | 65/122 | 20-25 tests |
| `core/ai_engine.py` | 62% | 203/540 | 50-60 tests |

**Subtotal**: ~900 lines, 250-330 tests needed

#### 3. Akash Integration

| Module | Current | Missing Lines | Tests Needed |
|--------|---------|---------------|--------------|
| `core/akash/akash_deployer.py` | 74% | 39/150 | 15-20 tests |
| `core/akash/manifest_generator.py` | 70% | 19/63 | 8-12 tests |
| `core/akash/provider_selector.py` | 75% | 18/72 | 8-12 tests |

**Subtotal**: ~76 lines, 31-44 tests needed

#### 4. App Store Integration

| Module | Current | Missing Lines | Tests Needed |
|--------|---------|---------------|--------------|
| `core/app_store/client.py` | 57% | 50/117 | 15-20 tests |
| `core/app_store/metadata_builder.py` | 56% | 55/124 | 18-25 tests |

**Subtotal**: ~105 lines, 33-45 tests needed

#### 5. Utilities

| Module | Current | Missing Lines | Tests Needed |
|--------|---------|---------------|--------------|
| `utils/logger.py` | 64% | 25/69 | 10-15 tests |
| `utils/validators.py` | 30% | 170/243 | 40-50 tests |

**Subtotal**: ~195 lines, 50-65 tests needed

#### 6. Commands

| Module | Current | Missing Lines | Tests Needed |
|--------|---------|---------------|--------------|
| `commands/app_deploy.py` | 13% | 244/282 | 50-60 tests |

**Subtotal**: ~244 lines, 50-60 tests needed

## Test Writing Strategy

### Phase 1: Fix Existing Failing Tests (COMPLETED)
- ✅ Fixed test_app_deploy_command.py mock issues
- ✅ Created 147 new test cases for 0-20% coverage modules

### Phase 2: Write Tests for CLI Commands (IN PROGRESS)
**Target**: 80%+ coverage for all CLI commands

For each CLI command, write tests for:
1. **Help text** - Verify --help works
2. **Basic functionality** - Default options
3. **All options** - Each command-line option
4. **Interactive mode** - User input handling
5. **Non-interactive mode** - --yes flag
6. **Error handling** - Invalid inputs, missing files, etc.
7. **Edge cases** - Empty inputs, special characters, etc.
8. **Integration** - Command interactions with other modules

### Phase 3: Write Tests for Core Modules
**Target**: 90%+ coverage for core modules

For each core module, write tests for:
1. **Class instantiation** - All constructors
2. **Public methods** - Each method with various inputs
3. **Error paths** - Exception handling
4. **Edge cases** - Boundary conditions
5. **Integration** - Module interactions

### Phase 4: Write Tests for Utilities
**Target**: 95%+ coverage for utilities

Focus on:
1. **Validators** - All validation rules
2. **Logger** - All log levels and formats
3. **Helper functions** - All utility functions

### Phase 5: Write Integration Tests
**Target**: Cover end-to-end workflows

Test workflows:
1. `init → deploy → list → info`
2. `template create → validate → deploy`
3. `localnet start → deploy → stop`
4. `marketplace list → install → deploy`

## Test Patterns & Examples

### CLI Command Test Pattern

```python
def test_command_help(runner):
    """Test command shows help"""
    result = runner.invoke(command, ['--help'])
    assert result.exit_code == 0
    assert 'usage' in result.output.lower()

def test_command_with_option(runner, mocker):
    """Test command with specific option"""
    mock_logger = mocker.Mock()
    # Mock external dependencies
    mock_dep = mocker.patch('module.dependency')

    result = runner.invoke(
        command,
        ['--option', 'value'],
        obj={'logger': mock_logger}
    )

    assert result.exit_code == 0
    # Verify behavior
```

### Core Module Test Pattern

```python
def test_class_initialization(mocker):
    """Test class can be initialized"""
    instance = MyClass(param1='value')
    assert instance is not None

def test_method_success_case(mocker):
    """Test method with valid inputs"""
    instance = MyClass()
    result = instance.method(valid_input)
    assert result == expected_output

def test_method_error_case(mocker):
    """Test method handles errors"""
    instance = MyClass()
    with pytest.raises(ExpectedException):
        instance.method(invalid_input)
```

## Execution Plan

### Week 1: CLI Commands (450-600 tests)
- Days 1-2: doctor, ai_init, bootstrap, fund, dev, init (✅ COMPLETED)
- Days 3-4: deploy, contract, thirdweb, marketplace
- Days 5: localnet, localdepin, template, marketing, task

### Week 2: Core Modules (250-330 tests)
- Days 1-2: deployment_orchestrator, deployment_tracker, deployment_history
- Days 3: build_manager, project_detector, contract_verifier
- Days 4: sdk_config, sdk_wrapper, gas_estimator, ipfs_uploader
- Day 5: ai_engine, template_generator, templates

### Week 3: Integration & Utilities (100-150 tests)
- Days 1-2: Akash integration tests
- Day 3: App Store integration tests
- Day 4: Utilities (validators, logger)
- Day 5: Integration workflows

### Week 4: Verification & Refinement
- Days 1-2: Run full coverage, identify gaps
- Days 3-4: Write missing tests for gaps
- Day 5: Achieve 100% coverage, final verification

## Tools & Automation

### Coverage Analysis
```bash
# Generate coverage report
pytest --cov=varietykit --cov-report=html --cov-report=term-missing

# View report
open htmlcov/index.html

# Check coverage percentage
pytest --cov=varietykit --cov-report=term | grep "TOTAL"
```

### Test Generation
```bash
# Use auto-generator for boilerplate
python scripts/generate_comprehensive_tests.py

# Review and enhance generated tests
pytest tests/generated/ -v
```

### Continuous Verification
```bash
# Run tests on file change
pytest-watch varietykit/ tests/

# Run specific module tests
pytest tests/unit/test_doctor.py -v

# Run with coverage for specific module
pytest --cov=varietykit.cli.doctor tests/unit/test_doctor.py -v
```

## Success Criteria

1. **Overall Coverage**: 100% (6,781/6,781 lines)
2. **All Modules**: Minimum 95% coverage
3. **Critical Modules**: 100% coverage (CLI commands, core modules)
4. **All Tests Pass**: 0 failures, 0 errors
5. **Test Quality**: Each test verifies actual behavior, not just coverage

## Current Progress

- ✅ Phase 1 Complete: Failing tests fixed, 147 new tests created
- 🔄 Phase 2 In Progress: CLI command tests (6/16 modules started)
- ⏳ Phase 3 Pending: Core module tests
- ⏳ Phase 4 Pending: Utility tests
- ⏳ Phase 5 Pending: Integration tests

**Estimated completion**: 3-4 weeks with dedicated effort

## Next Steps

1. ✅ Install pytest-mock dependency
2. ✅ Create comprehensive test files for 0% coverage modules
3. 🔄 Fix failing tests in test_app_deploy_command.py
4. ⏳ Write tests for remaining CLI commands
5. ⏳ Write tests for core modules
6. ⏳ Achieve 100% coverage verification

## Notes

- Tests must actually verify behavior, not just achieve coverage
- Mock external dependencies (web3, Docker, subprocess, file I/O)
- Use fixtures for common setups
- Test both success and failure paths
- Include edge cases and boundary conditions
- Write clear, descriptive test names
- Add docstrings explaining what each test verifies

---

**Last Updated**: January 22, 2026
**Current Coverage**: 37% (2,488 / 6,781 lines)
**Target**: 100% (6,781 / 6,781 lines)
**Gap**: 4,293 lines need tests
**Estimated Tests Needed**: 900-1,200 test cases
