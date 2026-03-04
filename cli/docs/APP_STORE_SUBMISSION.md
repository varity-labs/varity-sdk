# App Store Submission Guide

**Status**: Phase 2 Complete - Auto-submission to Varity App Store
**Last Updated**: January 21, 2026
**Target Completion**: Week of January 26, 2026

---

## Overview

The Varity App Store submission system enables automatic submission of deployed applications to the Varity App Store smart contract. Instead of manually filling out forms, developers can deploy and submit their apps with a single command.

### Key Features

✅ **Automatic Metadata Extraction** - Reads app info from package.json
✅ **IPFS Asset Upload** - Uploads logos and screenshots automatically
✅ **Smart Contract Integration** - Submits directly to Varity App Store contract
✅ **thirdweb SDK** - Reliable transaction signing and submission
✅ **GitHub Integration** - Extracts repository URLs automatically

---

## Quick Start

### Prerequisites

1. **Deployed Application** - Your app must be deployed first
2. **Environment Variables** - Required configuration
3. **Package.json Configuration** - Add Varity metadata

### Required Environment Variables

```bash
# thirdweb client ID (for IPFS upload)
export THIRDWEB_CLIENT_ID="your_thirdweb_client_id"

# Developer wallet private key (for signing transactions)
export DEVELOPER_WALLET_KEY="0x..."

# Varity App Store contract address
export VARITY_APP_STORE_ADDRESS="0x..."

# Varity L3 RPC URL (default is Conduit testnet)
export VARITY_L3_RPC="https://rpc-varity-testnet-rroe52pwjp.t.conduit.xyz"
```

### Configure Package.json

Add a `varity` field to your package.json:

```json
{
  "name": "my-awesome-dapp",
  "version": "1.0.0",
  "description": "An awesome decentralized application built with Varity SDK",
  "repository": {
    "type": "git",
    "url": "https://github.com/user/my-awesome-dapp"
  },
  "varity": {
    "category": "DeFi",
    "logo": "public/logo.png",
    "screenshots": [
      "public/screenshots/dashboard.png",
      "public/screenshots/features.png"
    ]
  }
}
```

### Deploy and Submit

```bash
cd my-awesome-dapp

# Deploy to IPFS and auto-submit to App Store
varietykit app deploy --submit-to-store

# Output:
# 🚀 Starting deployment...
# 📦 Detecting project type...
#    Detected: nextjs
# 🔨 Building project (npm run build)...
#    Built 42 files (5.30 MB)
# ☁️  Uploading to IPFS...
#    CID: QmXx...
#    URL: https://ipfs.io/ipfs/QmXx...
# 📝 Submitting to App Store...
#    Name: My Awesome Dapp
#    Category: DeFi
#    Chain ID: 33529
#    ✅ App submitted successfully!
#    App ID: 42
#    Transaction: 0xABC...
#    📱 View at: https://store.varity.so/apps/42
# ✅ Deployment complete!
```

---

## Configuration Reference

### Varity Field in package.json

The `varity` field in package.json contains App Store-specific configuration:

```json
{
  "varity": {
    "category": "DeFi",           // Required: App category
    "logo": "public/logo.png",    // Required: Path to logo image
    "screenshots": [              // Optional: Array of screenshot paths
      "public/screenshots/1.png",
      "public/screenshots/2.png"
    ]
  }
}
```

#### Supported Categories

- **DeFi** - Decentralized Finance applications
- **Gaming** - Blockchain games and metaverse apps
- **NFT** - NFT marketplaces and galleries
- **DAO** - Decentralized Autonomous Organizations
- **Social** - Social networks and communication apps
- **Infrastructure** - Developer tools and infrastructure
- **Tooling** - Utilities and tooling
- **Other** - Miscellaneous applications

#### Logo Requirements

- **Format**: PNG, JPG, SVG
- **Size**: Recommended 512x512px or larger
- **Location**: Relative to project root (e.g., `public/logo.png`)
- **Upload**: Automatically uploaded to IPFS during submission

#### Screenshot Requirements

- **Format**: PNG, JPG
- **Size**: Recommended 1920x1080px or larger
- **Count**: Optional, but recommended (2-5 screenshots)
- **Location**: Relative to project root
- **Upload**: Automatically uploaded to IPFS

---

## Smart Contract Integration

### VarityAppStore Contract

The App Store is powered by a smart contract deployed on Varity L3 (Chain ID 33529).

**Contract ABI**:

