# Security Vulnerability Fixes - Varity SDK CLI

**Date**: January 22, 2026
**Status**: Ready to Apply
**Target**: Fix all 101 CVEs (12 critical, 43 high, 35 medium, 11 low)

## Executive Summary

Current state analysis shows the pyproject.toml already has 7 critical fixes applied:
- ✅ aiohttp>=3.13.3 (14 CVEs fixed)
- ✅ authlib>=1.6.6 (5 CVEs fixed)
- ✅ python-jose>=3.4.0 (2 CVEs fixed)
- ✅ configobj>=5.0.9 (1 CVE fixed)
- ✅ black>=24.3.0 (1 CVE fixed)
- ✅ copier>=9.11.2 (4 CVEs fixed)
- ✅ fastapi>=0.109.1 (1 CVE fixed)

**Still Missing**: 28 packages with 73 CVEs need to be added/updated

## Required Changes to pyproject.toml

### 1. CRITICAL Priority Packages (Add to dependencies)

```toml
"ecdsa>=0.19.2",  # CVE fix: GHSA-wj6h-64fc-37mp (signature malleability)
```

**Rationale**: CRITICAL severity - cryptographic signature vulnerability

### 2. HIGH Priority Packages (Add to dependencies)

```toml
"pillow>=10.3.0",  # CVE fix: 2 vulnerabilities (buffer overflow, DoS)
"langchain-community>=0.3.27",  # CVE fix: Arbitrary code execution (HIGH)
"langchain-core>=0.3.81",  # CVE fix: 2 vulnerabilities (HIGH)
"pynacl>=1.6.2",  # CVE fix: 1 vulnerability (HIGH)
```

**Rationale**: HIGH severity vulnerabilities affecting core functionality

### 3. MEDIUM Priority Packages (Add to dependencies)

```toml
"flask-cors>=6.0.0",  # CVE fix: 3 CORS bypass vulnerabilities
"filelock>=3.20.3",  # CVE fix: 2 vulnerabilities
"h2>=4.3.0",  # CVE fix: HTTP/2 vulnerability
"idna>=3.7",  # CVE fix: 1 vulnerability
"langchain-text-splitters>=0.3.9",  # CVE fix: 1 vulnerability
"marshmallow>=3.26.2",  # CVE fix: 1 vulnerability
"python-multipart>=0.0.7",  # CVE fix: 1 vulnerability
"fonttools>=4.60.2",  # CVE fix: 1 vulnerability
```

**Rationale**: MEDIUM severity - should be fixed before production launch

### 4. LOW Priority & Transitive Dependencies

The following are transitive dependencies that pip will automatically upgrade:
- urllib3 (resolve conflict: use 1.26.19 for compatibility)
- certifi, charset-normalizer, cryptography, etc.

## Dependency Conflict Resolution

**Issue**: urllib3 version conflict
```
botocore requires urllib3<1.27,>=1.25.4
qdrant-client requires urllib3<2.0.0,>=1.26.14
Current: 2.2.3
```

**Solution**: Pin to compatible version
```toml
"urllib3>=1.26.19,<2.0.0",  # Resolve botocore/qdrant-client conflict
```

## Complete Updated Dependencies Section

Replace the entire `dependencies` array in pyproject.toml with:

```toml
dependencies = [
    # Core CLI dependencies
    "click>=8.1.0",
    "copier>=9.11.2",  # CVE fix: 4 vulnerabilities (HIGH)
    "docker>=6.0.0",
    "pyyaml>=6.0",
    "requests>=2.31.0",
    "rich>=13.0.0",
    "toml>=0.10.2",
    "jinja2>=3.1.0",
    "python-dotenv>=1.0.0",

    # Security: CRITICAL severity fixes
    "aiohttp>=3.13.3",  # CVE fix: 14 vulnerabilities (CRITICAL)
    "authlib>=1.6.6",  # CVE fix: 5 vulnerabilities (CRITICAL)
    "ecdsa>=0.19.2",  # CVE fix: Signature malleability (CRITICAL)
    "python-jose>=3.4.0",  # CVE fix: JWT bypass (CRITICAL)

    # Security: HIGH severity fixes
    "pillow>=10.3.0",  # CVE fix: 2 vulnerabilities (HIGH)
    "langchain-community>=0.3.27",  # CVE fix: Code execution (HIGH)
    "langchain-core>=0.3.81",  # CVE fix: 2 vulnerabilities (HIGH)
    "pynacl>=1.6.2",  # CVE fix: 1 vulnerability (HIGH)

    # Security: MEDIUM severity fixes
    "configobj>=5.0.9",  # CVE fix: 1 vulnerability
    "fastapi>=0.109.1",  # CVE fix: 1 vulnerability
    "flask-cors>=6.0.0",  # CVE fix: 3 CORS bypass vulnerabilities
    "filelock>=3.20.3",  # CVE fix: 2 vulnerabilities
    "h2>=4.3.0",  # CVE fix: HTTP/2 vulnerability
    "idna>=3.7",  # CVE fix: 1 vulnerability
    "langchain-text-splitters>=0.3.9",  # CVE fix: 1 vulnerability
    "marshmallow>=3.26.2",  # CVE fix: 1 vulnerability
    "python-multipart>=0.0.7",  # CVE fix: 1 vulnerability
    "fonttools>=4.60.2",  # CVE fix: 1 vulnerability

    # Dependency conflict resolution
    "urllib3>=1.26.19,<2.0.0",  # Resolve botocore/qdrant-client conflict
]
```

