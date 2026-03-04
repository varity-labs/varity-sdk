#!/bin/bash
# Quick installation verification test for VarityKit CLI

set -e

echo "======================================"
echo "VarityKit CLI - Installation Test"
echo "======================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running from correct directory
if [ ! -f "pyproject.toml" ]; then
    echo -e "${RED}✗ Error: Must run from varietykit-cli root directory${NC}"
    exit 1
fi

# Check Python
echo -n "Checking Python version... "
PYTHON_VERSION=$(python3 --version 2>&1 | awk '{print $2}')
echo -e "${GREEN}✓${NC} Python $PYTHON_VERSION"

# Check if venv exists
if [ ! -d ".venv" ]; then
    echo -e "${YELLOW}⚠ Virtual environment not found${NC}"
    echo "Run ./setup_dev.sh to create it"
    exit 1
fi

# Activate venv
echo -n "Activating virtual environment... "
source .venv/bin/activate
echo -e "${GREEN}✓${NC}"

# Check if varietykit is installed
echo -n "Checking varietykit installation... "
if ! command -v varietykit &> /dev/null; then
    echo -e "${RED}✗ Not installed${NC}"
    echo "Run: pip install -e ."
    exit 1
fi
echo -e "${GREEN}✓${NC}"

# Test --version
echo -n "Testing 'varietykit --version'... "
VERSION_OUTPUT=$(varietykit --version 2>&1)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} $VERSION_OUTPUT"
else
    echo -e "${RED}✗ Failed${NC}"
    exit 1
fi

# Test --help
echo -n "Testing 'varietykit --help'... "
if varietykit --help > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗ Failed${NC}"
    exit 1
fi

# Test doctor command
echo -n "Testing 'varietykit doctor --help'... "
if varietykit doctor --help > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗ Failed${NC}"
    exit 1
fi

# Test init command
echo -n "Testing 'varietykit init --help'... "
if varietykit init --help > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗ Failed${NC}"
    exit 1
fi

# Test bootstrap command
echo -n "Testing 'varietykit bootstrap --help'... "
if varietykit bootstrap --help > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗ Failed${NC}"
    exit 1
fi

# Run unit tests if pytest is available
echo ""
echo "Running unit tests..."
if pytest tests/unit/ -v --tb=short; then
    echo -e "${GREEN}✓ All tests passed${NC}"
else
    echo -e "${RED}✗ Some tests failed${NC}"
    exit 1
fi

# Success
echo ""
echo "======================================"
echo -e "${GREEN}✓ Installation verified successfully!${NC}"
echo "======================================"
echo ""
echo "Available commands:"
echo "  varietykit --version"
echo "  varietykit doctor"
echo "  varietykit init"
echo "  varietykit bootstrap"
echo ""
echo "For full documentation:"
echo "  cat README.md"
echo "  varietykit --help"
echo ""
