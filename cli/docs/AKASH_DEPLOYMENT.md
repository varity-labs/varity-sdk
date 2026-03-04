## # Akash Network Deployment Guide

Complete guide for deploying applications to Akash Network using Varity SDK.

## Table of Contents

1. [Introduction](#introduction)
2. [Prerequisites](#prerequisites)
3. [Installation](#installation)
4. [Configuration](#configuration)
5. [Basic Usage](#basic-usage)
6. [Advanced Usage](#advanced-usage)
7. [Troubleshooting](#troubleshooting)
8. [Cost Optimization](#cost-optimization)
9. [Security Best Practices](#security-best-practices)

---

## Introduction

**Akash Network** is a decentralized cloud computing marketplace that provides:
- **70-85% cost savings** compared to AWS, Google Cloud, Azure
- **Censorship-resistant** deployment
- **No vendor lock-in**
- **Pay-per-use pricing** in AKT tokens

The Varity SDK integrates Akash deployment into the `varietykit app deploy` command, making decentralized deployment as simple as deploying to traditional cloud providers.

### What Gets Deployed

- **Frontend**: Static sites served via Nginx on Akash providers
- **Backend**: Node.js, Python, Go services running on Akash compute
- **Full-Stack**: Combined frontend + backend deployment

---

## Prerequisites

### 1. Akash CLI Installation

**macOS** (Homebrew):
```bash
brew install akash
```

**Linux**:
```bash
curl -sSfL https://raw.githubusercontent.com/akash-network/node/master/install.sh | sh
```

**Windows** (WSL2):
```bash
curl -sSfL https://raw.githubusercontent.com/akash-network/node/master/install.sh | sh
```

**Verify Installation**:
```bash
akash version
# Should output: akash version 0.18.0 or higher
```

### 2. Akash Wallet Setup

**Create Wallet**:
```bash
akash keys add default
# Save the mnemonic phrase securely!
```

**Export Private Key**:
```bash
akash keys export default
# Copy the private key
export AKASH_WALLET_KEY="your_private_key_here"
```

**Fund Wallet**:
- **Mainnet**: Purchase AKT from exchanges (Kraken, Osmosis, etc.)
- **Testnet**: Get free AKT from [Akash Faucet](https://faucet.akash.network)

**Recommended Balance**:
- Minimum: 5 AKT (for gas fees + 1 month deployment)
- Recommended: 20+ AKT (for multiple deployments)

### 3. Varity SDK Installation

```bash
cd varity-sdk/cli
pip install -e .
```

---

## Configuration

### Environment Variables

Create a `.env` file or export these variables:

```bash
# Required
export AKASH_WALLET_KEY="your_akash_wallet_private_key"

# Optional (with defaults)
export AKASH_NETWORK="mainnet"              # or "testnet"
export AKASH_NODE="https://rpc.akash.network:443"
export AKASH_CHAIN_ID="akashnet-2"

# Optional (provider preferences)
export VARITY_DEFAULT_PROVIDER="provider.akash.network"
```

### Verify Configuration

```bash
varietykit doctor
```

Expected output:
```
✅ Akash CLI installed (v0.18.0)
✅ Wallet configured (address: akash1...)
✅ Wallet balance: 15.5 AKT
✅ Node connectivity: OK
```

---

## Basic Usage

### Deploy Frontend to Akash

```bash
cd my-nextjs-app
varietykit app deploy --method akash
```

**What Happens**:
1. Detects project type (Next.js, React, Vue)
2. Builds application (`npm run build`)
3. Generates Akash SDL manifest
4. Creates deployment on Akash
5. Waits for provider bids
6. Selects best provider (price + reputation)
7. Creates lease with provider
8. Sends manifest to provider
9. Returns deployment URL

**Example Output**:
```
🚀 Starting deployment...
📦 Detecting project type...
   Detected: nextjs
🔨 Building project (npm run build)...
   Built 42 files (5.30 MB)
🚀 Deploying to Akash Network...
   Creating Akash deployment (frontend)...
   Deployment ID: 12345
   Waiting for provider bids...
   Received 8 bids
   Selecting best provider...
   Selected: provider.akash.network
   Price: 5000 uakt/block
   Creating lease...
   Lease ID: 12345/provider.akash.network
   Sending manifest to provider...
   Manifest sent successfully
   Waiting for deployment to become active...
   Retrieving deployment URL...
   URL: https://12345.provider.akash.network
   Est. Monthly Cost: 2.16 AKT

☁️  Uploading to IPFS (backup)...
   CID: QmXx...

✅ Deployment complete!

   🌐 Your app: https://12345.provider.akash.network
   📋 Deployment ID: deploy-1737492000
```

### Deploy Backend to Akash

```bash
cd my-app
varietykit app deploy --method akash --backend
```

**Supported Runtimes**:
- Node.js (default)
- Python
- Go
- Rust

**Auto-Detected** from:
- `package.json` (Node.js)
- `requirements.txt` (Python)
- `go.mod` (Go)
- `Cargo.toml` (Rust)

---

## Advanced Usage

### Custom Resource Allocation

**Frontend with More Resources**:
```bash
varietykit app deploy --method akash \
  --cpu 1.0 \
  --memory 1Gi \
  --storage 2Gi
```

**Backend with Custom Port**:
```bash
varietykit app deploy --method akash --backend \
  --backend-port 4000 \
  --backend-cpu 2.0 \
  --backend-memory 2Gi
```

### Environment Variables

**Pass Environment Variables**:
```bash
varietykit app deploy --method akash --backend \
  --env DATABASE_URL="postgresql://..." \
  --env API_KEY="sk_test_..."
```

**From .env File**:
```bash
varietykit app deploy --method akash --backend --env-file .env.production
```

### Provider Selection

**Select Specific Provider**:
```bash
varietykit app deploy --method akash --provider provider.akash.network
```

**Filter by Location**:
```bash
varietykit app deploy --method akash --location us-east
```

**Price Ceiling**:
```bash
varietykit app deploy --method akash --max-price 10000
```

### Full-Stack Deployment

**Deploy Frontend + Backend Together**:
```bash
varietykit app deploy --method akash --backend
```

**Custom Configuration**:
```bash
varietykit app deploy --method akash --backend \
  --frontend-cpu 0.5 \
  --frontend-memory 512Mi \
  --backend-cpu 1.0 \
  --backend-memory 1Gi \
  --backend-port 3000
```

---

## Deployment Management

### List Deployments

```bash
varietykit app list --network akash
```

Output:
```
┌────────────────────┬─────────┬────────────────────────────────────┬────────────────┐
│ ID                 │ Network │ URL                                │ Deployed       │
├────────────────────┼─────────┼────────────────────────────────────┼────────────────┤
│ deploy-1737492000  │ akash   │ https://12345.provider.akash.net   │ 2 hours ago    │
│ deploy-1737488400  │ akash   │ https://12346.provider.akash.net   │ 1 day ago      │
└────────────────────┴─────────┴────────────────────────────────────┴────────────────┘
```

### View Deployment Details

```bash
varietykit app info deploy-1737492000
```

Output:
```
╭────────────────────────────────────────────────────────────╮
│ Deployment Details                                         │
│                                                            │
│ Deployment ID: deploy-1737492000                           │
│ Network: akash                                             │
│ Frontend: https://12345.provider.akash.network             │
│ Backend: https://api-12345.provider.akash.network          │
│ IPFS CID: QmXx...                                          │
│ Akash Deployment: 12345                                    │
│ Provider: provider.akash.network                           │
│ Monthly Cost: 2.16 AKT (~$5.40 USD)                        │
│ Deployed: 2026-01-21T10:00:00Z                             │
╰────────────────────────────────────────────────────────────╯
```

### Close Deployment

```bash
varietykit app close deploy-1737492000
```

**Important**: Closing a deployment stops billing and deletes the app.

---

## Troubleshooting

### Common Errors

#### 1. "Akash CLI not found"

**Solution**:
```bash
# Install Akash CLI
curl -sSfL https://raw.githubusercontent.com/akash-network/node/master/install.sh | sh

# Verify
akash version
```

#### 2. "Akash wallet key not provided"

**Solution**:
```bash
# Export wallet key
export AKASH_WALLET_KEY="your_private_key"

# Or add to ~/.bashrc or ~/.zshrc
echo 'export AKASH_WALLET_KEY="your_key"' >> ~/.bashrc
```

#### 3. "No provider bids available"

**Causes**:
- Not enough AKT in wallet for gas fees
- Resource requirements too high
- Network congestion

**Solutions**:
```bash
# Check wallet balance
akash query bank balances $(akash keys show default -a)

# Reduce resource requirements
varietykit app deploy --method akash --cpu 0.5 --memory 512Mi

# Try again in a few minutes
```

#### 4. "Deployment timed out"

**Solution**:
```bash
# Increase timeout
varietykit app deploy --method akash --timeout 600  # 10 minutes
```

#### 5. "Manifest send failed"

**Causes**:
- Provider offline
- Network connectivity issues

**Solution**:
```bash
# Retry with different provider
varietykit app deploy --method akash --provider another-provider.akash.network
```

### Debug Mode

```bash
varietykit app deploy --method akash --debug
```

Shows detailed Akash CLI output and debugging information.

---

## Cost Optimization

### Understanding Akash Pricing

**Pricing Units**:
- **uakt** = micro AKT (1 AKT = 1,000,000 uakt)
- **Price per block** = Cost per ~6 seconds
- **Monthly cost** = price_per_block × blocks_per_month / 1,000,000

**Calculation**:
```
Monthly blocks = (30 days × 24 hours × 60 min × 60 sec) / 6 sec ≈ 432,000
Monthly cost (AKT) = (price_per_block × 432,000) / 1,000,000
```

### Cost Comparison

| Resource Profile | Akash Cost/Month | AWS Cost/Month | Savings |
|------------------|------------------|----------------|---------|
| **Small** (0.5 CPU, 512Mi RAM) | ~$5 | ~$15 | 70% |
| **Medium** (1 CPU, 1Gi RAM) | ~$10 | ~$30 | 67% |
| **Large** (2 CPU, 2Gi RAM) | ~$20 | ~$60 | 67% |
| **XL** (4 CPU, 4Gi RAM) | ~$40 | ~$120 | 67% |

**Actual costs vary by provider competition and AKT price**

### Optimization Tips

1. **Right-size Resources**:
   ```bash
   # Don't over-provision
   varietykit app deploy --method akash --cpu 0.5 --memory 512Mi
   ```

2. **Compare Providers**:
   ```bash
   # View all bids before selecting
   varietykit app deploy --method akash --show-all-bids
   ```

3. **Use Price Ceiling**:
   ```bash
   # Set maximum acceptable price
   varietykit app deploy --method akash --max-price 5000
   ```

4. **Monitor Costs**:
   ```bash
   # View current deployment costs
   varietykit app info deploy-123 --show-costs
   ```

5. **Close Unused Deployments**:
   ```bash
   # Stop billing for old deployments
   varietykit app close deploy-old
   ```

---

## Security Best Practices

### 1. Wallet Security

**Never commit wallet keys to version control**:
```bash
# Add to .gitignore
echo "AKASH_WALLET_KEY" >> .gitignore
echo ".env" >> .gitignore
```

**Use environment variables**:
```bash
# Production
export AKASH_WALLET_KEY="prod_key"

# Development
export AKASH_WALLET_KEY="dev_key"
```

### 2. Environment Variable Security

**Sensitive variables should be encrypted**:
```bash
# Use Varity's encrypted env vars (coming soon)
varietykit app deploy --method akash --backend \
  --encrypted-env DATABASE_URL \
  --encrypted-env API_KEY
```

**Never log sensitive data**:
```bash
# Wrong: Exposes secrets in logs
--env API_KEY="sk_live_..." --debug

# Right: Use env file
--env-file .env.production  # Not logged
```

### 3. Provider Trust

**Use reputable providers**:
```bash
# Check provider reputation
varietykit providers list --sort-by reputation

# Only use providers with >90% uptime
varietykit app deploy --method akash --min-uptime 90
```

### 4. Network Isolation

**Restrict backend access**:
```bash
# Deploy backend on private network (coming soon)
varietykit app deploy --method akash --backend --private-network
```

---

## Appendix

### SDL Manifest Example

**Frontend (frontend.sdl.yaml)**:
```yaml
version: "2.0"

services:
  web:
    image: nginx:alpine
    expose:
      - port: 80
        as: 80
        to:
          - global: true

profiles:
  compute:
    web:
      resources:
        cpu:
          units: 0.5
        memory:
          size: 512Mi
        storage:
          size: 1Gi

  placement:
    akash:
      attributes:
        host: akash
      pricing:
        web:
          denom: uakt
          amount: 1000

deployment:
  web:
    akash:
      profile: web
      count: 1
```

**Backend (backend.sdl.yaml)**:
```yaml
version: "2.0"

services:
  api:
    image: node:18-alpine
    expose:
      - port: 3000
        as: 3000
        to:
          - global: true
    env:
      - DATABASE_URL=postgresql://...
      - NODE_ENV=production

profiles:
  compute:
    api:
      resources:
        cpu:
          units: 1.0
        memory:
          size: 1Gi
        storage:
          size: 2Gi

  placement:
    akash:
      pricing:
        api:
          denom: uakt
          amount: 2000

deployment:
  api:
    akash:
      profile: api
      count: 1
```

### Akash CLI Reference

**Useful Commands**:
```bash
# Check balance
akash query bank balances $(akash keys show default -a)

# List deployments
akash query deployment list --owner $(akash keys show default -a)

# Check deployment status
akash query deployment get --dseq 12345 --owner $(akash keys show default -a)

# Close deployment
akash tx deployment close --dseq 12345 --from default

# List providers
akash query market provider list

# Query bids
akash query market bid list --owner $(akash keys show default -a) --dseq 12345
```

### Resources

- **Akash Documentation**: https://docs.akash.network
- **Akash Discord**: https://discord.akash.network
- **Provider List**: https://akash.network/providers
- **Varity SDK**: https://github.com/varity-labs/varity-sdk
- **Get Help**: https://discord.gg/varity

---

**Last Updated**: January 21, 2026
**SDK Version**: 2.0.0-alpha.1
**Akash CLI Version**: 0.18.0+
