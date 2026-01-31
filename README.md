# Varity SDK

> The Operating System for Web3 - Build ANY real-world app on decentralized infrastructure

Varity SDK is the complete open-source toolkit for deploying production applications on Varity L3 (Arbitrum Orbit rollup, Chain ID 33529). One command to deploy, complete thirdweb integration, and seamless cloud migration with 70-85% cost savings vs AWS.

**Current Status:** 🚀 **Alpha Released (2.0.0-alpha.1)** - Core packages complete, ready for comprehensive testing

## Vision: The OS for Web3

Varity is building the operating system for Web3 - aggregating all crypto projects together so developers can build ANY application on decentralized infrastructure with plug-and-play access to blockchains, DePin networks, privacy tools, and more.

Just as traditional operating systems provide unified access to hardware, Varity provides unified access to Web3 infrastructure.

### Three Strategic Pillars

1. **Vibe Coding Integration** - Make Varity the default deployment target for AI coding tools (92% of US developers use AI tools daily)
2. **Varity Store** - Cross-chain decentralized app marketplace with open-source LLMs, rivaling ChatGPT Store
3. **Developer-First Ecosystem** - Open-source packages (MIT), cost savings, provable privacy, no vendor lock-in

## 🎉 What's New in Alpha 1 (2.0.0-alpha.1)

### ✅ Core Packages Complete & Published

Three packages are now **production-ready** and available on npm with `@alpha` tag:

- **@varity/sdk** - Complete Web3 SDK with multi-chain support and full thirdweb integration
- **@varity/ui-kit** - 108+ React components including on-ramp widgets and smart wallets
- **@varity/types** - Comprehensive TypeScript definitions

### 🔗 Multi-Chain Architecture (Varity L3 Focus for MVP)

**Implemented (in packages):**
- ChainRegistry with intelligent chain selection
- Varity L3 Testnet (Chain ID 33529) - **PRIMARY DEPLOYMENT TARGET**
- Arbitrum (Sepolia + Mainnet) - infrastructure ready
- Base (Sepolia + Mainnet) - infrastructure ready

**MVP Deployment Strategy:**
- **Varity L3 ONLY** for initial launch (testnet)
- Multi-chain capability exists in packages but not exposed until revenue model finalized
- Developers build "real world apps" and deploy exclusively to Varity L3 Arbitrum rollup

### ⚡ Complete thirdweb Integration

All 7 thirdweb infrastructure components integrated:

1. **Engine** - Production transaction management (replaces custom queue)
2. **Nebula AI** - Natural language blockchain interactions
3. **Storage** - IPFS/Arweave decentralized storage
4. **Bridge** - Cross-chain asset transfers
5. **Gateway** - Production RPC infrastructure
6. **x402** - API monetization (70/30 revenue split)
7. **Smart Wallets** - ERC-4337 gasless transactions

### 💳 On-Ramp & Payment Infrastructure

