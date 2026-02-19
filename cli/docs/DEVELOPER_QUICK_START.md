# Varity Developer Quick Start Guide

Get started building on Varity L3 in **under 15 minutes**. This guide will take you from zero to deployed AI dashboard.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Installation (2 minutes)](#installation-2-minutes)
- [Create Your First Dashboard (1 minute)](#create-your-first-dashboard-1-minute)
- [Start Local Development Environment (3 minutes)](#start-local-development-environment-3-minutes)
- [Deploy Your Dashboard (5 minutes)](#deploy-your-dashboard-5-minutes)
- [Test Your Dashboard (2 minutes)](#test-your-dashboard-2-minutes)
- [Next Steps](#next-steps)

---

## Prerequisites

Before starting, ensure you have:

- **Python 3.8+** (Python 3.11 recommended)
- **Node.js 16+** (for frontend templates)
- **Docker Desktop** (for LocalDePin stack)
- **Git** (for version control)

Quick check:
```bash
python3 --version    # Should be 3.8+
node --version       # Should be 16+
docker --version     # Should be 20+
git --version        # Any recent version
```

---

## Installation (2 minutes)

Install VarityKit CLI:

```bash
# Clone the repository
git clone https://github.com/varity/varietykit-cli.git
cd varietykit-cli

# Install VarityKit
pip install -e .

# Verify installation
varietykit --version
```

**Expected output:**
```
VarityKit version 1.0.0
Build company-specific AI dashboards on Varity L3
```

---

## Create Your First Dashboard (1 minute)

Initialize a new dashboard project:

```bash
# Create a finance dashboard
varietykit init my-finance-dashboard --industry finance

# Or choose from other industries:
# varietykit init my-healthcare-dashboard --industry healthcare
# varietykit init my-retail-dashboard --industry retail
# varietykit init my-iso-dashboard --industry iso

# Navigate to your project
cd my-finance-dashboard
```

**What gets created:**

```
my-finance-dashboard/
├── contracts/              # Smart contracts for on-chain logic
│   ├── DashboardRegistry.sol
│   ├── BillingModule.sol
│   └── AccessControl.sol
├── frontend/              # React dashboard UI (optional)
├── varietykit.config.json # Project configuration
├── .env.example           # Environment variables template
└── README.md             # Project-specific documentation
```

---

## Start Local Development Environment (3 minutes)

Start LocalDePin - a complete local DePin stack with Akash, Filecoin, Celestia, and Arbitrum:

```bash
# Start all services (first time will build Docker images)
varietykit localdepin start --build

# This starts:
# ✓ Local Arbitrum L3 node (http://localhost:8547)
# ✓ Mock Akash Network (http://localhost:8080)
# ✓ Mock Filecoin/IPFS (http://localhost:5001)
# ✓ Mock Celestia DA (http://localhost:26658)
# ✓ Mock Lit Protocol (http://localhost:7470)
```

**Wait for services to be healthy** (~60 seconds):

```bash
# Check status
varietykit localdepin status

# Expected output:
# Service          Status    Port   Health
# ────────────────────────────────────────
# arbitrum-node    running   8547   healthy
# akash-mock       running   8080   healthy
# filecoin-mock    running   5001   healthy
# celestia-mock    running   26658  healthy
# lit-protocol     running   7470   healthy
```

---

## Deploy Your Dashboard (5 minutes)

### Option 1: Quick Deploy (LocalDePin)

Deploy to your local development environment:

```bash
# Deploy contracts and services
varietykit deploy run --network local

# This will:
# 1. ✓ Compile smart contracts
# 2. ✓ Estimate gas costs
# 3. ✓ Deploy to local Arbitrum
# 4. ✓ Upload template to Filecoin
# 5. ✓ Submit data to Celestia DA
# 6. ✓ Deploy services to Akash
```

**Expected output:**
```
✅ Deployment Complete!

Network: LocalDePin
Total Gas Used: 2,500,000
Deployment ID: deploy-1234567890

Contracts:
  DashboardRegistry: 0x1234...5678
  BillingModule:     0xabcd...ef01
  AccessControl:     0x9876...5432

Services:
  Dashboard UI:  http://localhost:8080
  API Endpoint:  http://localhost:8080/api

View deployment status:
  varietykit deploy status --network local
```

### Option 2: Deploy to Testnet

Deploy to Arbitrum Sepolia testnet:

```bash
# Prerequisites:
# 1. Get testnet ETH from faucet
# 2. Set WALLET_PRIVATE_KEY in .env

# Deploy with verification
varietykit deploy run --network sepolia --verify

# Deployment takes 3-5 minutes on testnet
```

---

## Test Your Dashboard (2 minutes)

Your dashboard is now live! Let's test it:

### 1. Access the Dashboard UI

```bash
# Open in browser
open http://localhost:8080

# Or curl
curl http://localhost:8080
```

### 2. Test API Endpoints

```bash
# Health check
curl http://localhost:8080/health

# Get dashboard info
curl http://localhost:8080/api/v1/dashboard/info

# Expected response:
# {
#   "dashboard_id": "my-finance-dashboard",
#   "industry": "finance",
#   "version": "1.0.0",
#   "status": "active"
# }
```

### 3. Verify Smart Contracts

```bash
# Check deployment status
varietykit deploy status --network local

# Verify contract on LocalDePin explorer
open http://localhost:8080/explorer
```

### 4. View Logs

```bash
# Stream deployment logs
varietykit localdepin logs --follow

# Or view specific service logs
varietykit localdepin logs --service arbitrum-node
```

---

## Next Steps

Congratulations! You've deployed your first Varity AI Dashboard. Here's what to do next:

### 1. Customize Your Dashboard

```bash
# Use the template generator
varietykit template customize

# Follow prompts to:
# - Add custom smart contracts
# - Configure industry-specific features
# - Set up data sources
# - Customize UI theme
```

### 2. Add Features

```bash
# Add analytics tracking
varietykit feature add analytics

# Add AI chat widget
varietykit feature add ai-chat

# Add payment processing
varietykit feature add payments
```

### 3. Deploy to Production

```bash
# Deploy to Arbitrum One mainnet
varietykit deploy run --network mainnet --verify

# Estimated cost: ~$5-10 in ETH for gas
```

### 4. Set Up Monitoring

```bash
# Enable monitoring dashboard
varietykit monitor enable

# View metrics
varietykit monitor dashboard

# Set up alerts
varietykit monitor alerts --email your@email.com
```

### 5. Learn More

```bash
# Browse available commands
varietykit --help

# Get help on specific command
varietykit deploy --help

# View documentation
varietykit doctor --check-docs
```

---

## Common Tasks

### Stop LocalDePin Stack

```bash
# Stop all services
varietykit localdepin stop

# Remove containers (clean slate)
varietykit localdepin clean
```

### Update Dependencies

```bash
# Update VarityKit CLI
pip install --upgrade varietykit

# Update project dependencies
varietykit doctor --fix-deps
```

### Troubleshooting

```bash
# Run system diagnostics
varietykit doctor

# Check LocalDePin health
varietykit localdepin health

# View detailed logs
varietykit localdepin logs --tail 100
```

---

## Onboarding Time Breakdown

| Step | Description | Time |
|------|-------------|------|
| 1 | Install VarityKit | 2 min |
| 2 | Create Dashboard | 1 min |
| 3 | Start LocalDePin | 3 min |
| 4 | Deploy Dashboard | 5 min |
| 5 | Test Dashboard | 2 min |
| **Total** | **Zero to Deployed** | **13 min** |

**Target:** < 15 minutes ✅

---

## Architecture Overview

When you run `varietykit deploy run`, here's what happens:

```
1. Local Development
   ├─ Smart Contracts → Local Arbitrum Node (http://localhost:8547)
   ├─ Template Data → Mock Filecoin (http://localhost:5001)
   ├─ DA Proofs → Mock Celestia (http://localhost:26658)
   └─ Dashboard UI → Mock Akash (http://localhost:8080)

2. Testnet Deployment
   ├─ Smart Contracts → Arbitrum Sepolia (Chain ID: 421614)
   ├─ Template Data → Filecoin via Pinata
   ├─ DA Proofs → Celestia Testnet
   └─ Dashboard UI → Akash Testnet

3. Production Deployment
   ├─ Smart Contracts → Arbitrum One (Chain ID: 42161)
   ├─ Template Data → Filecoin Network
   ├─ DA Proofs → Celestia Mainnet
   └─ Dashboard UI → Akash Network
```

---

## Real-World Example

Let's deploy a complete finance dashboard:

```bash
# 1. Create project
varietykit init acme-finance --industry finance

# 2. Customize
cd acme-finance
varietykit template customize --name "ACME Finance Dashboard"

# 3. Add features
varietykit feature add analytics
varietykit feature add ai-chat
varietykit feature add compliance-reports

# 4. Start development
varietykit localdepin start --build
varietykit dev start  # Starts local dev server with hot reload

# 5. Deploy to testnet
varietykit deploy run --network sepolia --verify

# 6. Test
varietykit test run --integration

# 7. Deploy to production
varietykit deploy run --network mainnet --verify

# 8. Monitor
varietykit monitor dashboard
```

---

## Cost Breakdown

### LocalDePin (Development)
- **Cost:** $0 (local Docker containers)
- **Resources:** 4GB RAM, 2 CPU cores
- **Perfect for:** Development and testing

### Testnet Deployment
- **Cost:** $0 (testnet ETH is free)
- **Resources:** Shared testnet infrastructure
- **Perfect for:** Testing before production

### Production Deployment (Akash Network)
- **Monthly Cost:** < $1/month
  - Compute (Akash): $0.08/month
  - Storage (Filecoin): $0.10/month
  - DA (Celestia): $0.05/month
  - Contracts (Arbitrum): One-time ~$5-10
- **vs Traditional Cloud:** $10-50/month (90%+ savings)

---

## Resources

- **Documentation:** https://docs.varity.so
- **API Reference:** https://api.varity.so
- **GitHub:** https://github.com/varity/varietykit-cli
- **Discord Community:** https://discord.gg/varity
- **YouTube Tutorials:** https://youtube.com/@varity-ai
- **Email Support:** dev@varity.so

---

## Need Help?

### Common Issues

**Issue:** `docker: command not found`
- **Solution:** Install Docker Desktop from https://docker.com/get-started

**Issue:** `Port 8547 already in use`
- **Solution:**
  ```bash
  # Find what's using the port
  lsof -i :8547

  # Stop conflicting service
  varietykit localdepin stop
  ```

**Issue:** `Insufficient gas funds`
- **Solution:**
  ```bash
  # Get testnet ETH from faucet
  varietykit fund request --network sepolia

  # Check balance
  varietykit task wallet balance --network sepolia
  ```

### Get Support

- **Chat:** Join our [Discord](https://discord.gg/varity)
- **Email:** dev@varity.so
- **GitHub Issues:** github.com/varity/varietykit-cli/issues
- **Stack Overflow:** Tag your questions with `varity-l3`

---

## What's Next?

Now that you have a working dashboard, explore:

1. **[Template Customization Guide](./TEMPLATE_CUSTOMIZATION.md)** - Deep dive into templates
2. **[Smart Contract Development](./SMART_CONTRACT_DEV.md)** - Write custom contracts
3. **[DePin Integration Guide](./DEPIN_INTEGRATION.md)** - Understanding DePin architecture
4. **[Production Deployment](./PRODUCTION_DEPLOYMENT.md)** - Going live
5. **[Monitoring & Analytics](./MONITORING.md)** - Track your dashboard

---

**Ready to build the future of AI dashboards on DePin? Let's go!** 🚀
