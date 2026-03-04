#!/bin/bash
set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOCALDEPIN_DIR="$(dirname "$SCRIPT_DIR")"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🧪 LocalDePin End-to-End Test Suite${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

run_test_suite() {
  local test_name=$1
  local test_script=$2

  echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${CYAN}Running: $test_name${NC}"
  echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""

  ((TOTAL_TESTS++))

  if bash "$test_script"; then
    echo -e "${GREEN}✅ $test_name passed${NC}"
    ((PASSED_TESTS++))
    echo ""
    return 0
  else
    echo -e "${RED}❌ $test_name failed${NC}"
    ((FAILED_TESTS++))
    echo ""
    return 1
  fi
}

# Check if LocalDePin is running
echo -e "${YELLOW}⚙️  Checking if LocalDePin network is running...${NC}"
if ! docker-compose -f "$LOCALDEPIN_DIR/docker-compose.yml" ps | grep -q "Up"; then
  echo -e "${RED}❌ LocalDePin network is not running${NC}"
  echo -e "${YELLOW}   Please run: ./scripts/start.sh${NC}"
  exit 1
fi
echo -e "${GREEN}✅ LocalDePin network is running${NC}"
echo ""

# Wait for services to be healthy
echo -e "${YELLOW}⏳ Waiting for services to be healthy...${NC}"
bash "$LOCALDEPIN_DIR/scripts/healthcheck.sh" --verbose
echo ""

# Run test suites
run_test_suite "Arbitrum L3 Node Tests" "$SCRIPT_DIR/test_arbitrum_node.sh"
run_test_suite "IPFS Node Tests" "$SCRIPT_DIR/test_ipfs_node.sh"
run_test_suite "API Server Tests" "$SCRIPT_DIR/test_api_server.sh"

# Comprehensive workflow test
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}Running: Full Deployment Workflow Test${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

((TOTAL_TESTS++))

# Step 1: Upload data to IPFS
echo -e "${YELLOW}Step 1: Upload deployment data to IPFS...${NC}"
DEPLOYMENT_DATA='{"company": "Test Corp", "industry": "iso-merchant", "template": "1.0.0"}'
IPFS_CID=$(echo "$DEPLOYMENT_DATA" | curl -sf -F "file=@-" "http://localhost:5001/api/v0/add?cid-version=1" | grep -o '"Hash":"[^"]*' | cut -d'"' -f4)

if [ -n "$IPFS_CID" ]; then
  echo -e "${GREEN}✅ Data uploaded to IPFS: $IPFS_CID${NC}"
else
  echo -e "${RED}❌ Failed to upload to IPFS${NC}"
  ((FAILED_TESTS++))
  exit 1
fi

# Step 2: Pin to Pinata Mock
echo -e "${YELLOW}Step 2: Pin data to Pinata Mock...${NC}"
PIN_RESPONSE=$(curl -sf -X POST "http://localhost:3002/pinning/pinJSONToIPFS" \
  -H "Content-Type: application/json" \
  -d "{\"pinataContent\": $DEPLOYMENT_DATA, \"pinataMetadata\": {\"name\": \"test-deployment\"}}")

if echo "$PIN_RESPONSE" | grep -q "IpfsHash"; then
  echo -e "${GREEN}✅ Data pinned successfully${NC}"
else
  echo -e "${RED}❌ Failed to pin data${NC}"
  ((FAILED_TESTS++))
  exit 1
fi

# Step 3: Deploy to Akash
echo -e "${YELLOW}Step 3: Deploy to Akash Simulator...${NC}"
DEPLOY_RESPONSE=$(curl -sf -X POST "http://localhost:3003/deploy" \
  -H "Content-Type: application/json" \
  -d '{"name": "test-dashboard", "image": "varity/iso-dashboard:latest", "resources": {"cpu": 2, "memory": 2048}}')

if echo "$DEPLOY_RESPONSE" | grep -q "deployment_id"; then
  DEPLOYMENT_ID=$(echo "$DEPLOY_RESPONSE" | grep -o '"deployment_id":"[^"]*' | cut -d'"' -f4)
  echo -e "${GREEN}✅ Deployed to Akash: $DEPLOYMENT_ID${NC}"
else
  echo -e "${RED}❌ Failed to deploy to Akash${NC}"
  ((FAILED_TESTS++))
  exit 1
fi

# Step 4: Run LLM inference
echo -e "${YELLOW}Step 4: Run LLM inference...${NC}"
LLM_RESPONSE=$(curl -sf -X POST "http://localhost:3003/compute/run-model" \
  -H "Content-Type: application/json" \
  -d '{"model": "gemini-2.5-flash-mock", "prompt": "Explain ISO merchant onboarding", "industry": "iso-merchant"}')

if echo "$LLM_RESPONSE" | grep -q "response"; then
  echo -e "${GREEN}✅ LLM inference successful${NC}"
else
  echo -e "${RED}❌ LLM inference failed${NC}"
  ((FAILED_TESTS++))
  exit 1
fi

# Step 5: Verify blockchain interaction
echo -e "${YELLOW}Step 5: Verify Arbitrum L3 blockchain...${NC}"
CHAIN_ID=$(curl -sf -X POST "http://localhost:8547" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' | grep -o '"result":"[^"]*' | cut -d'"' -f4)

if [ "$CHAIN_ID" == "0x66aee" ] || [ "$CHAIN_ID" == "0x66AEE" ]; then
  echo -e "${GREEN}✅ Blockchain verified (Chain ID: $CHAIN_ID)${NC}"
else
  echo -e "${RED}❌ Blockchain verification failed (Chain ID: $CHAIN_ID)${NC}"
  ((FAILED_TESTS++))
  exit 1
fi

echo -e "${GREEN}✅ Full deployment workflow test passed${NC}"
((PASSED_TESTS++))

# Final results
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📊 Test Results Summary${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}Total Test Suites: $TOTAL_TESTS${NC}"
echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
echo -e "${RED}Failed: $FAILED_TESTS${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
  echo -e "${GREEN}🎉 All end-to-end tests passed!${NC}"
  echo -e "${GREEN}LocalDePin network is fully operational${NC}"
  exit 0
else
  echo -e "${RED}❌ Some tests failed${NC}"
  echo -e "${YELLOW}Please check the logs for more details${NC}"
  exit 1
fi
