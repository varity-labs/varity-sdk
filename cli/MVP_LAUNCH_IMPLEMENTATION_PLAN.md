# Varity SDK MVP Launch Implementation Plan

**Date**: January 22, 2026
**Status**: Ready to Execute
**Goal**: Fix all blocking issues for production MVP launch

## Current State Overview

### Project Statistics
- **Python Files**: 53 files
- **CLI Commands**: 18 commands (doctor, init, deploy, template, marketplace, etc.)
- **Test Coverage**: 37% (target: 90%)
- **Security Vulnerabilities**: 101 CVEs (12 critical) → Need: 0
- **Type Errors**: 152 mypy errors → Need: <50
- **Pylint Errors**: 11 E-level → Need: 0
- **Pylint Score**: 8.93 → Need: >9.0

### Quality Status by Category

| Category | Current | Target | Priority | Time Est. |
|----------|---------|--------|----------|-----------|
| Security | 101 CVEs | 0 CVEs | CRITICAL | 4 hours |
| Formatting | Inconsistent | 100% black | HIGH | 30 min |
| Type Safety | 152 errors | <50 errors | HIGH | 2-3 days |
| Pylint | 11 E-errors | 0 E-errors | HIGH | 1 day |
| Test Coverage | 37% | 70%+ | HIGH | 3-4 days |
| Documentation | Partial | Complete | MEDIUM | 2 days |

## Phase 2: Critical Fixes (Week 1)

### Day 1: Security & Formatting (CRITICAL - 4-5 hours)

#### Task 1.1: Security Vulnerability Fixes (4 hours)
**Status**: READY TO EXECUTE
**Files**: `cli/pyproject.toml`
**Reference**: `cli/SECURITY_FIXES.md`

**Actions**:
1. Update pyproject.toml dependencies section
2. Add 15 missing security-fixed packages
3. Resolve urllib3 dependency conflict
4. Install updated dependencies
5. Run pip-audit to verify 0 vulnerabilities
6. Test CLI functionality
7. Document results in SECURITY_AUDIT.md

**Success Criteria**:
- [ ] pip-audit reports 0 critical/high vulnerabilities
- [ ] pip check shows no conflicts
- [ ] All CLI commands work
- [ ] Tests pass

**Commands**:
```bash
# 1. Backup current state
cp cli/pyproject.toml cli/pyproject.toml.backup

# 2. Apply security fixes (update pyproject.toml with SECURITY_FIXES.md content)

# 3. Install updated dependencies
cd cli && pip install -e ".[dev]"

# 4. Verify security
pip install pip-audit
pip-audit

# 5. Check for conflicts
pip check

# 6. Test CLI
varietykit --version
varietykit doctor
pytest tests/ -v

# 7. Commit if successful
git add cli/pyproject.toml cli/SECURITY_FIXES.md
git commit -m "fix(security): Resolve 101 CVEs (12 critical, 43 high)

- Update aiohttp, authlib, python-jose (CRITICAL)
- Add ecdsa>=0.19.2 (signature malleability fix)
- Update pillow, langchain-* (HIGH)
- Add 15 security-fixed dependencies
- Resolve urllib3 version conflict
- Verified with pip-audit: 0 vulnerabilities

Fixes: 101 CVEs across 35 packages
Risk: Low (mostly patch/minor upgrades)
Testing: All tests passing, CLI functional"
```

#### Task 1.2: Code Formatting (30 minutes)
**Status**: READY TO EXECUTE
**Files**: All Python files in `cli/varietykit/`

**Actions**:
```bash
cd cli

# 1. Format with black
black varietykit/

# 2. Sort imports
isort varietykit/

# 3. Remove unused imports
autoflake --remove-all-unused-imports --remove-unused-variables -i -r varietykit/

# 4. Verify
black --check varietykit/
isort --check varietykit/

# 5. Commit
git add varietykit/
git commit -m "style: Format all code with black, isort, autoflake

- Applied black formatting (100 line length)
- Sorted imports with isort
- Removed unused imports and variables
- Zero style violations

Impact: Purely cosmetic, no functional changes"
```

