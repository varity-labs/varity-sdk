# PyPI Package Preparation Checklist

Comprehensive checklist for preparing `varity-thirdweb-client` for PyPI publication.

---

## 📋 Pre-Publication Checklist

### Package Structure

- ✅ **Package name**: `varity-thirdweb-client`
- ✅ **Version**: `1.0.0`
- ✅ **Python compatibility**: 3.8+

### Required Files

- ✅ `setup_thirdweb.py` - Package configuration
- ✅ `README_THIRDWEB.md` - Comprehensive documentation
- ✅ `LICENSE` - MIT license
- ✅ `requirements_thirdweb.txt` - Dependencies
- ✅ `requirements_dev.txt` - Development dependencies
- ✅ `pytest_thirdweb.ini` - Test configuration
- ✅ `MANIFEST.in` - Include additional files (create)

### Source Code

- ✅ `varity_client/__init__.py` - Package exports
- ✅ `varity_client/client.py` - Main client class
- ✅ `varity_client/chains.py` - Chain configurations
- ✅ `varity_client/contracts.py` - Contract operations
- ✅ `varity_client/wallet.py` - Wallet operations
- ✅ `varity_client/auth.py` - SIWE authentication
- ✅ `varity_client/storage.py` - IPFS storage
- ✅ `varity_client/utils.py` - Utility functions
- ✅ `varity_client/types.py` - Type definitions
- ✅ `varity_client/exceptions.py` - Custom exceptions

### Examples

- ✅ `examples_thirdweb/basic_usage.py`
- ✅ `examples_thirdweb/wallet_operations.py`
- ✅ `examples_thirdweb/contract_interaction.py`
- ✅ `examples_thirdweb/siwe_auth.py`
- ✅ `examples_thirdweb/async_operations.py`
- ✅ `examples_thirdweb/storage_operations.py`

### Tests

- ✅ `tests_thirdweb/test_client.py` - Client tests
- ✅ `tests_thirdweb/test_utils.py` - Utility function tests
- ⏳ `tests_thirdweb/test_wallet.py` - Wallet operation tests (add more)
- ⏳ `tests_thirdweb/test_contracts.py` - Contract operation tests (add more)
- ⏳ `tests_thirdweb/test_auth.py` - Authentication tests (add more)
- ⏳ `tests_thirdweb/test_storage.py` - Storage tests (add more)

---

## 📦 Build Steps

### 1. Create MANIFEST.in

```bash
cat > MANIFEST.in << 'EOF'
include README_THIRDWEB.md
include LICENSE
include requirements_thirdweb.txt
include requirements_dev.txt
include pytest_thirdweb.ini
recursive-include examples_thirdweb *.py
recursive-include tests_thirdweb *.py
recursive-include varity_client *.py
EOF
```

### 2. Build Package

```bash
# Clean previous builds
rm -rf build/ dist/ *.egg-info/

# Build source distribution and wheel
python -m build

# Verify build
ls -lh dist/
```

Expected output:
```
varity-thirdweb-client-1.0.0.tar.gz
varity_thirdweb_client-1.0.0-py3-none-any.whl
```

### 3. Test Installation

```bash
# Create test virtual environment
python -m venv test_env
source test_env/bin/activate

# Install from wheel
pip install dist/varity_thirdweb_client-1.0.0-py3-none-any.whl

# Test import
python -c "from varity_client import VarityClient; print('Success!')"

# Deactivate and clean up
deactivate
rm -rf test_env/
```

### 4. Check Package

```bash
# Install twine
pip install twine

# Check package
twine check dist/*
```

Expected output:
```
Checking dist/varity-thirdweb-client-1.0.0.tar.gz: PASSED
Checking dist/varity_thirdweb_client-1.0.0-py3-none-any.whl: PASSED
```

---

## 🚀 Publication Steps

### TestPyPI (Recommended First)

```bash
# Upload to TestPyPI
twine upload --repository testpypi dist/*

# Test installation from TestPyPI
pip install --index-url https://test.pypi.org/simple/ varity-thirdweb-client

# Verify
python -c "from varity_client import VarityClient; print(VarityClient.__doc__)"
```

### Production PyPI

```bash
# Upload to PyPI
twine upload dist/*

# Verify on PyPI
# https://pypi.org/project/varity-thirdweb-client/

# Test installation
pip install varity-thirdweb-client
```

---

## 🔐 Security

### Before Publishing

- ✅ Remove all test private keys
- ✅ No hardcoded secrets in code
- ✅ `.gitignore` includes sensitive files
- ✅ Example code uses environment variables

### API Tokens

Store PyPI token securely:

```bash
# Create ~/.pypirc
cat > ~/.pypirc << 'EOF'
[distutils]
index-servers =
    pypi
    testpypi

[pypi]
username = __token__
password = pypi-...

[testpypi]
username = __token__
password = pypi-...
EOF

chmod 600 ~/.pypirc
```

---

## 📊 Quality Checks

### Code Quality

```bash
# Format code
black varity_client/
isort varity_client/

# Lint code
flake8 varity_client/ --max-line-length=100

# Type checking
mypy varity_client/
```

### Testing

```bash
# Run all tests
pytest tests_thirdweb/ -v

# Run with coverage
pytest tests_thirdweb/ --cov=varity_client --cov-report=html

# Check coverage threshold (aim for >80%)
pytest tests_thirdweb/ --cov=varity_client --cov-fail-under=80
```

### Documentation

```bash
# Generate documentation
cd docs/
sphinx-build -b html . _build/html

# View documentation
open _build/html/index.html
```

---

## 📝 Post-Publication

### GitHub Release

1. Create git tag:
   ```bash
   git tag -a v1.0.0 -m "Release v1.0.0"
   git push origin v1.0.0
   ```

2. Create GitHub release:
   - Go to GitHub repository
   - Click "Releases" → "Create a new release"
   - Select tag `v1.0.0`
   - Add release notes
   - Attach distribution files

### Announcement

- Update project README with PyPI badge
- Announce on Discord/Twitter
- Update documentation links
- Create blog post (optional)

---

## 🔄 Version Updates

For future releases:

1. **Update version** in `setup_thirdweb.py`
2. **Update CHANGELOG.md** with changes
3. **Run tests** to ensure compatibility
4. **Build and publish** following steps above

### Semantic Versioning

- **MAJOR** (1.x.x): Breaking changes
- **MINOR** (x.1.x): New features, backward compatible
- **PATCH** (x.x.1): Bug fixes, backward compatible

---

## ✅ Final Checklist

Before publishing to PyPI:

- [ ] All tests passing
- [ ] Code formatted and linted
- [ ] Type checking passes
- [ ] Documentation complete
- [ ] Examples working
- [ ] README comprehensive
- [ ] LICENSE included
- [ ] No hardcoded secrets
- [ ] Version number updated
- [ ] CHANGELOG updated
- [ ] Git tag created
- [ ] Package built successfully
- [ ] Package checked with twine
- [ ] Test installation successful
- [ ] Tested on TestPyPI

---

## 📞 Support

If you encounter issues during publication:

- Check [Python Packaging Guide](https://packaging.python.org/)
- Review [PyPI Documentation](https://pypi.org/help/)
- Ask in Python Packaging Discord
- Contact Varity team: support@varity.io

---

**Package Name**: `varity-thirdweb-client`
**Version**: `1.0.0`
**License**: MIT
**Python**: 3.8+
