#!/bin/bash

# Varity S3 Gateway - API Test Script
# Tests the S3-compatible API using AWS CLI

set -e

ENDPOINT="http://localhost:3001"
BUCKET="test-bucket-$(date +%s)"
TEST_FILE="test-file.txt"

echo "============================================"
echo "Varity S3 Gateway - API Test"
echo "============================================"
echo ""
echo "Endpoint: $ENDPOINT"
echo "Bucket:   $BUCKET"
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "Error: AWS CLI is not installed"
    echo "Please install AWS CLI from https://aws.amazon.com/cli/"
    exit 1
fi

# Check if server is running
echo "Checking if server is running..."
if ! curl -s "$ENDPOINT/health" > /dev/null; then
    echo "Error: Server is not running at $ENDPOINT"
    echo "Please start the server with: npm run dev"
    exit 1
fi
echo "✓ Server is running"
echo ""

# Create test file
echo "Creating test file..."
echo "Hello from Varity S3 Gateway!" > "$TEST_FILE"
echo "✓ Test file created"
echo ""

# Test 1: Create bucket
echo "Test 1: Create bucket"
aws s3 mb "s3://$BUCKET" --endpoint-url "$ENDPOINT" || true
echo "✓ Bucket created"
echo ""

# Test 2: Upload object
echo "Test 2: Upload object"
aws s3 cp "$TEST_FILE" "s3://$BUCKET/" --endpoint-url "$ENDPOINT"
echo "✓ Object uploaded"
echo ""

# Test 3: List objects
echo "Test 3: List objects"
aws s3 ls "s3://$BUCKET/" --endpoint-url "$ENDPOINT"
echo "✓ Objects listed"
echo ""

# Test 4: Download object
echo "Test 4: Download object"
aws s3 cp "s3://$BUCKET/$TEST_FILE" "downloaded-$TEST_FILE" --endpoint-url "$ENDPOINT"
echo "✓ Object downloaded"
echo ""

# Verify content
echo "Verifying downloaded content..."
if diff "$TEST_FILE" "downloaded-$TEST_FILE" > /dev/null; then
    echo "✓ Content verified - files match!"
else
    echo "✗ Content mismatch!"
    exit 1
fi
echo ""

# Test 5: Delete object
echo "Test 5: Delete object"
aws s3 rm "s3://$BUCKET/$TEST_FILE" --endpoint-url "$ENDPOINT"
echo "✓ Object deleted"
echo ""

# Test 6: Delete bucket
echo "Test 6: Delete bucket"
aws s3 rb "s3://$BUCKET" --endpoint-url "$ENDPOINT"
echo "✓ Bucket deleted"
echo ""

# Cleanup
rm -f "$TEST_FILE" "downloaded-$TEST_FILE"

echo "============================================"
echo "All tests passed! ✓"
echo "============================================"
