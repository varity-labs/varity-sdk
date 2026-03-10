#!/bin/bash

# Varity DB Proxy Test Script
# Tests all CRUD operations and schema isolation

set -e

BASE_URL="http://localhost:3001"
APP_ID_1="test_app_123"
APP_ID_2="test_app_456"

echo "╔════════════════════════════════════════════════════════════╗"
echo "║         VARITY DATABASE PROXY - TEST SUITE                 ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Health Check
echo -e "${YELLOW}[1/8] Testing health endpoint...${NC}"
HEALTH=$(curl -s $BASE_URL/health)
if echo "$HEALTH" | grep -q "healthy"; then
  echo -e "${GREEN}✓ Health check passed${NC}"
else
  echo -e "${RED}✗ Health check failed${NC}"
  exit 1
fi
echo ""

# Test 2: Generate Token for App 1
echo -e "${YELLOW}[2/8] Generating JWT for app 1...${NC}"
TOKEN_RESPONSE_1=$(curl -s -X POST $BASE_URL/generate-token \
  -H "Content-Type: application/json" \
  -d "{\"appId\": \"$APP_ID_1\"}")

TOKEN_1=$(echo $TOKEN_RESPONSE_1 | grep -o '"token":"[^"]*"' | sed 's/"token":"\([^"]*\)"/\1/')

if [ -z "$TOKEN_1" ]; then
  echo -e "${RED}✗ Failed to generate token${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Token generated for app 1${NC}"
echo "  App ID: $APP_ID_1"
echo "  Token: ${TOKEN_1:0:50}..."
echo ""

