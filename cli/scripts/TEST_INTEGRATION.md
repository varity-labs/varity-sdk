# IPFS Upload Bridge - Integration Testing Guide

This document provides step-by-step instructions for testing the IPFS Upload Bridge.

## Prerequisites

- [x] Node.js 18+ installed
- [x] thirdweb client ID (get from https://thirdweb.com/dashboard)
- [x] npm dependencies installed (`npm install` in this directory)

## Quick Test (No Upload)

Test the script setup without uploading to IPFS:

```bash
# Check script exists and shows usage
node upload_to_ipfs.js
# Should output: Usage: node upload_to_ipfs.js <directory> [thirdweb_client_id]

# Test with nonexistent directory (should fail gracefully)
node upload_to_ipfs.js /nonexistent/path fake_client_id
# Should output JSON error to stderr
```

## Test 1: Upload Test Fixture (Small)

Upload the simple test site (3 files, ~5KB):

```bash
# Set your thirdweb client ID
export THIRDWEB_CLIENT_ID="your_client_id_here"

# Upload test fixture
node upload_to_ipfs.js ../tests/fixtures/simple-site

# Expected output (JSON):
# {
#   "success": true,
#   "cid": "QmXxx...",
#   "gatewayUrl": "https://ipfs.io/ipfs/QmXxx...",
#   "thirdwebUrl": "https://QmXxx....ipfscdn.io",
#   "files": ["index.html", "styles.css", "app.js"],
#   "totalSize": 5432,
#   "fileCount": 3,
#   "uploadTime": 2500
# }

# Verify upload by visiting the gateway URL in your browser
```

**Success Criteria:**
- Returns JSON with `success: true`
- CID starts with "Qm" or "baf"
- Gateway URL loads in browser
- All 3 files accessible

## Test 2: Python Integration

Test the Python wrapper:

```bash
cd ..  # Go to cli directory

# Create test script
cat > test_ipfs.py << 'EOF'
from varietykit.core.ipfs_uploader import IPFSUploader

# Initialize uploader
uploader = IPFSUploader()

# Check dependencies
status = uploader.check_dependencies()
print(f"Node.js installed: {status['node_installed']}")
print(f"Script exists: {status['script_exists']}")
print(f"Client ID set: {status['client_id_set']}")

# Get directory info
fixture_dir = 'tests/fixtures/simple-site'
file_count = uploader.get_file_count(fixture_dir)
dir_size = uploader.get_directory_size(fixture_dir)
print(f"\nDirectory: {fixture_dir}")
print(f"Files: {file_count}")
print(f"Size: {uploader.format_size(dir_size)}")

# Upload to IPFS
print(f"\nUploading to IPFS...")
result = uploader.upload(fixture_dir)

print(f"\nSuccess: {result.success}")
print(f"CID: {result.cid}")
print(f"Gateway URL: {result.gateway_url}")
print(f"Files uploaded: {result.file_count}")
print(f"Total size: {uploader.format_size(result.total_size)}")
print(f"Upload time: {result.upload_time}ms")
EOF

# Run test
export THIRDWEB_CLIENT_ID="your_client_id_here"
python test_ipfs.py
```

**Success Criteria:**
- All dependencies check pass
- Upload completes successfully
- Returns valid CID and URLs
- Gateway URL accessible in browser

## Test 3: Upload Next.js Build

Test with a real Next.js static export:

```bash
# Create a minimal Next.js app
cd /tmp
npx create-next-app@latest test-ipfs-upload --use-npm --typescript --tailwind --app --no-src-dir

cd test-ipfs-upload

# Configure for static export
cat > next.config.js << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
}

module.exports = nextConfig
EOF

# Build
npm run build

# Upload to IPFS
cd /home/macoding/varity-workspace/varity-sdk/cli
export THIRDWEB_CLIENT_ID="your_client_id_here"
node scripts/upload_to_ipfs.js /tmp/test-ipfs-upload/out

# Visit the gateway URL to verify the site works
```

**Success Criteria:**
- Next.js build uploads successfully
- All pages load correctly at gateway URL
- Static assets (CSS, JS, images) load
- Navigation works

## Test 4: Upload Large Directory

Test with larger build output (~10MB+):

```bash
# Use generic-template-dashboard if available
cd /home/macoding/varity-workspace/varity-sdk/apps/submodules/generic-template-dashboard

# Build
npm install
npm run build

# Upload
cd /home/macoding/varity-workspace/varity-sdk/cli
export THIRDWEB_CLIENT_ID="your_client_id_here"
time node scripts/upload_to_ipfs.js /path/to/dashboard/out

# Monitor upload time and verify completion
```

**Success Criteria:**
- Large directory uploads without timeout
- Upload completes within 5 minutes
- Dashboard loads correctly at gateway URL
- All features work (login, wallet, etc.)

## Test 5: Error Handling

Test error cases:

```bash
# Test 1: Missing directory
node scripts/upload_to_ipfs.js /nonexistent/path test_id
# Expected: JSON error with "Directory not found"

# Test 2: Missing client ID
unset THIRDWEB_CLIENT_ID
node scripts/upload_to_ipfs.js tests/fixtures/simple-site
# Expected: JSON error with "THIRDWEB_CLIENT_ID required"

# Test 3: Empty directory
mkdir /tmp/empty-dir
node scripts/upload_to_ipfs.js /tmp/empty-dir test_id
# Expected: JSON error with "No files found"

# Test 4: File instead of directory
echo "test" > /tmp/test.txt
node scripts/upload_to_ipfs.js /tmp/test.txt test_id
# Expected: JSON error with "not a directory"
```

**Success Criteria:**
- All errors return JSON to stderr
- Error messages are clear and helpful
- No script crashes or unhandled exceptions

## Test 6: Run Python Unit Tests

Run the comprehensive test suite:

```bash
cd /home/macoding/varity-workspace/varity-sdk/cli

# Run all tests
pytest tests/test_ipfs_uploader.py -v

# Run specific test class
pytest tests/test_ipfs_uploader.py::TestIPFSUploader -v

# Run integration test (requires THIRDWEB_CLIENT_ID)
export THIRDWEB_CLIENT_ID="your_client_id_here"
pytest tests/test_ipfs_uploader.py::TestIPFSUploaderIntegration::test_upload_real -v -s
```

**Success Criteria:**
- All unit tests pass
- Integration test uploads successfully
- Test output shows valid CID and URLs

## Performance Benchmarks

Expected performance for different sizes:

| Directory Size | File Count | Expected Upload Time | Notes |
|----------------|------------|---------------------|-------|
| < 1 MB | < 50 | 2-5 seconds | Small sites |
| 1-5 MB | 50-200 | 5-15 seconds | Medium sites |
| 5-10 MB | 200-500 | 15-30 seconds | Large sites |
| 10-50 MB | 500-2000 | 30-120 seconds | Very large sites |
| > 50 MB | > 2000 | 2-5 minutes | Consider optimization |

## Troubleshooting

### Upload fails with "rate limit exceeded"

**Solution**: Upgrade to thirdweb Pro plan or wait for rate limit reset

### Upload very slow (> 5 minutes)

**Possible causes**:
1. Slow internet connection
2. Very large files
3. Many small files (>1000)

**Solutions**:
- Compress large assets
- Use build optimization
- Reduce bundle size

### Gateway URL not accessible

**Possible causes**:
1. IPFS propagation delay (wait 1-2 minutes)
2. CID not pinned correctly
3. Gateway temporarily down

**Solutions**:
- Wait and retry
- Try different gateway: `https://gateway.pinata.cloud/ipfs/{cid}`
- Try thirdweb gateway: `https://{cid}.ipfscdn.io`

### "Invalid JSON response" error

**Possible causes**:
1. Node.js script crashed
2. Invalid client ID
3. Network error

**Solutions**:
- Check Node.js version (must be 18+)
- Verify client ID is valid
- Check internet connection
- Review stderr output for details

## Success Checklist

After completing all tests, verify:

- [x] Script executes without errors
- [x] Small directory uploads successfully
- [x] Python wrapper works correctly
- [x] Next.js build uploads and loads
- [x] Large directory uploads without timeout
- [x] Error handling works as expected
- [x] Unit tests pass
- [x] Integration test passes
- [x] Gateway URLs accessible
- [x] Uploaded sites function correctly

## Next Steps

After successful testing:

1. Integrate with DeploymentOrchestrator (Agent 3)
2. Test with BuildManager output (Agent 1)
3. Add to `varietykit app deploy` command
4. Create deployment manifest with IPFS CID
5. Test full deployment flow end-to-end

## Getting Help

If you encounter issues:

1. Check the README.md in this directory
2. Review error messages in stderr
3. Check Node.js and npm versions
4. Verify thirdweb client ID is valid
5. Test with small directory first
6. Review thirdweb service status