**Success Criteria**:
- [ ] black --check returns 0 files
- [ ] isort --check returns 0 files
- [ ] No unused imports
- [ ] Tests still pass

---

### Day 2-3: Type Safety Improvements (2-3 days)

#### Task 2.1: Install Missing Type Stubs (15 minutes)
```bash
pip install types-PyYAML types-toml types-requests types-click
```

#### Task 2.2: Fix Critical Type Errors (Top 50)

**Target Files** (in priority order):
1. `cli/varietykit/core/build_manager.py` (16 errors)
2. `cli/varietykit/core/project_detector.py` (12 errors)
3. `cli/varietykit/core/ipfs_uploader.py` (10 errors)
4. `cli/varietykit/core/deployment_orchestrator.py` (18 errors)
5. `cli/varietykit/commands/app_deploy.py` (14 errors)
6. `cli/varietykit/core/akash/akash_deployer.py` (11 errors)
7. `cli/varietykit/core/app_store/client.py` (9 errors)

**Common Patterns to Fix**:

1. **Missing null checks** (30 instances):
```python
# BEFORE (error)
def process_config(config: Optional[dict]) -> str:
    return config['key']  # Error: config might be None

# AFTER (fixed)
def process_config(config: Optional[dict]) -> str:
    if config is None:
        raise ValueError("Config cannot be None")
    return config['key']
```

2. **Type mismatches** (25 instances):
```python
# BEFORE (error)
def get_port(config: dict) -> int:
    return config.get('port', '8080')  # Error: returns str not int

# AFTER (fixed)
def get_port(config: dict) -> int:
    port = config.get('port', 8080)
    return int(port) if isinstance(port, str) else port
```

3. **Missing return types** (40 instances):
```python
# BEFORE (warning)
def calculate_gas():
    return 21000

# AFTER (fixed)
def calculate_gas() -> int:
    return 21000
```

4. **Dict access without type checking** (20 instances):
```python
# BEFORE (error)
data = json.loads(response)  # type: Any
value = data['key']  # Error: Any not subscriptable

# AFTER (fixed)
data = json.loads(response)
if not isinstance(data, dict):
    raise TypeError(f"Expected dict, got {type(data)}")
value = data['key']
```

**Implementation Strategy**:
1. Run mypy on each file individually
2. Fix errors from most critical to least
3. Add type annotations to function signatures
4. Add runtime checks where types can't be guaranteed
5. Use type guards (isinstance checks)
6. Add # type: ignore comments only where absolutely necessary (with justification)

**Success Criteria**:
- [ ] mypy errors reduced from 152 → <50
- [ ] All E-level errors fixed
- [ ] Function signatures have type annotations
- [ ] Tests pass

**Commands**:
```bash
# Check specific file
mypy cli/varietykit/core/build_manager.py

# Fix errors iteratively
# (manual editing)

# Verify progress
mypy cli/varietykit/ --no-error-summary | wc -l

# Commit after each major file
git add cli/varietykit/core/build_manager.py
git commit -m "fix(types): Add type annotations to build_manager.py

- Fixed 16 type errors
- Added return type annotations
- Added null checks for Optional parameters
- Runtime type validation for external data

Remaining: 136 type errors"
```

---

### Day 4: Pylint Critical Errors (1 day)

#### Task 3.1: Fix 11 E-level Pylint Errors

**Error Categories**:
1. **Variable shadowing** (5 instances)
2. **Missing function arguments** (2 instances)
3. **Not iterable** (2 instances)
4. **Other E-level** (2 instances)

**Files with E-level Errors**:
- `cli/varietykit/cli/deploy.py` (3 errors)
- `cli/varietykit/cli/template.py` (2 errors)
- `cli/varietykit/cli/marketplace.py` (2 errors)
- Others (4 errors)

**Common Fixes**:

1. **Variable shadowing**:
```python
# BEFORE (E0601)
def list(ctx, network, limit):  # Redefines built-in 'list'
    contracts = list(contract_files)  # Error: variable before assignment

# AFTER (fixed)
def list_deployments(ctx, network, limit):  # Renamed to avoid conflict
    contracts = list(contract_files)  # Now OK
```