```rust
struct App {
    id: u64,
    developer: Address,
    name: String,
    description: String,
    appUrl: String,
    logoUrl: String,
    githubUrl: String,
    category: String,
    chainId: u64,
    screenshotCount: u64,
    isApproved: bool,
    isActive: bool,
    builtWithVarity: bool,
    publishedAt: u64
}

fn submitApp(
    name: String,
    description: String,
    appUrl: String,
    logoUrl: String,
    githubUrl: String,
    category: String,
    screenshots: Vec<String>
) -> Result<u64, Error>;
```

### Submission Process

1. **Extract Metadata** - Read from package.json
2. **Upload Assets** - Upload logo and screenshots to IPFS
3. **Sign Transaction** - Sign with developer wallet
4. **Submit to Contract** - Call `submitApp()` function
5. **Wait for Confirmation** - Get app ID from transaction receipt
6. **Return URL** - Return App Store URL (https://store.varity.so/apps/42)

### Gas Sponsorship

App Store submissions on Varity L3 may be gas-sponsored for approved developers. Contact the Varity team for details.

---

## Programmatic Usage

### Using AppStoreClient Directly

```python
from varietykit.core.app_store import AppStoreClient, MetadataBuilder, AppMetadata

# Initialize client
client = AppStoreClient(
    contract_address="0x...",
    signer_key="0x...",
    network="varity"
)

# Build metadata from deployment
builder = MetadataBuilder()
metadata = builder.build_from_deployment(
    project_info=project_info,
    deployment_result={'frontend_url': 'https://ipfs.io/ipfs/QmXx...'},
    package_json_path='./package.json',
    chain_id=33529
)

# Submit to App Store
result = client.submit_app(metadata)

if result.success:
    print(f"App ID: {result.app_id}")
    print(f"Transaction: {result.tx_hash}")
    print(f"View at: {result.url}")
else:
    print(f"Submission failed: {result.error_message}")
```

### Manual Metadata Creation

```python
from varietykit.core.app_store import AppMetadata, AppStoreClient

# Create metadata manually
metadata = AppMetadata(
    name="My Awesome DApp",
    description="An awesome decentralized application",
    app_url="https://myapp.example.com",
    logo_url="https://ipfs.io/ipfs/QmLogo",
    github_url="https://github.com/user/repo",
    category="DeFi",
    screenshots=[
        "https://ipfs.io/ipfs/QmScreenshot1",
        "https://ipfs.io/ipfs/QmScreenshot2"
    ],
    chain_id=33529
)

# Validate metadata
metadata.validate()  # Raises MetadataValidationError if invalid

# Submit
client = AppStoreClient()
result = client.submit_app(metadata)
```

### Check App Status

```python
from varietykit.core.app_store import AppStoreClient

client = AppStoreClient()

# Get app status by ID
status = client.get_app_status(app_id=42)

if status:
    print(f"App: {status.name}")
    print(f"Developer: {status.developer}")
    print(f"Approved: {status.is_approved}")
    print(f"Active: {status.is_active}")
    print(f"Status: {status.status}")  # pending_approval, approved, rejected, inactive
```

---

## Deployment Manifest

After successful submission, the deployment manifest includes App Store information:

```json
{
  "version": "1.0",
  "deployment_id": "deploy-1737492000",
  "timestamp": "2026-01-22T10:00:00Z",
  "network": "varity",
  "project": {
    "type": "nextjs",
    "framework_version": "14.0.0",
    "build_command": "npm run build"
  },
  "build": {
    "success": true,
    "files": 42,
    "size_mb": 5.3
  },
  "ipfs": {
    "cid": "QmXx...",
    "gateway_url": "https://ipfs.io/ipfs/QmXx...",
    "thirdweb_url": "https://QmXx....ipfscdn.io"
  },
  "app_store": {
    "submitted": true,
    "app_id": 42,
    "tx_hash": "0xABC...",
    "url": "https://store.varity.so/apps/42",
    "status": "pending_approval"
  }
}
```

---

## Troubleshooting

### Common Errors

#### 1. Missing Environment Variables

**Error**: `ContractInteractionError: App Store contract address not provided`

**Solution**: Set required environment variables:
```bash
export VARITY_APP_STORE_ADDRESS="0x..."
export DEVELOPER_WALLET_KEY="0x..."
export THIRDWEB_CLIENT_ID="your_client_id"
```

#### 2. Invalid Metadata

**Error**: `MetadataValidationError: App name must be at least 3 characters`

**Solution**: Check your package.json:
- Ensure `name` is at least 3 characters
- Ensure `description` is at least 10 characters
- Ensure `varity.category` is a valid category

#### 3. Asset Upload Failed

**Error**: `AssetUploadError: Asset not found: public/logo.png`

**Solution**: Verify asset paths in package.json:
- Paths are relative to project root
- Files exist at the specified locations
- Supported formats: PNG, JPG, SVG

#### 4. Transaction Failed

**Error**: `TransactionError: Transaction reverted`

**Solutions**:
- Check wallet has sufficient funds for gas
- Verify contract address is correct
- Ensure network configuration is correct
- Try again (network congestion)

#### 5. Node.js Not Found

**Error**: `FileNotFoundError: [Errno 2] No such file or directory: 'node'`

**Solution**: Install Node.js 18+:
```bash
# macOS
brew install node

# Ubuntu/Debian
sudo apt install nodejs npm

# Verify installation
node --version  # Should be 18.0.0 or higher
```

### Debug Mode

Enable verbose logging:

```bash
# Set environment variable
export VARIETYKIT_VERBOSE=1

# Run deployment
varietykit app deploy --submit-to-store
```

### Check Dependencies

```python
from varietykit.core.app_store import AppStoreClient

client = AppStoreClient()
deps = client.check_dependencies()

print(f"Node.js installed: {deps['node_installed']}")
print(f"Contract address set: {deps['contract_address_set']}")
print(f"Signer key set: {deps['signer_key_set']}")
print(f"thirdweb client ID set: {deps['thirdweb_client_id_set']}")
```

---

## Manual Submission Fallback

If automatic submission fails, you can manually submit your app at:

**https://store.varity.so/submit**

You'll need:
- App name
- Description
- Category
- Deployed app URL (from deployment manifest)
- Logo URL (upload to IPFS manually)
- GitHub repository URL
- Screenshots (optional)

---

## Best Practices

### 1. Test Locally First

```bash
# Build and test locally
npm run build
npm run start

# Verify app works before deploying
```

### 2. Use High-Quality Assets

- **Logo**: 512x512px or larger, transparent background
- **Screenshots**: 1920x1080px, show key features
- **Repository**: Public GitHub repo with README

### 3. Write Clear Descriptions

```json
{
  "description": "A decentralized lending platform that allows users to lend and borrow crypto assets with competitive interest rates. Built with Varity SDK for seamless Web3 integration."
}
```

### 4. Choose Correct Category

- Review existing apps in each category
- Choose the most relevant category
- Contact support if unsure

### 5. Keep Wallet Secure

```bash
# NEVER commit wallet keys to git
echo ".env" >> .gitignore

# Store in .env file
cat > .env <<EOF
DEVELOPER_WALLET_KEY=0x...
EOF

# Load in shell
source .env
```

---

## Architecture

### Component Overview

```
DeploymentOrchestrator
    ↓
    ├─ MetadataBuilder
    │   ├─ Load package.json
    │   ├─ Extract app info
    │   ├─ Upload logo to IPFS
    │   └─ Upload screenshots to IPFS
    │
    └─ AppStoreClient
        ├─ Validate metadata
        ├─ Generate Node.js script
        ├─ Sign transaction (thirdweb SDK)
        └─ Submit to contract
```

### Technology Stack

- **Language**: Python 3.8+ (CLI), Node.js 18+ (thirdweb bridge)
- **Smart Contract**: Arbitrum Stylus (Rust)
- **Blockchain**: Varity L3 (Chain ID 33529)
- **SDK**: thirdweb v5 (transaction signing)
- **Storage**: IPFS (thirdweb Storage)

---

## FAQ

### Q: Is submission automatic?

**A**: Only if you use the `--submit-to-store` flag:

```bash
varietykit app deploy --submit-to-store
```

Without the flag, deployment completes but app is not submitted.

### Q: How long does approval take?

**A**: App Store admins review submissions within 24-48 hours. You'll receive an email notification.

### Q: Can I update my app after submission?

**A**: Yes, deploy a new version and submit again. The App Store will show the latest submission.

### Q: What if my app is rejected?

**A**: You'll receive feedback via email. Fix the issues and resubmit.

### Q: Are there submission fees?

**A**: Gas fees apply (small amount of USDC on Varity L3). The App Store itself has no fees.

### Q: Can I submit apps deployed elsewhere?

**A**: Yes, use the manual submission form at https://store.varity.so/submit

### Q: Do I need to use Varity SDK?

**A**: No, but apps built with Varity SDK are marked with a special badge in the App Store.

---

## Support

### Resources

- **App Store**: https://store.varity.so
- **Documentation**: https://docs.varity.so
- **Discord**: https://discord.gg/varity
- **GitHub**: https://github.com/varity-labs/varity-sdk

### Contact

- **Email**: support@varity.so
- **Twitter**: @VarityLabs
- **Discord**: Varity Community

---

**Last Updated**: January 21, 2026
**Status**: Phase 2 Implementation Complete
**Next**: Integration testing with live Varity L3 contract
