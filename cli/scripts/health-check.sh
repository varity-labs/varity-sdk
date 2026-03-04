#!/bin/bash

# Varity Ecosystem Health Check Script
# Comprehensive validation of all system components

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Track overall health
ERRORS=0
WARNINGS=0

echo -e "${BLUE}=================================="
echo -e "🔍 Varity Ecosystem Health Check"
echo -e "==================================${NC}\n"

# Function to print status
print_status() {
    local status=$1
    local message=$2

    if [ "$status" = "PASS" ]; then
        echo -e "${GREEN}✓${NC} $message"
    elif [ "$status" = "WARN" ]; then
        echo -e "${YELLOW}⚠${NC} $message"
        ((WARNINGS++))
    elif [ "$status" = "FAIL" ]; then
        echo -e "${RED}✗${NC} $message"
        ((ERRORS++))
    else
        echo -e "${BLUE}ℹ${NC} $message"
    fi
}

# 1. Check CLI
echo -e "${BLUE}[1/6] Checking CLI...${NC}"
cd /home/macoding/blokko-internal-os/varity/varietykit-cli

if python3 -m varietykit.cli.main --version > /dev/null 2>&1; then
    VERSION=$(python3 -m varietykit.cli.main --version 2>&1 | grep "varietykit, version" | awk '{print $3}')
    print_status "PASS" "CLI version: $VERSION"

    # Check for RuntimeWarning
    if python3 -m varietykit.cli.main --version 2>&1 | grep -q "RuntimeWarning"; then
        print_status "FAIL" "CLI has RuntimeWarning"
    else
        print_status "PASS" "CLI has no RuntimeWarning"
    fi

    # Check CLI performance
    START_TIME=$(date +%s%N)
    python3 -m varietykit.cli.main --version > /dev/null 2>&1
    END_TIME=$(date +%s%N)
    DURATION=$((($END_TIME - $START_TIME) / 1000000)) # Convert to milliseconds

    if [ $DURATION -lt 2000 ]; then
        print_status "PASS" "CLI startup time: ${DURATION}ms (< 2s)"
    else
        print_status "WARN" "CLI startup time: ${DURATION}ms (slow)"
    fi
else
    print_status "FAIL" "CLI failed to run"
fi

echo ""

# 2. Check Core Backend
echo -e "${BLUE}[2/6] Checking Core Backend...${NC}"
cd /home/macoding/blokko-internal-os/varity/packages/varity-core-backend

if [ -f "package.json" ]; then
    print_status "PASS" "Core backend package.json exists"

    if [ -d "node_modules" ]; then
        print_status "PASS" "Core backend dependencies installed"
    else
        print_status "FAIL" "Core backend dependencies not installed"
    fi

    # Try to build
    if npm run build > /dev/null 2>&1; then
        print_status "PASS" "Core backend builds successfully"
    else
        print_status "FAIL" "Core backend build failed"
    fi
else
    print_status "FAIL" "Core backend package.json not found"
fi

echo ""

# 3. Check API Server
echo -e "${BLUE}[3/6] Checking API Server...${NC}"
cd /home/macoding/blokko-internal-os/varity/packages/varity-api-server

if [ -f "package.json" ]; then
    print_status "PASS" "API server package.json exists"

    if [ -d "node_modules" ]; then
        print_status "PASS" "API server dependencies installed"
    else
        print_status "FAIL" "API server dependencies not installed"
    fi

    # Check for .env.example
    if [ -f ".env.example" ]; then
        print_status "PASS" ".env.example exists"
    else
        print_status "WARN" ".env.example not found"
    fi

    # Try to build
    if npm run build > /dev/null 2>&1; then
        print_status "PASS" "API server builds successfully"
    else
        print_status "FAIL" "API server build failed"
    fi

    # Check for TypeScript errors (excluding REFERENCE files)
    TS_ERRORS=$(npx tsc --noEmit 2>&1 | grep -v "REFERENCE" | grep "error TS" | wc -l)
    if [ "$TS_ERRORS" -eq 0 ]; then
        print_status "PASS" "No TypeScript errors (excluding REFERENCE files)"
    else
        print_status "WARN" "$TS_ERRORS TypeScript errors found"
    fi
else
    print_status "FAIL" "API server package.json not found"
fi

echo ""

# 4. Check pnpm workspace
echo -e "${BLUE}[4/6] Checking pnpm workspace...${NC}"
cd /home/macoding/blokko-internal-os/varity

if command -v pnpm &> /dev/null; then
    PNPM_VERSION=$(pnpm --version)
    print_status "PASS" "pnpm installed: v$PNPM_VERSION"
else
    print_status "FAIL" "pnpm not installed"
fi

if [ -f "pnpm-workspace.yaml" ]; then
    print_status "PASS" "pnpm workspace configured"
else
    print_status "WARN" "pnpm-workspace.yaml not found"
fi

if [ -d "node_modules" ]; then
    print_status "PASS" "Workspace dependencies installed"
else
    print_status "WARN" "Workspace dependencies not installed"
fi

echo ""

# 5. Check Python environment
echo -e "${BLUE}[5/6] Checking Python environment...${NC}"

PYTHON_VERSION=$(python3 --version 2>&1 | awk '{print $2}')
print_status "INFO" "Python version: $PYTHON_VERSION"

# Check required Python packages
cd /home/macoding/blokko-internal-os/varity/varietykit-cli

if python3 -c "import click" 2>/dev/null; then
    print_status "PASS" "click package installed"
else
    print_status "WARN" "click package not installed"
fi

if python3 -c "import rich" 2>/dev/null; then
    print_status "PASS" "rich package installed"
else
    print_status "WARN" "rich package not installed"
fi

echo ""

# 6. Check Node.js environment
echo -e "${BLUE}[6/6] Checking Node.js environment...${NC}"

NODE_VERSION=$(node --version)
print_status "INFO" "Node.js version: $NODE_VERSION"

NPM_VERSION=$(npm --version)
print_status "INFO" "npm version: $NPM_VERSION"

# Check if Node version is >= 16
NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
if [ "$NODE_MAJOR" -ge 16 ]; then
    print_status "PASS" "Node.js version >= 16"
else
    print_status "FAIL" "Node.js version < 16 (upgrade required)"
fi

echo ""

# Summary
echo -e "${BLUE}=================================="
echo -e "📊 Health Check Summary"
echo -e "==================================${NC}\n"

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed!${NC}"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  ${WARNINGS} warning(s) found${NC}"
    exit 0
else
    echo -e "${RED}❌ ${ERRORS} error(s) and ${WARNINGS} warning(s) found${NC}"
    exit 1
fi
