# VarietyKit Scripts

Node.js bridge scripts for VarietyKit CLI. These scripts provide integration between the Python CLI and TypeScript/JavaScript SDKs.

## Overview

The VarietyKit CLI is written in Python, but some functionality requires TypeScript/JavaScript libraries (like thirdweb SDK). These bridge scripts provide the interface between Python and Node.js.

## Scripts

### upload_to_ipfs.js

Uploads directories to IPFS using thirdweb Storage SDK.

**Usage:**

```bash
node upload_to_ipfs.js <directory> [thirdweb_client_id]
```

**Arguments:**

- `directory` - Path to directory to upload (required)
- `thirdweb_client_id` - thirdweb client ID (optional, uses `THIRDWEB_CLIENT_ID` env var if not provided)

**Output (JSON to stdout):**

```json
{
  "success": true,
  "cid": "QmXxx...",
  "gatewayUrl": "https://ipfs.io/ipfs/QmXxx...",
  "thirdwebUrl": "https://QmXxx....ipfscdn.io",
  "files": ["index.html", "assets/app.js", "..."],
  "totalSize": 1234567,
  "fileCount": 42,
  "uploadTime": 2500
}
```

**Error Output (JSON to stderr):**

```json
{
  "success": false,
  "error": "Error message",
  "stack": "Stack trace..."
}
```

**Examples:**

```bash
# Upload with environment variable
export THIRDWEB_CLIENT_ID="your_client_id"
node upload_to_ipfs.js ./build

# Upload with client ID argument
node upload_to_ipfs.js ./out abc123xyz

# Test with example site
node upload_to_ipfs.js ../tests/fixtures/simple-site
```

## Installation

Install dependencies:

```bash
cd cli/scripts
npm install
```

This installs:
- `thirdweb` (v5.117.2+) - For IPFS uploads via thirdweb Storage

## Requirements

- Node.js 18 or higher
- thirdweb client ID (get from https://thirdweb.com/dashboard)

## Python Integration

The Python CLI uses `IPFSUploader` class to call these scripts:

```python
from varietykit.core.ipfs_uploader import IPFSUploader

# Initialize uploader
uploader = IPFSUploader()

# Upload directory
result = uploader.upload('./build')

print(f"Uploaded to IPFS: {result.gateway_url}")
print(f"CID: {result.cid}")
print(f"Files: {result.file_count}")
```

See `varietykit/core/ipfs_uploader.py` for full API documentation.

## Supported File Types

The upload script automatically detects and sets correct MIME types for:

- **Web**: HTML, CSS, JavaScript, JSON
- **Images**: PNG, JPG, GIF, SVG, WebP, ICO
- **Fonts**: WOFF, WOFF2, TTF, OTF
- **Media**: MP4, WebM, MP3, WAV
- **Documents**: PDF, TXT, XML, ZIP

## Error Handling

The script handles common errors:

1. **Directory not found** - Returns error if directory doesn't exist
2. **Empty directory** - Returns error if no files found
3. **Missing client ID** - Returns error if THIRDWEB_CLIENT_ID not set
4. **Upload timeout** - Python wrapper has 5-minute timeout
5. **Network errors** - Returns error with details

## Testing

Test the upload script directly:

```bash
# Test with example site
node upload_to_ipfs.js ../tests/fixtures/simple-site $THIRDWEB_CLIENT_ID
```

Run Python tests:

```bash
cd cli
pytest tests/test_ipfs_uploader.py -v
```

Run integration test (requires THIRDWEB_CLIENT_ID):

```bash
THIRDWEB_CLIENT_ID=your_id pytest tests/test_ipfs_uploader.py::TestIPFSUploaderIntegration::test_upload_real -v
```

## Architecture

```
Python CLI (varietykit)
    ↓
IPFSUploader (Python)
    ↓ subprocess.run()
upload_to_ipfs.js (Node.js)
    ↓
thirdweb Storage SDK (TypeScript)
    ↓
IPFS Network
```

**Why this architecture?**

1. **Python CLI** - Main CLI is Python for ease of use and distribution
2. **Node.js Bridge** - Some SDKs (thirdweb) are TypeScript-only
3. **JSON Communication** - Simple, language-agnostic data exchange
4. **Error Isolation** - Node.js errors don't crash Python process

## Troubleshooting

### "Node.js not found"

Install Node.js 18 or higher from https://nodejs.org/

```bash
# Check Node.js version
node --version
# Should be v18.0.0 or higher
```

### "THIRDWEB_CLIENT_ID required"

Get your client ID from thirdweb dashboard:

1. Go to https://thirdweb.com/dashboard
2. Create or select a project
3. Copy the Client ID
4. Set as environment variable:

```bash
export THIRDWEB_CLIENT_ID="your_client_id_here"
```

### "Cannot find module 'thirdweb'"

Install dependencies:

```bash
cd cli/scripts
npm install
```

### "Upload timeout"

The upload has a 5-minute timeout. If uploading large directories:

1. Check your internet connection
2. Try uploading smaller directory
3. Compress large assets
4. Check thirdweb service status

### "Invalid JSON response"

This usually means the Node.js script crashed. Check:

1. Node.js version (must be 18+)
2. Dependencies installed (`npm install`)
3. Valid directory path
4. Valid client ID

## Development

To modify the upload script:

1. Edit `upload_to_ipfs.js`
2. Test with: `node upload_to_ipfs.js <test_dir> $THIRDWEB_CLIENT_ID`
3. Verify JSON output is valid
4. Run Python tests: `pytest tests/test_ipfs_uploader.py`

## License

MIT License - See LICENSE file in repository root