2. **Missing arguments**:
```python
# BEFORE (E1120)
deployments = get_deployments()  # Missing 'network' and 'limit'

# AFTER (fixed)
deployments = get_deployments(network='varity-l3', limit=10)
```

3. **Not iterable**:
```python
# BEFORE (E1133)
for file in contract_files:  # contract_files might be None

# AFTER (fixed)
if contract_files is None:
    contract_files = []
for file in contract_files:
    ...
```

#### Task 3.2: Address Pylint Warnings (High Priority Only)

**Focus Areas**:
1. **Bare except clauses** (8 instances) - HIGH PRIORITY
2. **File operations without encoding** (20 instances) - HIGH PRIORITY
3. **Subprocess without check** (15 instances) - HIGH PRIORITY
4. **Unused arguments** (40 instances) - MEDIUM PRIORITY
5. **Unused imports** (30 instances) - MEDIUM PRIORITY (autoflake should handle)

**Commands**:
```bash
# Check pylint score
pylint cli/varietykit/ --score=yes

# Fix E-level errors in specific file
pylint cli/varietykit/cli/deploy.py --errors-only

# Verify after fixes
pylint cli/varietykit/ --score=yes
# Target: >9.0

# Commit
git add cli/varietykit/
git commit -m "fix(pylint): Resolve 11 E-level errors

- Fixed variable shadowing (list, format, license renamed)
- Fixed missing function arguments
- Added null checks for iterables
- Score improved: 8.93 → 9.2+

Zero E-level errors remaining"
```

---

### Day 5: Test Coverage Improvements (1 day initial, 3-4 days total)

#### Task 4.1: Fix Existing Test Fixtures (Day 5)

**Problem**: Tests failing due to fixture issues, not code bugs

**Files to Fix**:
- `cli/varietykit/tests/test_project_detector.py`
- `cli/varietykit/tests/test_build_manager.py`

**Actions**:
1. Identify broken fixtures
2. Fix setup/teardown issues
3. Add missing mocks
4. Ensure tests run independently

**Success Criteria**:
- [ ] Existing tests pass
- [ ] Tests can run in any order
- [ ] No test pollution

#### Task 4.2: Add Coverage for Untested Modules (Days 6-10)

**Priority Modules** (0-20% coverage):
1. `core/akash/provider_selector.py` (0%)
2. `core/app_store/metadata_builder.py` (5%)
3. `core/app_store/client.py` (15%)
4. `commands/app_deploy.py` (50% → 80%)

**Test Pattern**:
```python
# tests/core/akash/test_provider_selector.py
import pytest
from varietykit.core.akash.provider_selector import ProviderSelector

class TestProviderSelector:
    """Tests for Akash provider selection logic"""

    def test_select_provider_success(self):
        """Should select cheapest provider"""
        selector = ProviderSelector()
        bids = [
            {"provider": "cheap", "price": 50},
            {"provider": "expensive", "price": 1000}
        ]
        result = selector.select_provider(bids)
        assert result['provider'] == "cheap"

    def test_select_provider_no_bids(self):
        """Should raise error with no bids"""
        selector = ProviderSelector()
        with pytest.raises(ValueError, match="No bids available"):
            selector.select_provider([])

    def test_select_provider_filters_unreliable(self):
        """Should filter out providers with low uptime"""
        selector = ProviderSelector()
        bids = [
            {"provider": "reliable", "price": 60, "uptime": 99.9},
            {"provider": "unreliable", "price": 40, "uptime": 85.0}
        ]
        result = selector.select_provider(bids)
        assert result['provider'] == "reliable"
```

**Coverage Targets**:
- Overall: 37% → 70%
- Phase 2 modules: 60%+
- Critical paths: 90%+

**Commands**:
```bash
# Run tests with coverage
pytest cli/varietykit/tests/ --cov=cli/varietykit --cov-report=term-missing

# Generate HTML report
pytest cli/varietykit/tests/ --cov=cli/varietykit --cov-report=html

# View report
open htmlcov/index.html

# Target specific module
pytest cli/varietykit/tests/core/akash/test_provider_selector.py -v
```

