# VarityKit Smart Contracts

Smart contracts for the VarityKit template marketplace with **30/70 revenue split** (30% creator, 70% Varity platform).

## 📋 Contracts

### TemplateMarketplace.sol
Marketplace for buying and selling VarityKit templates with automated on-chain revenue distribution.

**Features:**
- ✅ Template publishing with quality score validation (>= 85)
- ✅ Automatic 30/70 revenue split (30% creator, 70% platform)
- ✅ Creator earnings tracking and withdrawal
- ✅ Platform fee collection
- ✅ Template price updates
- ✅ Activation/deactivation controls

**Security:**
- ReentrancyGuard for safe ETH transfers
- Pausable for emergency stops
- Ownable for platform management

### TemplateRegistry.sol
On-chain registry for template metadata with version control.

**Features:**
- ✅ IPFS hash storage on-chain
- ✅ Semantic versioning support
- ✅ Version history tracking
- ✅ Immutable audit trail
- ✅ Version activation/deactivation

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Compile Contracts

```bash
npm run compile
```

### 4. Run Tests

```bash
npm test
```

### 5. Deploy to Local Network

```bash
# Terminal 1: Start local Hardhat node
npm run node

# Terminal 2: Deploy contracts
npm run deploy:local
```

### 6. Deploy to Arbitrum Sepolia Testnet

```bash
# Make sure .env has DEPLOYER_PRIVATE_KEY and ARBISCAN_API_KEY
npm run deploy:arbitrum-sepolia

# Verify contracts on Arbiscan
npm run verify:arbitrum-sepolia
```

### 7. Deploy to Varity L3

```bash
# Make sure .env has VARITY_L3_RPC_URL and VARITY_L3_CHAIN_ID
npm run deploy:varity-l3
```

## 📦 Deployment

The deployment script (`scripts/deploy.js`) will:

1. Deploy TemplateMarketplace contract
2. Deploy TemplateRegistry contract
3. Verify deployment configuration (30/70 split)
4. Save deployment addresses to `deployments/`
5. Print configuration instructions

**Deployment Output:**

```
🚀 VarityKit Smart Contract Deployment

📋 Deployment Configuration:
  Network: varityL3
  Chain ID: 42161000
  Deployer: 0x1234...
  Balance: 1.5 ETH

📦 Deploying TemplateMarketplace...
✅ TemplateMarketplace deployed!
   Address: 0xABCD...
   Revenue Split: 30% creator, 70% platform
   Min Quality Score: 85

📦 Deploying TemplateRegistry...
✅ TemplateRegistry deployed!
   Address: 0xEFGH...

🎉 Deployment Complete!
```

## 🧪 Testing

### Test Marketplace Functionality

```bash
# After deployment, test the marketplace
npx hardhat run scripts/test-marketplace.js --network localhost
```

**Test Coverage:**
- Template publishing
- Template purchasing
- Revenue split verification (30/70)
- Creator earnings tracking
- Withdrawal functionality

### Run Unit Tests

```bash
npm test
```

### Generate Coverage Report

```bash
npx hardhat coverage
```

### Generate Gas Report

```bash
REPORT_GAS=true npm test
```

## 📁 Directory Structure

```
contracts/
├── TemplateMarketplace.sol       # Main marketplace contract
├── TemplateRegistry.sol          # Metadata registry contract
├── hardhat.config.js             # Hardhat configuration
├── package.json                  # Node.js dependencies
├── .env.example                  # Environment template
├── scripts/
│   ├── deploy.js                 # Deployment script
│   └── test-marketplace.js       # Marketplace test script
├── deployments/                  # Deployment records (git-ignored)
│   ├── varityL3_1234567890.json
│   └── arbitrumSepolia_1234567890.json
└── README.md                     # This file
```

## 🔐 Security

### Auditing

Before mainnet deployment:
1. Complete internal security review
2. External audit by reputable firm
3. Bug bounty program
4. Testnet deployment with significant testing period

### Best Practices

- ✅ All ETH transfers use ReentrancyGuard
- ✅ Emergency pause mechanism implemented
- ✅ Access control with Ownable pattern
- ✅ Input validation on all functions
- ✅ Safe math (Solidity 0.8.19+)
- ✅ Events for all state changes

## 📊 Revenue Split Model

**30/70 Split (30% creator, 70% platform)**

When a template is purchased for 1 ETH:
- **Creator receives**: 0.3 ETH (30%)
- **Platform receives**: 0.7 ETH (70%)

**Rationale:**
The platform provides:
- Blockchain infrastructure (Varity L3)
- CLI development tools (VarityKit)
- Marketplace platform
- AI template generation
- Decentralized storage (Filecoin/IPFS)
- Template discovery and distribution

Creators provide:
- Template code and configuration
- Industry expertise
- Template maintenance

## 🌐 Networks

### Supported Networks

| Network | Chain ID | Purpose | Status |
|---------|----------|---------|--------|
| Hardhat | 31337 | Local development | ✅ Ready |
| Arbitrum Sepolia | 421614 | Testnet | ✅ Ready |
| Varity L3 | TBD | Production | ⏳ Pending |
| Arbitrum One | 42161 | Settlement layer | 🔄 Optional |

### Network Configuration

All network configurations are in `hardhat.config.js`.

**Environment Variables Required:**
- `VARITY_L3_RPC_URL` - Varity L3 RPC endpoint
- `VARITY_L3_CHAIN_ID` - Varity L3 chain identifier
- `DEPLOYER_PRIVATE_KEY` - Deployment wallet private key
- `ARBISCAN_API_KEY` - For contract verification

## 🛠️ Development

### Compile Contracts

```bash
npm run compile
```

### Clean Artifacts

```bash
npm run clean
```

### Run Hardhat Console

```bash
npx hardhat console --network localhost
```

### Interact with Deployed Contracts

```javascript
const marketplace = await ethers.getContractAt(
  "TemplateMarketplace",
  "0xYourContractAddress"
);

const stats = await marketplace.getMarketplaceStats();
console.log("Total Templates:", stats.totalTemplates_.toString());
```

## 📚 Documentation

For more information:
- [VarityKit Documentation](../README.md)
- [Smart Contract API Reference](../docs/SMART_CONTRACTS.md)
- [Deployment Guide](../docs/DEPLOYMENT.md)
- [Security Audit](../docs/SECURITY_AUDIT.md)

## 📞 Support

- **Documentation**: https://docs.varity.ai/varietykit
- **GitHub Issues**: https://github.com/varity/varietykit/issues
- **Discord**: https://discord.gg/varity

## 📄 License

MIT License - see [LICENSE](../LICENSE) file for details.

---

**Generated with VarityKit** - The open-source template marketplace for Varity AI Dashboards
