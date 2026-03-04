#!/bin/bash
set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🧪 Testing IPFS Node${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

IPFS_API="http://localhost:5001"
IPFS_GATEWAY="http://localhost:8081"
TESTS_PASSED=0
TESTS_FAILED=0

run_test() {
  local description=$1
  shift
  local command="$@"

  echo -ne "${YELLOW}Testing: $description...${NC}"

  if eval "$command" > /dev/null 2>&1; then
    echo -e "\r${GREEN}✅ $description${NC}                    "
    ((TESTS_PASSED++))
    return 0
  else
    echo -e "\r${RED}❌ $description${NC}                    "
    ((TESTS_FAILED++))
    return 1
  fi
}

# Test 1: IPFS version
run_test "Get IPFS version" "curl -sf $IPFS_API/api/v0/version"

# Test 2: IPFS ID
run_test "Get IPFS node ID" "curl -sf $IPFS_API/api/v0/id"

# Test 3: Add file to IPFS
echo "Test file content" > /tmp/test-ipfs-file.txt
CID=$(curl -sf -F "file=@/tmp/test-ipfs-file.txt" "$IPFS_API/api/v0/add?cid-version=1" | grep -o '"Hash":"[^"]*' | cut -d'"' -f4)

if [ -n "$CID" ]; then
  echo -e "${GREEN}✅ Upload file to IPFS${NC}"
  ((TESTS_PASSED++))

  # Test 4: Retrieve file from IPFS
  run_test "Retrieve file from IPFS" "curl -sf $IPFS_GATEWAY/ipfs/$CID"

  # Test 5: Pin file
  run_test "Pin file" "curl -sf -X POST $IPFS_API/api/v0/pin/add?arg=$CID"

  # Test 6: Check pin status
  run_test "Check pin status" "curl -sf -X POST $IPFS_API/api/v0/pin/ls?arg=$CID"
else
  echo -e "${RED}❌ Upload file to IPFS${NC}"
  ((TESTS_FAILED++))
fi

# Test 7: Add JSON to IPFS
JSON_DATA='{"test": "data", "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"}'
JSON_CID=$(echo "$JSON_DATA" | curl -sf -F "file=@-" "$IPFS_API/api/v0/add?cid-version=1" | grep -o '"Hash":"[^"]*' | cut -d'"' -f4)

if [ -n "$JSON_CID" ]; then
  echo -e "${GREEN}✅ Upload JSON to IPFS${NC}"
  ((TESTS_PASSED++))
else
  echo -e "${RED}❌ Upload JSON to IPFS${NC}"
  ((TESTS_FAILED++))
fi

# Test 8: Get stats
run_test "Get repo stats" "curl -sf $IPFS_API/api/v0/stats/repo"

# Cleanup
rm -f /tmp/test-ipfs-file.txt

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}Tests Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Tests Failed: $TESTS_FAILED${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ All IPFS tests passed!${NC}"
  exit 0
else
  echo -e "${RED}❌ Some tests failed${NC}"
  exit 1
fi