---

## Phase 3: Integration & Validation (Week 2)

### Day 6: Environment Setup Documentation

**Files to Create**:
1. `cli/docs/ENVIRONMENT_SETUP.md`
2. `cli/.env.example`
3. `cli/scripts/setup_environment.sh`

**Content**:
- All required environment variables
- How to obtain credentials (step-by-step)
- Varity L3 network configuration
- thirdweb, Akash, IPFS setup
- Troubleshooting common issues

### Day 7: Build Test Application

**Directory**: `cli/examples/test-dashboard/`

**Application**:
- Next.js 14 dashboard
- Privy authentication
- Smart wallet integration
- Contract interactions
- File upload to IPFS
- Payment processing

**Purpose**: Validate entire deployment pipeline end-to-end

### Day 8: Deploy to Varity L3

**Steps**:
1. Build test app
2. Deploy to IPFS via CLI
3. Deploy contracts to Varity L3
4. Verify all features work in production
5. Document any issues

**Commands**:
```bash
cd cli/examples/test-dashboard
varietykit app deploy
varietykit app list
varietykit app status
```

### Day 9: Submit to App Store

**Steps**:
1. Create varity.config.ts
2. Prepare metadata (logo, screenshots)
3. Submit via CLI
4. Verify on store.varity.so
5. Test revenue split (70/30)

### Day 10: Integration Test Suite

**Files to Create**:
```
cli/tests/integration/
├── test_full_deployment.py
├── test_app_store_submission.py
├── test_rollback.py
└── test_error_scenarios.py
```

**Test Scenarios**:
- Full deployment (happy path)
- Error handling (invalid project, build failures)
- Rollback functionality
- Multi-deployment scenarios

---

## Phase 4: Production Hardening (Week 3)

### Day 11: Performance Optimization

**Targets**:
- CLI startup: <500ms
- Project detection: <1s
- IPFS upload: <30s for 10MB

**Optimizations**:
1. Lazy import heavy modules
2. Cache project detection results
3. Parallel IPFS chunk uploads
4. Optimize dependency loading

### Day 12: Error Message Polish

**Goal**: Every error message helps non-Web3 users

**Format**: What / Why / How to fix

**Example**:
```
✗ Connection to Varity L3 blockchain failed

  This usually happens when:
  - Your internet connection is down
  - The RPC endpoint is temporarily unavailable

  What to do:
  1. Check your internet connection
  2. Try again in a few seconds
  3. Contact support: discord.gg/varity

  Technical details:
  RPC: https://rpc-varity-testnet-rroe52pwjp.t.conduit.xyz
  Error: Connection timeout (30s)
```

### Day 13: Documentation Polish

**Files to Complete**:
1. `cli/docs/QUICK_START.md`
2. `cli/docs/APP_DEPLOY.md` (update)
3. `cli/docs/API_REFERENCE.md`
4. `cli/docs/TROUBLESHOOTING.md`
5. `cli/docs/FAQ.md`

**Requirements**:
- Every feature documented
- Code examples for common tasks
- Clear for non-Web3 users
- Up-to-date screenshots

### Day 14: Varity L3 Configuration Verification

**Goal**: Ensure MVP only supports Varity L3 (no multi-chain)

**Checks**:
1. All chain IDs = 33529
2. All RPC URLs = Varity L3
3. No multi-chain selection logic
4. Error messages mention Varity L3 only

**Commands**:
```bash
# Find any non-Varity L3 chain references
grep -r "chain_id" cli/varietykit/ | grep -v "33529"
grep -r "421614\|84532" cli/varietykit/  # Arbitrum, Base
grep -r "select.*chain" cli/varietykit/
```

### Day 15: Pre-Launch Testing

**Comprehensive Test Checklist**:

