#!/bin/bash
set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🧪 Testing API Servers (Pinata Mock + Akash)${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

PINATA_URL="http://localhost:3002"
AKASH_URL="http://localhost:3003"
TESTS_PASSED=0
TESTS_FAILED=0

run_test() {
  local description=$1
  local url=$2

  echo -ne "${YELLOW}Testing: $description...${NC}"

  response=$(curl -sf "$url" 2>&1)

  if [ $? -eq 0 ]; then
    echo -e "\r${GREEN}✅ $description${NC}                    "
    ((TESTS_PASSED++))
    return 0
  else
    echo -e "\r${RED}❌ $description${NC}                    "
    echo "   Response: $response"
    ((TESTS_FAILED++))
    return 1
  fi
}

# Pinata Mock Tests
echo -e "${CYAN}📌 Pinata Mock Server Tests:${NC}"
echo ""

# Test 1: Health check
run_test "Pinata health check" "$PINATA_URL/health"

# Test 2: Authentication test
run_test "Pinata authentication" "$PINATA_URL/data/testAuthentication"

# Test 3: Pin list
run_test "Pinata pin list" "$PINATA_URL/data/pinList"

# Test 4: Stats
run_test "Pinata stats" "$PINATA_URL/stats"

# Test 5: Upload JSON
echo -ne "${YELLOW}Testing: Upload JSON to Pinata...${NC}"
JSON_RESPONSE=$(curl -sf -X POST "$PINATA_URL/pinning/pinJSONToIPFS" \
  -H "Content-Type: application/json" \
  -d '{"pinataContent": {"test": "data"}, "pinataMetadata": {"name": "test-json"}}' 2>&1)

if echo "$JSON_RESPONSE" | grep -q "IpfsHash"; then
  IPFS_HASH=$(echo "$JSON_RESPONSE" | grep -o '"IpfsHash":"[^"]*' | cut -d'"' -f4)
  echo -e "\r${GREEN}✅ Upload JSON to Pinata (CID: ${IPFS_HASH:0:20}...)${NC}                    "
  ((TESTS_PASSED++))
else
  echo -e "\r${RED}❌ Upload JSON to Pinata${NC}                    "
  ((TESTS_FAILED++))
fi

echo ""
echo -e "${CYAN}🚀 Akash Simulator Tests:${NC}"
echo ""

# Test 6: Akash health check
run_test "Akash health check" "$AKASH_URL/health"

# Test 7: Akash stats
run_test "Akash stats" "$AKASH_URL/stats"

# Test 8: List deployments
run_test "Akash list deployments" "$AKASH_URL/deployments"

# Test 9: LLM inference
echo -ne "${YELLOW}Testing: LLM inference...${NC}"
LLM_RESPONSE=$(curl -sf -X POST "$AKASH_URL/compute/run-model" \
  -H "Content-Type: application/json" \
  -d '{"model": "gemini-2.5-flash-mock", "prompt": "What is PCI compliance?", "industry": "iso-merchant"}' 2>&1)

if echo "$LLM_RESPONSE" | grep -q "response"; then
  echo -e "\r${GREEN}✅ LLM inference${NC}                    "
  ((TESTS_PASSED++))
else
  echo -e "\r${RED}❌ LLM inference${NC}                    "
  echo "   Response: $LLM_RESPONSE"
  ((TESTS_FAILED++))
fi

# Test 10: Create deployment
echo -ne "${YELLOW}Testing: Create Akash deployment...${NC}"
DEPLOY_RESPONSE=$(curl -sf -X POST "$AKASH_URL/deploy" \
  -H "Content-Type: application/json" \
  -d '{"name": "test-app", "image": "nginx:latest", "resources": {"cpu": 1, "memory": 512}}' 2>&1)

if echo "$DEPLOY_RESPONSE" | grep -q "deployment_id"; then
  DEPLOYMENT_ID=$(echo "$DEPLOY_RESPONSE" | grep -o '"deployment_id":"[^"]*' | cut -d'"' -f4)
  echo -e "\r${GREEN}✅ Create Akash deployment (ID: $DEPLOYMENT_ID)${NC}                    "
  ((TESTS_PASSED++))

  # Wait for deployment to be running
  sleep 3

  # Test 11: Get deployment status
  run_test "Get deployment status" "$AKASH_URL/deployment/$DEPLOYMENT_ID"
else
  echo -e "\r${RED}❌ Create Akash deployment${NC}                    "
  ((TESTS_FAILED++))
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}Tests Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Tests Failed: $TESTS_FAILED${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ All API tests passed!${NC}"
  exit 0
else
  echo -e "${RED}❌ Some tests failed${NC}"
  exit 1
fi
