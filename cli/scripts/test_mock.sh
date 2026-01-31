#!/bin/bash

#
# Mock Test Script for IPFS Uploader
# Tests the script functionality without making actual IPFS uploads
#

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
CLI_DIR="$(dirname "$SCRIPT_DIR")"

echo "=================================================="
echo "  IPFS Uploader - Mock Test Suite"
echo "=================================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Helper function to run test
run_test() {
    local test_name="$1"
    local test_cmd="$2"
    local expected_exit="$3"

    echo -n "Test: $test_name... "

    if eval "$test_cmd" > /dev/null 2>&1; then
        actual_exit=0
    else
        actual_exit=$?
    fi

    if [ "$actual_exit" -eq "$expected_exit" ]; then
        echo -e "${GREEN}PASS${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}FAIL${NC} (expected exit $expected_exit, got $actual_exit)"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
}

# Test 1: Script exists and is executable
echo "=== Basic Tests ==="
run_test "Script exists" "test -f $SCRIPT_DIR/upload_to_ipfs.js" 0
run_test "Script is executable" "test -x $SCRIPT_DIR/upload_to_ipfs.js" 0

# Test 2: Node.js is installed
run_test "Node.js is installed" "node --version" 0

# Test 3: Dependencies are installed
run_test "node_modules exists" "test -d $SCRIPT_DIR/node_modules" 0
run_test "thirdweb installed" "test -d $SCRIPT_DIR/node_modules/thirdweb" 0

# Test 4: Script shows usage when called without args
echo ""
echo "=== Usage Tests ==="
OUTPUT=$(node "$SCRIPT_DIR/upload_to_ipfs.js" 2>&1 || true)
if echo "$OUTPUT" | grep -q "Usage:"; then
    echo -e "Test: Shows usage message... ${GREEN}PASS${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "Test: Shows usage message... ${RED}FAIL${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

# Test 5: Script fails gracefully with nonexistent directory
echo ""
echo "=== Error Handling Tests ==="
ERROR_OUTPUT=$(node "$SCRIPT_DIR/upload_to_ipfs.js" /nonexistent/path fake_id 2>&1 || true)
if echo "$ERROR_OUTPUT" | grep -q '"success":false'; then
    echo -e "Test: Handles nonexistent directory... ${GREEN}PASS${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "Test: Handles nonexistent directory... ${RED}FAIL${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

if echo "$ERROR_OUTPUT" | grep -q 'Directory not found'; then
    echo -e "Test: Shows correct error message... ${GREEN}PASS${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "Test: Shows correct error message... ${RED}FAIL${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

# Test 6: Test fixtures exist
echo ""
echo "=== Test Fixtures ==="
run_test "Test fixtures directory exists" "test -d $CLI_DIR/tests/fixtures/simple-site" 0
run_test "index.html exists" "test -f $CLI_DIR/tests/fixtures/simple-site/index.html" 0
run_test "styles.css exists" "test -f $CLI_DIR/tests/fixtures/simple-site/styles.css" 0
run_test "app.js exists" "test -f $CLI_DIR/tests/fixtures/simple-site/app.js" 0

# Test 7: Python module exists
echo ""
echo "=== Python Module Tests ==="
run_test "ipfs_uploader.py exists" "test -f $CLI_DIR/varietykit/core/ipfs_uploader.py" 0
run_test "test_ipfs_uploader.py exists" "test -f $CLI_DIR/tests/test_ipfs_uploader.py" 0

# Test 8: Python module can be imported (if Python available)
if command -v python3 &> /dev/null; then
    echo ""
    echo "=== Python Import Tests ==="

    cd "$CLI_DIR"
    IMPORT_TEST=$(python3 -c "from varietykit.core.ipfs_uploader import IPFSUploader; print('OK')" 2>&1 || echo "FAIL")

    if [ "$IMPORT_TEST" = "OK" ]; then
        echo -e "Test: Import IPFSUploader... ${GREEN}PASS${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "Test: Import IPFSUploader... ${RED}FAIL${NC}"
        echo "  Error: $IMPORT_TEST"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
fi

# Test 9: Script with test fixtures (will fail on upload but test input validation)
echo ""
echo "=== Input Validation Tests ==="
OUTPUT=$(node "$SCRIPT_DIR/upload_to_ipfs.js" "$CLI_DIR/tests/fixtures/simple-site" fake_client_id 2>&1 || true)

if echo "$OUTPUT" | grep -q '"success":false'; then
    echo -e "Test: Returns JSON on failure... ${GREEN}PASS${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "Test: Returns JSON on failure... ${RED}FAIL${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

if echo "$OUTPUT" | grep -q 'Uploading 3 files to IPFS'; then
    echo -e "Test: Detects correct file count... ${GREEN}PASS${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "Test: Detects correct file count... ${RED}FAIL${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

# Summary
echo ""
echo "=================================================="
echo "  Test Results"
echo "=================================================="
echo -e "Tests Passed: ${GREEN}${TESTS_PASSED}${NC}"
echo -e "Tests Failed: ${RED}${TESTS_FAILED}${NC}"
echo "Total Tests: $((TESTS_PASSED + TESTS_FAILED))"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Set THIRDWEB_CLIENT_ID environment variable"
    echo "2. Run: node upload_to_ipfs.js tests/fixtures/simple-site"
    echo "3. Verify gateway URL loads in browser"
    exit 0
else
    echo -e "${RED}✗ Some tests failed${NC}"
    exit 1
fi
