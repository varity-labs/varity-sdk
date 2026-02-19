# Changelog

All notable changes to the Varity SDK will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0-alpha.2] - 2026-02-16

### Added - MCP Server & App Scaffolding

- **@varity-labs/mcp** v1.0.0 — Model Context Protocol server for AI editors
  - 7 tools: `varity_search_docs`, `varity_cost_calculator`, `varity_init`, `varity_deploy`, `varity_deploy_status`, `varity_deploy_logs`, `varity_submit_to_store`
  - Works with Cursor, Claude Code, VS Code (Copilot), and Windsurf
  - stdio transport — runs locally, no API keys required
  - Read-only tools annotated with `readOnlyHint`, destructive tools with `destructiveHint`
- **create-varity-app** v1.0.0 — `npx create-varity-app my-app` scaffolding
  - SaaS starter template with auth, database, dashboard, and payments
  - Works with npm, pnpm, and yarn

### Changed

- Documentation updated: MCP server spec, AI tools overview, beta onboarding
- Package READMEs cross-linked to `@varity-labs/mcp`

## [2.0.0-alpha.1] - 2026-01-18

### Added - Multi-Chain Support 🔗

- **ChainRegistry**: Intelligent chain selection system
  - Chain metadata with cost/speed/security ratings
  - Auto-select optimal chain based on requirements
  - Filter by gas price, TPS, privacy level, testnet status
- **Varity L3** configuration (Chain ID 33529)
  - Arbitrum Orbit rollup with USDC gas token (6 decimals)
  - RPC: https://rpc-varity-testnet-rroe52pwjp.t.conduit.xyz
  - Explorer: https://explorer-varity-testnet-rroe52pwjp.t.conduit.xyz
- **Arbitrum** support (Sepolia testnet & Arbitrum One mainnet)
- **Base** support (Sepolia testnet & Base mainnet)
- Multi-chain utility functions (formatUSDC, parseUSDC, getExplorerUrl)

### Added - Complete thirdweb Integration ⚡

#### Engine (Production Transaction Management)
- `EngineClient` for scalable transaction processing
- Automatic retry logic and webhook notifications
- Transaction queue management with status tracking
- Batch transaction support
- Gas price optimization

#### Nebula AI (AI-Powered Blockchain)
- `NebulaClient` for natural language interactions
- Generate Solidity contracts from English descriptions
- Query blockchain data with natural language
- Explain transactions in plain English
- Generate integration code (Hardhat, Foundry)
- Analyze contracts for security issues

#### Storage (Decentralized Storage)
- `StorageClient` for IPFS/Arweave uploads
- File upload with automatic pinning
- Batch uploads for multiple files
- NFT metadata handling
- Image optimization
- Progress callbacks for large files

#### Bridge (Cross-Chain Asset Transfers)
- `BridgeClient` for cross-chain swaps
- Get bridge quotes with price impact
- Execute bridging transactions
- Track bridging status
- Bridge history retrieval

#### Gateway (RPC Infrastructure)
- `GatewayClient` for production RPC access
- Load-balanced RPC requests
- WebSocket support for real-time data
- Block subscription
- Request retries and fallbacks

#### x402 (API Monetization)
- `x402Client` for pay-per-call APIs
- 70/30 revenue split (developer/platform)
- Create payment endpoints
- Track API usage and earnings
- Subscription plans

### Added - Smart Wallets & On-Ramp 🔐💳

#### Smart Wallets (ERC-4337)
- `SmartWalletProvider` React component
- Gasless transactions with paymaster support
- `useSmartWallet` React hook
- `SmartWalletConnectButton` component
- `GaslessBadge` visual indicator
- Session key support

#### Server Wallets
- `ServerWalletManager` for backend automation
- Create and manage encrypted wallets
- Sign transactions server-side
- Secure key storage

#### On-Ramp (Credit Card → Crypto)
- `OnrampWidget` component (powered by thirdweb Pay)
- `BuyUSDCButton` simple purchase button
- Support for Credit/Debit Card, Apple Pay, Google Pay
- Automatic KYC handling
- Purchase history tracking
- Transaction receipts with explorer links

### Changed