## Verification Steps

After applying these changes:

### 1. Install Updated Dependencies
```bash
cd /home/macoding/varity-workspace/varity-sdk/cli
pip install -e ".[dev]"
```

### 2. Run Security Audit
```bash
pip install pip-audit
pip-audit
```

**Expected Result**: 0 vulnerabilities (or only informational warnings)

### 3. Verify Functionality
```bash
# Test CLI still works
varietykit --version
varietykit doctor

# Run existing tests
pytest tests/

# Check for import errors
python -c "import varietykit; print('OK')"
```

### 4. Check for Dependency Conflicts
```bash
pip check
```

**Expected Result**: No dependency conflicts

## Testing Plan

After security fixes are applied:

1. **Unit Tests**: Run full test suite
   ```bash
   pytest tests/ -v
   ```

2. **Integration Tests**: Test CLI commands
   ```bash
   varietykit doctor
   varietykit init test-project
   varietykit app deploy --dry-run
   ```

3. **Smoke Tests**: Verify critical paths
   - Project detection
   - Build process
   - IPFS upload
   - Contract deployment

4. **Performance Tests**: Verify no performance regression
   - CLI startup time (<500ms)
   - Command execution time

## Rollback Plan

If issues arise after applying fixes:

1. **Git Rollback**:
   ```bash
   git checkout cli/pyproject.toml
   pip install -e ".[dev]"
   ```

2. **Selective Rollback**: If specific package causes issues, downgrade only that package:
   ```bash
   pip install package-name==old-version
   ```

3. **Document Issue**: Create issue in GitHub with:
   - Package name and version
   - Error message
   - Steps to reproduce
   - Environment details

## Risk Assessment

### Low Risk Changes (Safe to Apply)
- ecdsa, pillow, fonttools, idna, h2
- These are well-tested upgrades with no breaking changes

### Medium Risk Changes (Test Thoroughly)
- langchain-* packages (major version jump 0.2 → 0.3)
- flask-cors (major version jump 5 → 6)
- May have API changes that affect code

### High Risk Changes (Already Applied)
- aiohttp, authlib, fastapi (already in pyproject.toml, working)

### Recommended Approach
1. Apply ALL changes at once (comprehensive fix)
2. Run full test suite
3. Test critical user paths manually
4. If issues found, rollback and apply incrementally

## Success Criteria

✅ pip-audit reports 0 critical/high vulnerabilities
✅ pip check reports no dependency conflicts
✅ All existing tests pass (pytest)
✅ CLI commands work (doctor, init, deploy)
✅ No import errors
✅ Performance maintained (<500ms startup)

## Timeline

- **Preparation**: 30 minutes (this document)
- **Implementation**: 15 minutes (update pyproject.toml)
- **Testing**: 2-3 hours (comprehensive verification)
- **Documentation**: 30 minutes (update SECURITY_AUDIT.md)

**Total Estimated Time**: 4 hours

## Next Steps

1. ✅ Document all required changes (THIS FILE)
2. ⏳ Get approval to modify pyproject.toml
3. ⏳ Apply changes to pyproject.toml
4. ⏳ Install updated dependencies
5. ⏳ Run security audit (pip-audit)
6. ⏳ Run test suite
7. ⏳ Verify CLI functionality
8. ⏳ Update SECURITY_AUDIT.md with results
9. ⏳ Commit changes with detailed message

## References

- Quality Audit Report: `/home/macoding/varity-workspace/claude/.planning/APP_DEPLOYMENT_SYSTEM/QUALITY_AUDIT_REPORT.md` (lines 436-610)
- Current pyproject.toml: `/home/macoding/varity-workspace/varity-sdk/cli/pyproject.toml` (lines 25-41)
- pip-audit documentation: https://pypi.org/project/pip-audit/
- CVE database: https://nvd.nist.gov/

---

**STATUS**: Ready for implementation
**BLOCKER**: None (all changes documented and safe)
**RISK LEVEL**: Low-Medium (mostly patch/minor version upgrades)
**PRIORITY**: CRITICAL (blocks MVP launch)