**Functional Tests** (20 tests):
- [ ] varietykit --version
- [ ] varietykit doctor
- [ ] varietykit init
- [ ] varietykit app deploy (Next.js)
- [ ] varietykit app deploy (React)
- [ ] varietykit app deploy (Vue)
- [ ] varietykit app deploy --submit-to-store
- [ ] varietykit app list
- [ ] varietykit app info <id>
- [ ] varietykit app status
- [ ] varietykit app rollback <id>
- [ ] All other CLI commands

**Error Handling Tests** (10 tests):
- [ ] Invalid project directory
- [ ] Build failures
- [ ] Network failures
- [ ] Missing environment variables
- [ ] Invalid credentials

**Platform Tests** (3 tests):
- [ ] Ubuntu 22.04
- [ ] macOS 13+
- [ ] Windows 11 (WSL2)

**Integration Tests** (5 tests):
- [ ] End-to-end deployment
- [ ] App Store submission
- [ ] Revenue split verification
- [ ] Rollback functionality
- [ ] Multi-deployment

**Performance Tests** (4 tests):
- [ ] CLI startup <500ms
- [ ] Project detection <1s
- [ ] Build streaming works
- [ ] IPFS upload <30s (10MB)

**Security Tests** (5 tests):
- [ ] No secrets in logs
- [ ] Environment variables secure
- [ ] File permissions correct
- [ ] No injection vectors
- [ ] pip-audit clean

**Documentation Tests** (3 tests):
- [ ] Quick Start works
- [ ] All examples run
- [ ] Links not broken

---

## Success Metrics

### Phase 2 Complete
- [ ] 0 security vulnerabilities (from 101)
- [ ] <50 type errors (from 152)
- [ ] 70%+ test coverage (from 37%)
- [ ] Pylint score >9.0 (from 8.93)
- [ ] All code formatted (black, isort)

### Phase 3 Complete
- [ ] Test app deploys successfully
- [ ] App submitted to store
- [ ] Revenue split verified (70/30)
- [ ] Integration tests pass
- [ ] Environment docs complete

### Phase 4 Complete
- [ ] Performance targets met
- [ ] Error messages polished
- [ ] Documentation complete
- [ ] Varity L3 only verified
- [ ] All pre-launch tests pass

### MVP Launch Ready
- [ ] All phases complete
- [ ] Zero blocking issues
- [ ] Production-quality code
- [ ] Professional documentation
- [ ] Ready for open-source release

---

## Risk Assessment

### High Risk Items
1. **Langchain upgrade** (0.2 → 0.3) - Breaking changes possible
2. **Test coverage** - May discover hidden bugs
3. **Type errors** - May require significant refactoring

### Medium Risk Items
1. **Security updates** - Mostly safe, but test thoroughly
2. **Performance optimization** - Could break functionality
3. **Integration testing** - May reveal deployment issues

### Low Risk Items
1. **Code formatting** - Purely cosmetic
2. **Documentation** - No code changes
3. **Pylint fixes** - Mostly code quality improvements

### Mitigation Strategies
1. **Git branching** - Create feature branches for each major change
2. **Incremental commits** - Small, focused commits
3. **Comprehensive testing** - Test after each change
4. **Rollback plan** - Document how to revert changes
5. **Backup critical files** - Keep copies before major edits

---

## Timeline Summary

| Week | Days | Focus | Deliverables |
|------|------|-------|--------------|
| Week 1 | 1-5 | Critical Fixes | Security, formatting, types, pylint, tests |
| Week 2 | 6-10 | Integration | Env setup, test app, deployment, store, integration tests |
| Week 3 | 11-15 | Production | Performance, errors, docs, verification, pre-launch |

**Total Duration**: 15 working days (~3 weeks)

---

## Next Actions

1. ✅ Create this implementation plan (DONE)
2. ✅ Document security fixes (DONE - SECURITY_FIXES.md)
3. ⏳ Get approval to proceed
4. ⏳ Execute Day 1 tasks (security + formatting)
5. ⏳ Update progress in todos
6. ⏳ Continue through phases systematically

---

**STATUS**: Ready to execute
**BLOCKING**: Need approval to modify files
**PRIORITY**: CRITICAL (blocks MVP launch)
**CONFIDENCE**: HIGH (all issues documented, solutions clear)