# Test 3: Insert Document
echo -e "${YELLOW}[3/8] Inserting document...${NC}"
INSERT_RESPONSE=$(curl -s -X POST $BASE_URL/db/products/add \
  -H "Authorization: Bearer $TOKEN_1" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test T-Shirt", "price": 29.99, "stock": 100}')

if echo "$INSERT_RESPONSE" | grep -q "success.*true"; then
  PRODUCT_ID=$(echo $INSERT_RESPONSE | grep -o '"id":"[^"]*"' | sed 's/"id":"\([^"]*\)"/\1/')
  echo -e "${GREEN}✓ Document inserted${NC}"
  echo "  ID: $PRODUCT_ID"
  echo "  Data: Test T-Shirt, \$29.99"
else
  echo -e "${RED}✗ Insert failed${NC}"
  echo "$INSERT_RESPONSE"
  exit 1
fi
echo ""

# Test 4: Query Documents
echo -e "${YELLOW}[4/8] Querying documents...${NC}"
QUERY_RESPONSE=$(curl -s "$BASE_URL/db/products/get?limit=10" \
  -H "Authorization: Bearer $TOKEN_1")

if echo "$QUERY_RESPONSE" | grep -q "Test T-Shirt"; then
  COUNT=$(echo $QUERY_RESPONSE | grep -o '"id":"[^"]*"' | wc -l)
  echo -e "${GREEN}✓ Query successful${NC}"
  echo "  Found $COUNT document(s)"
else
  echo -e "${RED}✗ Query failed${NC}"
  echo "$QUERY_RESPONSE"
  exit 1
fi
echo ""

# Test 5: Update Document
echo -e "${YELLOW}[5/8] Updating document...${NC}"
UPDATE_RESPONSE=$(curl -s -X PUT "$BASE_URL/db/products/update/$PRODUCT_ID" \
  -H "Authorization: Bearer $TOKEN_1" \
  -H "Content-Type: application/json" \
  -d '{"name": "Updated T-Shirt", "price": 24.99, "stock": 150}')

if echo "$UPDATE_RESPONSE" | grep -q "Updated T-Shirt"; then
  echo -e "${GREEN}✓ Document updated${NC}"
  echo "  New name: Updated T-Shirt"
  echo "  New price: \$24.99"
else
  echo -e "${RED}✗ Update failed${NC}"
  echo "$UPDATE_RESPONSE"
  exit 1
fi
echo ""

# Test 6: Schema Isolation - Create second app
echo -e "${YELLOW}[6/8] Testing schema isolation...${NC}"

# Generate token for app 2
TOKEN_RESPONSE_2=$(curl -s -X POST $BASE_URL/generate-token \
  -H "Content-Type: application/json" \
  -d "{\"appId\": \"$APP_ID_2\"}")

TOKEN_2=$(echo $TOKEN_RESPONSE_2 | grep -o '"token":"[^"]*"' | sed 's/"token":"\([^"]*\)"/\1/')

# Insert document in app 2
INSERT_RESPONSE_2=$(curl -s -X POST $BASE_URL/db/products/add \
  -H "Authorization: Bearer $TOKEN_2" \
  -H "Content-Type: application/json" \
  -d '{"name": "App 2 Product", "price": 99.99}')

# Query app 2 - should only see its own data
QUERY_APP_2=$(curl -s "$BASE_URL/db/products/get" \
  -H "Authorization: Bearer $TOKEN_2")

# Query app 1 - should only see app 1 data
QUERY_APP_1=$(curl -s "$BASE_URL/db/products/get" \
  -H "Authorization: Bearer $TOKEN_1")

APP_1_HAS_APP_2_DATA=$(echo "$QUERY_APP_1" | grep -c "App 2 Product" || true)
APP_2_HAS_APP_1_DATA=$(echo "$QUERY_APP_2" | grep -c "Updated T-Shirt" || true)

if [ "$APP_1_HAS_APP_2_DATA" -eq 0 ] && [ "$APP_2_HAS_APP_1_DATA" -eq 0 ]; then
  echo -e "${GREEN}✓ Schema isolation verified${NC}"
  echo "  App 1 cannot see App 2's data"
  echo "  App 2 cannot see App 1's data"
else
  echo -e "${RED}✗ Schema isolation failed${NC}"
  echo "  Apps can see each other's data!"
  exit 1
fi
echo ""

# Test 7: Delete Document
echo -e "${YELLOW}[7/8] Deleting document...${NC}"
DELETE_RESPONSE=$(curl -s -X DELETE "$BASE_URL/db/products/delete/$PRODUCT_ID" \
  -H "Authorization: Bearer $TOKEN_1")

if echo "$DELETE_RESPONSE" | grep -q "\"deleted\":true"; then
  echo -e "${GREEN}✓ Document deleted${NC}"
  echo "  ID: $PRODUCT_ID"
else
  echo -e "${RED}✗ Delete failed${NC}"
  echo "$DELETE_RESPONSE"
  exit 1
fi
echo ""

# Test 8: Verify Deletion
echo -e "${YELLOW}[8/8] Verifying deletion...${NC}"
VERIFY_RESPONSE=$(curl -s "$BASE_URL/db/products/get" \
  -H "Authorization: Bearer $TOKEN_1")

if echo "$VERIFY_RESPONSE" | grep -q "$PRODUCT_ID"; then
  echo -e "${RED}✗ Document still exists after deletion${NC}"
  exit 1
else
  echo -e "${GREEN}✓ Document successfully deleted${NC}"
fi
echo ""

echo "╔════════════════════════════════════════════════════════════╗"
echo "║                  ALL TESTS PASSED! ✓                       ║"
echo "╠════════════════════════════════════════════════════════════╣"
echo "║  - Health check                                            ║"
echo "║  - Token generation                                        ║"
echo "║  - Document insert                                         ║"
echo "║  - Document query                                          ║"
echo "║  - Document update                                         ║"
echo "║  - Schema isolation                                        ║"
echo "║  - Document delete                                         ║"
echo "║  - Deletion verification                                   ║"
echo "╠════════════════════════════════════════════════════════════╣"
echo "║  Varity DB Proxy is fully operational!                     ║"
echo "╚════════════════════════════════════════════════════════════╝"