- **OnrampWidget** - Credit card to USDC conversion (thirdweb Pay)
- **BuyUSDCButton** - Simple purchase integration
- Support: Credit/Debit Card, Apple Pay, Google Pay
- Seamless UX (users don't realize everything is on-chain)

## Quick Start

```bash
# Install alpha packages
npm install @varity/sdk@alpha @varity/ui-kit@alpha

# Initialize Varity SDK
import { createVaritySDK, varityL3Testnet } from '@varity/sdk';

const sdk = createVaritySDK({
  network: 'testnet',
  thirdwebClientId: 'your-client-id'
});

// Deploy to Varity L3
const contract = await sdk.deployContract({
  chain: varityL3Testnet,
  contractType: 'nft-collection'
});
```

## Varity L3 Network (Testnet)

| Property | Value |
|----------|-------|
| Chain ID | 33529 |
| RPC | https://rpc-varity-testnet-rroe52pwjp.t.conduit.xyz |
| Explorer | https://explorer-varity-testnet-rroe52pwjp.t.conduit.xyz |
| Native Token | Bridged USDC (6 decimals) |
| Framework | Arbitrum Orbit |
| Data Availability | Celestia |

### 🔧 Installed Infrastructure Apps (Conduit Marketplace)

The following 6 apps are installed on Varity L3 and **must be verified** before production launch:

1. **Conduit Bundler** - ERC-4337 account abstraction bundler
   - Status: Installed ✅ | Integration: Pending ⏳
   - Required for: SmartWalletProvider, gasless transactions

2. **thirdweb** - Chain abstraction and developer tools
   - Status: Installed ✅ | Integration: Complete ✅
   - All 7 thirdweb features integrated in packages

3. **Privy** - Authentication (email, social, wallet)
   - Status: Installed ✅ | Integration: Pending ⏳
   - Required for: User authentication in dashboards

4. **ZeroDev** - Smart wallet infrastructure
   - Status: Installed ✅ | Integration: Pending ⏳
   - Alternative to Conduit Bundler for account abstraction

5. **Decent** - Cross-chain bridging
   - Status: Installed ✅ | Integration: Pending ⏳
   - Required for: Bridging assets to Varity L3

6. **Superbridge** - Optimistic rollup bridging
   - Status: Installed ✅ | Integration: Pending ⏳
   - Required for: L1 ↔ L2 asset transfers

**Next Step:** Comprehensive integration testing of all 6 apps with @varity packages before open-source release.

## Package Status

### ✅ Complete (Alpha Released)

| Package | Version | Status | Documentation |
|---------|---------|--------|---------------|
| **@varity/sdk** | 2.0.0-alpha.1 | ✅ Published | [README](packages/core/varity-sdk/README.md) |
| **@varity/ui-kit** | 2.0.0-alpha.1 | ✅ Published | [README](packages/ui/varity-ui-kit/README.md) |
| **@varity/types** | 2.0.0-alpha.1 | ✅ Published | [README](packages/core/varity-types/README.md) |

### 🔄 In Progress (Post-Alpha)

| Package | Completion | Priority | Notes |
|---------|------------|----------|-------|
| @varity/client-js | 85% | High | API client for JavaScript |
| @varity/api-server | 90% | Medium | Backend API framework |
| @varity/core-backend | 70% | Medium | Business logic services |
| @varity/migrate | 90% | Low | Cloud migration tools |
| @varity/s3-gateway | 85% | Low | S3-compatible API |
| @varity/gcs-gateway | 88% | Low | GCS-compatible API |

### ⏳ Deferred (Month 2+)

| Package | Completion | Timeline |
|---------|------------|----------|
| @varity/client-python | 60% | Month 2 |
| @varity/client-go | 40% | Month 2 |
| @varity/monitoring | 88% | Month 2 |

## Why Varity?

### Cost Savings vs AWS

| Scenario | AWS | Varity | Savings |
|----------|-----|--------|---------|
| 100 users + AI | $2,800/mo | ~$800/mo | ~70% |
| Storage (1TB) | $230/mo | $23/mo | 90% |
| Compute | $500/mo | $150/mo | 70% |
| Database | $300/mo | $50/mo | 83% |

### Developer Experience

- **One command deploy**: `varietykit deploy run` (coming in CLI v2)
- **Zero config**: Works out of the box
- **Varity L3 native**: Optimized for Arbitrum Orbit rollup
- **AI-first**: Built for vibe coding tools (Cursor, v0, Bolt)

### Technology Stack

- **thirdweb v5** - Function-based chain abstraction (ALL features integrated)
- **Privy** - Email/social/wallet authentication (installed on Varity L3)
- **Akash Network** - Decentralized compute
- **Filecoin/IPFS** - Decentralized storage (via thirdweb Storage)
- **Lit Protocol** - Wallet-based encryption

## Installation

```bash
# Core SDK with multi-chain support
npm install @varity/sdk@alpha

# React UI components (on-ramp, smart wallets, dashboards)
npm install @varity/ui-kit@alpha

# TypeScript types
npm install @varity/types@alpha

# All at once
npm install @varity/sdk@alpha @varity/ui-kit@alpha @varity/types@alpha
```

## Example: Deploy on Varity L3

```typescript
import { createVaritySDK, varityL3Testnet, EngineClient } from '@varity/sdk';
import { OnrampWidget, SmartWalletProvider } from '@varity/ui-kit';

// Initialize SDK
const sdk = createVaritySDK({
  network: 'testnet',
  thirdwebClientId: process.env.THIRDWEB_CLIENT_ID
});

// Use thirdweb Engine for production transactions
const engine = new EngineClient({
  engineUrl: 'https://engine.thirdweb.com',
  accessToken: process.env.ENGINE_ACCESS_TOKEN,
  backendWallet: process.env.BACKEND_WALLET
});

// Deploy contract to Varity L3
const contract = await sdk.deployContract({
  chain: varityL3Testnet,
  contractType: 'marketplace',
  name: 'My Marketplace'
});

// React: Add on-ramp for credit card purchases
function App() {
  return (
    <SmartWalletProvider config={{ chain: varityL3Testnet, gasless: true }}>
      <OnrampWidget
        walletAddress={user.address}
        clientId={process.env.THIRDWEB_CLIENT_ID}
        defaultAmount={100}
        onComplete={(purchase) => console.log('Purchased:', purchase)}
      />
    </SmartWalletProvider>
  );
}
```

## Next Steps (Pre-Launch Testing)

### Critical Path to Open Source Release

1. **✅ Core Packages Complete** (January 18, 2026)
   - @varity/sdk, @varity/ui-kit, @varity/types published to npm@alpha

2. **⏳ Integration Testing** (Week of January 19, 2026)
   - Test all 6 Conduit marketplace apps with @varity packages
   - Verify Conduit Bundler + ZeroDev (account abstraction)
   - Verify Privy authentication flows
   - Verify Decent + Superbridge (bridging to Varity L3)
   - End-to-end testing: on-ramp → smart wallet → contract deployment

3. **⏳ Example App Testing** (Week of January 26, 2026)
   - Rebuild generic-template-dashboard using ONLY @varity packages
   - Deploy example app to Varity L3 testnet
   - Document 100% package usage

4. **⏳ Documentation & Launch** (Week of February 2, 2026)
   - Complete API documentation
   - Create video tutorials
   - Write migration guide (AWS → Varity)
   - Open-source on GitHub (MIT License)
   - Announce on Twitter, Discord, dev forums

## Revenue Model (To Be Finalized)

**Current Status:** Multi-chain infrastructure implemented in packages, but NOT exposed in MVP

**Why?** Need to finalize business model before enabling multi-chain deployments:
- How do we monetize deployments to other chains?
- Do we charge per-chain or flat fee?
- What's the pricing for Varity L3 vs other chains?

**Decision:** MVP launch focuses exclusively on Varity L3 until revenue model is determined.

## Documentation

- **SDK Reference**: [packages/core/varity-sdk/README.md](packages/core/varity-sdk/README.md)
- **UI Kit Components**: [packages/ui/varity-ui-kit/README.md](packages/ui/varity-ui-kit/README.md)
- **Type Definitions**: [packages/core/varity-types/README.md](packages/core/varity-types/README.md)
- **Changelog**: [CHANGELOG.md](CHANGELOG.md)
- **Technical Guide**: [CLAUDE.md](CLAUDE.md) (for AI assistants)

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

**Before contributing:**
1. Read the [CLAUDE.md](CLAUDE.md) technical reference
2. Check [CHANGELOG.md](CHANGELOG.md) for recent changes
3. Review open issues on GitHub

## Community & Support

- **Documentation**: https://docs.varity.ai (coming soon)
- **Discord**: https://discord.gg/varity (coming soon)
- **Twitter**: https://twitter.com/VarityLabs (coming soon)
- **GitHub Issues**: https://github.com/varity-labs/varity-sdk/issues (after open-source)
- **Email**: support@varity.ai

## License

MIT License - See [LICENSE](LICENSE) file for details.

**Powered by Varity** - making Web3 infrastructure accessible to every developer.

---

**Status**: 🧪 Alpha Testing (2.0.0-alpha.1) - Not yet open-sourced. Comprehensive testing in progress.
