#!/bin/bash
# Development environment setup script for VarityKit CLI

set -e

echo "===================================="
echo "VarityKit CLI - Development Setup"
echo "===================================="
echo ""

# Check Python version
echo "Checking Python version..."
PYTHON_VERSION=$(python3 --version | awk '{print $2}')
REQUIRED_VERSION="3.8.0"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$PYTHON_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    echo "Error: Python 3.8+ required, found $PYTHON_VERSION"
    exit 1
fi
echo "✓ Python $PYTHON_VERSION"

# Create virtual environment
echo ""
echo "Creating virtual environment..."
if [ -d ".venv" ]; then
    echo "Virtual environment already exists"
else
    python3 -m venv .venv
    echo "✓ Virtual environment created"
fi

# Activate virtual environment
echo ""
echo "Activating virtual environment..."
source .venv/bin/activate
echo "✓ Virtual environment activated"

# Upgrade pip
echo ""
echo "Upgrading pip..."
pip install --upgrade pip > /dev/null 2>&1
echo "✓ pip upgraded"

# Install package in editable mode
echo ""
echo "Installing VarityKit CLI in editable mode..."
pip install -e ".[dev]" > /dev/null 2>&1
echo "✓ VarityKit CLI installed"

# Verify installation
echo ""
echo "Verifying installation..."
if varietykit --version > /dev/null 2>&1; then
    VERSION=$(varietykit --version)
    echo "✓ $VERSION"
else
    echo "✗ Installation verification failed"
    exit 1
fi

# Run tests
echo ""
echo "Running unit tests..."
pytest tests/unit/ -v
echo "✓ Tests passed"

# Summary
echo ""
echo "===================================="
echo "Development environment ready!"
echo "===================================="
echo ""
echo "To activate the virtual environment:"
echo "  source .venv/bin/activate"
echo ""
echo "To run tests:"
echo "  pytest"
echo ""
echo "To check code quality:"
echo "  black ."
echo "  ruff check ."
echo "  mypy varietykit"
echo ""
echo "To use the CLI:"
echo "  varietykit --help"
echo "  varietykit doctor"
echo ""
