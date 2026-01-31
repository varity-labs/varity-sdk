#!/bin/bash
set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🧪 Testing Arbitrum L3 Node${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

RPC_URL="http://localhost:8547"
TESTS_PASSED=0
TESTS_FAILED=0

test_rpc() {
  local method=$1
  local params=$2
  local description=$3

  echo -ne "${YELLOW}Testing: $description...${NC}"

  response=$(curl -sf -X POST $RPC_URL \
    -H "Content-Type: application/json" \
    -d "{\"jsonrpc\":\"2.0\",\"method\":\"$method\",\"params\":$params,\"id\":1}" 2>&1)

  if [ $? -eq 0 ] && echo "$response" | grep -q "result"; then
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

# Test 1: Chain ID
test_rpc "eth_chainId" "[]" "Get chain ID"

# Test 2: Block number
test_rpc "eth_blockNumber" "[]" "Get current block number"

# Test 3: Network version
test_rpc "net_version" "[]" "Get network version"

# Test 4: Get balance
test_rpc "eth_getBalance" "[\"0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266\",\"latest\"]" "Get account balance"

# Test 5: Gas price
test_rpc "eth_gasPrice" "[]" "Get gas price"

# Test 6: Get accounts
test_rpc "eth_accounts" "[]" "Get accounts"

# Test 7: Get block by number
test_rpc "eth_getBlockByNumber" "[\"latest\",false]" "Get latest block"

# Test 8: Transaction count
test_rpc "eth_getTransactionCount" "[\"0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266\",\"latest\"]" "Get transaction count"

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}Tests Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Tests Failed: $TESTS_FAILED${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ All Arbitrum tests passed!${NC}"
  exit 0
else
  echo -e "${RED}❌ Some tests failed${NC}"
  exit 1
fi