- **@varity/sdk** version bumped to 2.0.0-alpha.1
- **@varity/ui-kit** version bumped to 2.0.0-alpha.1
- **@varity/types** version bumped to 2.0.0-alpha.1
- Package.json enhanced with keywords for npm discovery
- Updated exports to include all new thirdweb features
- thirdweb dependency updated to v5.112.0
- Replaced custom transaction queue with thirdweb Engine

### Fixed

- TypeScript import error with ChainRegistry in @varity/ui-kit
- Chain configuration format (rpcUrls object structure)
- Block explorer configuration (default key required)
- Duplicate type names (ThirdwebUploadResult, ThirdwebDownloadOptions)
- Blob to File conversion in Storage client
- OnrampWidget now uses actual VARITY_USDC_ADDRESS

### Documentation

- Created comprehensive README.md for @varity/sdk
- Created comprehensive README.md for @varity/ui-kit
- Created comprehensive README.md for @varity/types
- Added inline code examples for all new features
- Documented multi-chain configuration
- Documented thirdweb integration patterns

## [2.0.0-beta.2] - Previous

### Features from Previous Releases

- 13 universal capability modules
- Template system for rapid deployment
- Analytics & forecasting with ML
- Notifications (email, SMS, Slack, push)
- Export to CSV, JSON, PDF, Excel
- Redis-like caching with TTL
- Distributed tracing and metrics
- Webhook system
- 33+ universal field types
- ISO template support
- Auto-generated CRUD UI
- Auto-generated dashboards

## Unreleased Features (Post-Alpha)

### Planned for Beta Release

- Dashboard integration (generic-template-dashboard using @varity packages)
- @varity/api-server production-ready
- @varity/core-backend production-ready
- @varity/client-js production-ready
- Complete industry template variants (finance, healthcare, retail)
- Varity Store MVP

### Planned for Month 2

- Python client completion
- Go client completion
- Multi-provider storage
- Encryption provider abstraction
- ~~MCP server for Cursor~~ → Shipped in 2.0.0-alpha.2 as `@varity-labs/mcp`

### Planned for Q2 2026

- 50+ chain support
- 100+ crypto project integrations
- Enterprise features
- Mobile apps

## Migration Guide

### Upgrading to 2.0.0-alpha.1

#### Multi-Chain Migration

```typescript
// Before (hardcoded to Varity L3)
const chain = varityL3;

// After (intelligent chain selection)
import { ChainRegistry } from '@varity/sdk';
const chain = ChainRegistry.selectChain({
  optimize: 'cost',
  requirements: { testnet: true }
});
```

#### thirdweb Engine Migration

```typescript
// Before (custom transaction queue)
await customTransactionQueue.send(tx);

// After (thirdweb Engine)
import { EngineClient } from '@varity/sdk';
const engine = new EngineClient({ engineUrl, accessToken, backendWallet });
const result = await engine.sendTransaction(tx);
```

#### On-Ramp Integration

```typescript
// New feature - add to your app
import { OnrampWidget } from '@varity/ui-kit';

<OnrampWidget
  walletAddress={user.address}
  clientId={process.env.THIRDWEB_CLIENT_ID}
  defaultAmount={100}
  onComplete={(purchase) => console.log('Purchase:', purchase)}
/>
```

## Breaking Changes

### 2.0.0-alpha.1

- ChainRegistry initialization required for multi-chain apps
- thirdweb Engine replaces custom transaction queue
- USDC decimals (6) must be handled correctly across all packages
- Package versions now use alpha tag for pre-release

## Known Issues

### 2.0.0-alpha.1

- Python/Go clients incomplete (deferred to v2)
- Multi-provider storage not yet implemented
- Varity Store not started
- Dashboard integration pending (post-alpha)
- No mainnet deployments yet (testnet only)

## Security

### Security Fixes

None in this release (first alpha).

### Security Advisories

- Always use environment variables for API keys (never hardcode)
- Enable paymaster spending limits for gasless transactions
- Audit smart contracts before mainnet deployment
- Use rate limiting on x402 payment endpoints

## License

MIT License - See [LICENSE](LICENSE) file for details.

---

**Powered by Varity** | [Website](https://varity.so) | [Documentation](https://docs.varity.so)
