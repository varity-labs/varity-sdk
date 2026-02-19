# App Deployment Guide

Deploy your Web3 applications to decentralized infrastructure with one command.

## Quick Start

Deploy your app to Varity's decentralized infrastructure:

```bash
cd my-app
varietykit app deploy
```

That's it! Your app is now hosted on IPFS.

## Table of Contents

- [Overview](#overview)
- [Supported Frameworks](#supported-frameworks)
- [Prerequisites](#prerequisites)
- [Commands](#commands)
- [Deployment Process](#deployment-process)
- [Configuration](#configuration)
- [Cost Comparison](#cost-comparison)
- [Examples](#examples)
- [Troubleshooting](#troubleshooting)
- [FAQ](#faq)

## Overview

The `varietykit app deploy` command provides a complete deployment solution for Web3 applications:

**Phase 1 (Current)**:
- ✅ Frontend deployment to IPFS
- ✅ Automatic project detection (Next.js, React, Vue)
- ✅ Build automation
- ✅ thirdweb Storage integration

**Phase 2 (In Progress)**:
- ✅ Deployment history and rollback
- ✅ Enhanced CLI commands (list, info, status, rollback)
- ⏳ Backend deployment to Akash (Agent 5)
- ⏳ Auto-submission to Varity App Store (Agent 6)
- ⏳ Smart contract deployment
- ⏳ Custom domains

## Supported Frameworks

### Frontend Frameworks (Phase 1)

| Framework | Version | Build Dir | Notes |
|-----------|---------|-----------|-------|
| Next.js | 13+ | `out` | Requires `output: "export"` |
| React (CRA) | 18+ | `build` | Create React App |
| React (Vite) | 18+ | `dist` | Vite build tool |
| Vue | 3+ | `dist` | Vue CLI or Vite |

### Backend Frameworks (Phase 2)

| Framework | Version | Runtime | Status |
|-----------|---------|---------|--------|
| Express.js | 4+ | Node.js | Coming Soon |
| Fastify | 4+ | Node.js | Coming Soon |
| FastAPI | 0.100+ | Python | Coming Soon |

## Prerequisites

### 1. thirdweb Client ID

Get a free Client ID from [thirdweb Dashboard](https://thirdweb.com/dashboard):

```bash
export THIRDWEB_CLIENT_ID=your_client_id_here
```

Or add to your `.env` file:

```bash
THIRDWEB_CLIENT_ID=your_client_id_here
```

### 2. Build Configuration

Ensure your project builds successfully:

**Next.js**: Add to `next.config.js`:

```javascript
module.exports = {
  output: 'export'
}
```

**React/Vue**: Verify build command exists:

```bash
npm run build
```

### 3. Node.js and npm

- Node.js 18+ (or 16+)
- npm, pnpm, or yarn

## Commands

### `varietykit app deploy`

Deploy application to decentralized infrastructure.

```bash
varietykit app deploy [OPTIONS]
```

**Options**:

| Option | Default | Description |
|--------|---------|-------------|
| `--network` | `varity` | Network to deploy to (varity, arbitrum, base) |
| `--submit-to-store` | `false` | Auto-submit to Varity App Store (Phase 2) |
| `--path` | `.` | Project directory |

**Examples**:

```bash
# Deploy current directory to Varity L3
varietykit app deploy

# Deploy specific directory
varietykit app deploy --path ./my-next-app

# Deploy to specific network
varietykit app deploy --network arbitrum

# Submit to App Store (Phase 2)
varietykit app deploy --submit-to-store
```

### `varietykit app list`

List all deployments.

```bash
varietykit app list [OPTIONS]
```

**Options**:

| Option | Default | Description |
|--------|---------|-------------|
| `--network, -n` | `None` | Filter by network (varity, arbitrum, base) |
| `--limit, -l` | `10` | Number of deployments to show |

**Examples**:

```bash
# List recent deployments (default: last 10)
varietykit app list

# List all deployments on varity network
varietykit app list --network varity

# Show last 20 deployments
varietykit app list --limit 20
```

Shows deployments in a Rich table with:
- Deployment ID
- Network
- Type (ipfs, akash, etc.)
- Frontend URL
- Deployed timestamp (newest first)

**Status**: ✅ Available (Phase 2 - Agent 7)

### `varietykit app info <deployment_id>`

Show detailed deployment information.

```bash
varietykit app info <deployment_id>
```

**Examples**:

```bash
# Show info for specific deployment
varietykit app info deploy-1737492000
```

Displays comprehensive information:
- **Deployment**: ID, version, network, timestamp, type
- **Project**: Type, framework version, path
- **Build**: Success status, files, size, build time
- **URLs**: Frontend, backend, thirdweb CDN, IPFS gateway
- **IPFS**: CID
- **App Store**: Submission status, app ID, URL

**Status**: ✅ Available (Phase 2 - Agent 7)

### `varietykit app status`

Show the most recent deployment status.

```bash
varietykit app status [OPTIONS]
```

**Options**:

| Option | Description |
|--------|-------------|
| `--network, -n` | Filter by network |

**Examples**:

```bash
# Show latest deployment status
varietykit app status

# Show latest deployment for specific network
varietykit app status --network varity
```

Displays:
- Latest deployment ID
- Network and type
- Status (Active, Failed, etc.)
- Deployed timestamp
- All URLs (frontend, backend)
- Build information
- App Store submission status
- Total deployment count

**Status**: ✅ Available (Phase 2 - Agent 7)

### `varietykit app rollback <deployment_id>`

Rollback to a previous deployment.

⚠️ **Warning**: This creates a new deployment using the configuration from the specified deployment.

```bash
varietykit app rollback <deployment_id> [OPTIONS]
```

**Options**:

| Option | Description |
|--------|-------------|
| `--confirm` | Skip confirmation prompt |

**Examples**:

```bash
# Rollback to specific deployment (with confirmation)
varietykit app rollback deploy-1737492000

# Rollback without confirmation prompt
varietykit app rollback deploy-1737492000 --confirm
```

**Process**:
1. Loads the specified deployment manifest
2. Extracts project path and network configuration
3. Re-runs deployment with same settings
4. Creates a new deployment ID
5. Returns new deployment result

**Status**: ✅ Available (Phase 2 - Agent 7)

## Deployment Process

### Phase 1: IPFS Deployment

```
┌─────────────────────────────────────────────┐
│ 1. Project Detection                        │
│    • Analyze package.json                   │
│    • Detect framework (Next.js, React, Vue) │
│    • Determine build directory              │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│ 2. Build                                    │
│    • Run npm/pnpm/yarn build                │
│    • Collect build artifacts                │
│    • Calculate total size                   │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│ 3. Upload to IPFS                           │
│    • Use thirdweb Storage                   │
│    • Upload all files                       │
│    • Get IPFS CID                           │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│ 4. Generate URLs                            │
│    • IPFS gateway URL                       │
│    • thirdweb CDN URL                       │
│    • Save deployment manifest               │
└─────────────────────────────────────────────┘
```

### Phase 2: Full-Stack Deployment (Coming Soon)

Additional steps:
5. Deploy backend to Akash
6. Deploy contracts to Varity L3
7. Submit to Varity App Store
8. Configure custom domain

## Deployment Manifests

All deployments are saved as JSON manifests in `~/.varietykit/deployments/`.

### Manifest Format v1.0 (Phase 1)

```json
{
  "version": "1.0",
  "deployment_id": "deploy-1737492000",
  "timestamp": "2026-01-22T10:00:00Z",
  "network": "varity",
  "project": {
    "type": "nextjs",
    "framework_version": "14.0.0",
    "build_command": "npm run build",
    "package_manager": "npm",
    "path": "/path/to/project"
  },
  "build": {
    "success": true,
    "files": 42,
    "size_mb": 5.3,
    "time_seconds": 23.5,
    "output_dir": "out"
  },
  "ipfs": {
    "cid": "QmXxx...",
    "gateway_url": "https://ipfs.io/ipfs/QmXxx...",
    "thirdweb_url": "https://QmXxx....ipfscdn.io",
    "total_size": 5560320,
    "file_count": 42
  }
}
```

### Manifest Format v2.0 (Phase 2)

Enhanced format with Akash deployment and App Store submission:

```json
{
  "version": "2.0",
  "deployment_id": "deploy-1737492000",
  "timestamp": "2026-01-22T10:00:00Z",
  "network": "varity",
  "project": {
    "type": "nextjs",
    "framework_version": "14.0.0",
    "has_backend": true,
    "path": "/path/to/project"
  },
  "build": {
    "frontend": {
      "success": true,
      "files": 42,
      "size_mb": 5.3,
      "time_seconds": 23.5
    },
    "backend": {
      "success": true,
      "files": 15,
      "size_mb": 1.1,
      "time_seconds": 12.3
    }
  },
  "deployment": {
    "type": "akash",
    "frontend": {
      "url": "https://myapp-xyz.provider.akash.network",
      "akash_deployment_id": "akash-dep-123",
      "provider": "provider.akash.network"
    },
    "backend": {
      "url": "https://api-xyz.provider.akash.network",
      "akash_deployment_id": "akash-dep-456"
    },
    "ipfs": {
      "cid": "QmXxx...",
      "gateway_url": "https://ipfs.io/ipfs/QmXxx...",
      "thirdweb_url": "https://QmXxx....ipfscdn.io"
    }
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

### Accessing Deployment History

```bash
# Storage location
ls ~/.varietykit/deployments/

# View specific deployment
cat ~/.varietykit/deployments/deploy-1737492000.json

# Or use CLI commands
varietykit app list
varietykit app info deploy-1737492000
```

## Configuration

### varity.config.ts (Phase 2)

Create a `varity.config.ts` file in your project root:

```typescript
import { defineConfig } from '@varity/sdk'

export default defineConfig({
  // App metadata
  app: {
    name: 'My Awesome DApp',
    description: 'A decentralized application on Varity',
    category: 'DeFi',
    logo: './public/logo.png',
    screenshots: [
      './public/screenshot-1.png',
      './public/screenshot-2.png'
    ],
    tags: ['defi', 'trading', 'web3']
  },

  // Network configuration
  network: 'varity',

  // Deployment settings
  deployment: {
    frontend: {
      framework: 'nextjs',
      buildCommand: 'npm run build',
      buildDir: 'out'
    },
    backend: {
      enabled: false // Set to true for full-stack apps
    },
    contracts: {
      enabled: false // Set to true to deploy contracts
    }
  },

  // App Store settings
  store: {
    autoSubmit: true,
    pricing: {
      free: true,
      subscriptions: [
        { tier: 'basic', price: 9.99 },
        { tier: 'pro', price: 29.99 }
      ]
    }
  }
})
```

### Environment Variables

```bash
# Required
THIRDWEB_CLIENT_ID=your_client_id

# Optional (for custom deployments)
THIRDWEB_SECRET_KEY=your_secret_key
VARITY_API_KEY=your_api_key

# Network-specific
VARITY_RPC_URL=https://rpc-varity-testnet-rroe52pwjp.t.conduit.xyz
ARBITRUM_RPC_URL=https://sepolia-rollup.arbitrum.io/rpc
```

## Cost Comparison

### Varity vs AWS

| Service | AWS Cost | Varity Cost | Savings |
|---------|----------|-------------|---------|
| Static hosting (frontend) | $5-10/mo | ~$0.01/GB/mo | 99% |
| Compute (backend) | $50-100/mo | ~$15-30/mo | 70% |
| Storage (IPFS) | $23/TB/mo | ~$0.01/GB/mo | 99% |
| Database | $50-200/mo | Included | 100% |
| **Total (100 users + AI)** | **~$2,800/mo** | **~$800/mo** | **~70%** |

### IPFS Storage Costs

| Provider | Free Tier | Paid Tier |
|----------|-----------|-----------|
| thirdweb | 100 MB/month | $20/month (unlimited) |
| IPFS Gateway | Free | Free |
| Pinata | 1 GB | $0.015/GB/month |

## Examples

### Example 1: Deploy Next.js App

```bash
# 1. Create Next.js app with static export
npx create-next-app@latest my-app
cd my-app

# 2. Configure for static export
echo "module.exports = { output: 'export' }" > next.config.js

# 3. Build locally to test
npm run build

# 4. Deploy to Varity
varietykit app deploy
```

**Output**:
```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ Varity App Deployment                      ┃
┃ Deploy to decentralized infrastructure    ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

Project: /home/user/my-app
Network: varity

✅ Deployment Successful!

Deployment ID: deploy-1737492000
Frontend URL: https://ipfs.io/ipfs/QmXx...
thirdweb CDN: https://gateway.thirdweb.com/ipfs/QmXx...
IPFS CID: QmXx...

Deployment metadata saved to ~/.varietykit/deployments/
```

### Example 2: Deploy React (Vite) App

```bash
# 1. Create Vite app
npm create vite@latest my-react-app -- --template react
cd my-react-app

# 2. Install dependencies
npm install

# 3. Build
npm run build

# 4. Deploy
varietykit app deploy
```

### Example 3: Deploy Vue App

```bash
# 1. Create Vue app
npm create vue@latest my-vue-app
cd my-vue-app

# 2. Install dependencies
npm install

# 3. Build
npm run build

# 4. Deploy
varietykit app deploy
```

### Example 4: Deploy with Custom Path

```bash
# Deploy from parent directory
varietykit app deploy --path ./projects/my-app
```

## Troubleshooting

### Error: "Build output directory not found"

**Problem**: The build directory doesn't exist or is in a different location.

**Solution**:

1. Run build manually first:
   ```bash
   npm run build
   ```

2. Check build output location:
   - Next.js: `out/` (with `output: "export"`)
   - React (CRA): `build/`
   - React (Vite): `dist/`
   - Vue: `dist/`

3. Update your build configuration if needed.

### Error: "THIRDWEB_CLIENT_ID not set"

**Problem**: thirdweb Client ID is missing.

**Solution**:

1. Get a Client ID from [thirdweb Dashboard](https://thirdweb.com/dashboard)

2. Set environment variable:
   ```bash
   export THIRDWEB_CLIENT_ID=your_client_id
   ```

3. Or add to `.env`:
   ```bash
   THIRDWEB_CLIENT_ID=your_client_id
   ```

### Error: "Build failed"

**Problem**: The build command failed.

**Solution**:

1. Try building manually:
   ```bash
   npm run build
   ```

2. Fix any build errors in your code

3. Verify dependencies are installed:
   ```bash
   npm install
   ```

4. Check Node.js version:
   ```bash
   node --version  # Should be 16+
   ```

### Error: "IPFS upload timeout"

**Problem**: Upload to IPFS took too long.

**Solution**:

1. Check your internet connection

2. Try again (sometimes network issues are temporary)

3. Reduce build size by:
   - Removing unused dependencies
   - Optimizing images
   - Enabling code splitting

4. Upgrade to thirdweb Pro ($20/month) for better upload speeds

### Error: "Rate limit exceeded"

**Problem**: Free tier IPFS limit exceeded (100 MB/month).

**Solution**:

1. Upgrade to thirdweb Pro ($20/month, unlimited)

2. Or use a different thirdweb Client ID

3. Or wait until next month

## FAQ

### Q: How much does deployment cost?

**A**: Phase 1 deployment to IPFS is essentially free:
- Free tier: 100 MB/month (covers most small apps)
- Paid tier: $20/month unlimited (thirdweb Pro)
- No compute costs (static hosting)

Phase 2 (full-stack) costs:
- Backend on Akash: ~$15-30/month
- 70-85% cheaper than AWS

### Q: Can I deploy a backend API?

**A**: Not yet. Phase 2 (coming in February 2026) will support:
- Node.js backends (Express, Fastify)
- Python backends (FastAPI)
- Deployment to Akash

### Q: What about smart contracts?

**A**: Contract deployment is Phase 2. For now, use:
```bash
varietykit deploy run --network varity
```

### Q: Can I use a custom domain?

**A**: Custom domains are Phase 2. For now, you get:
- IPFS gateway URL: `https://ipfs.io/ipfs/{CID}`
- thirdweb CDN URL: `https://gateway.thirdweb.com/ipfs/{CID}`

### Q: How do I update my deployment?

**A**: Run `varietykit app deploy` again. New features (Phase 2 - Agent 7):
- ✅ Deployment history: `varietykit app list`
- ✅ Rollback capability: `varietykit app rollback <deployment_id>`
- ✅ Deployment status: `varietykit app status`
- ⏳ Blue-green deployments (coming soon)

### Q: Is my app decentralized?

**A**: Yes! Phase 1 deploys to IPFS, which is:
- Decentralized (files stored across multiple nodes)
- Censorship-resistant
- Permanent (files can't be deleted)

Phase 2 adds Akash for decentralized compute.

### Q: What if I need server-side rendering (SSR)?

**A**: SSR requires a backend server. Options:
- Wait for Phase 2 (Akash deployment)
- Use thirdweb Engine for backend logic
- Use client-side rendering only (Phase 1)

### Q: Can I deploy to multiple networks?

**A**: Yes, use `--network` option:
```bash
varietykit app deploy --network varity
varietykit app deploy --network arbitrum
varietykit app deploy --network base
```

Note: Multi-chain support is limited in Phase 1.

## Next Steps

### Learn More

- [Varity SDK Documentation](https://docs.varity.so/sdk)
- [thirdweb Storage Docs](https://portal.thirdweb.com/storage)
- [IPFS Documentation](https://docs.ipfs.tech/)

### Get Help

- [Discord Community](https://discord.gg/varity)
- [GitHub Issues](https://github.com/varity-labs/varity-sdk/issues)
- [Email Support](mailto:support@varity.so)

### Stay Updated

- [Twitter](https://twitter.com/varity_ai)
- [Blog](https://varity.so/blog)
- [Changelog](../CHANGELOG.md)

---

**Last Updated**: January 21, 2026
**Version**: 1.1.0 (Phase 2 - Agent 7 Complete)
**Status**: Deployment History & CLI Commands Implemented ✅
