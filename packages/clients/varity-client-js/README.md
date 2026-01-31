# @varity/client-js

> Comprehensive JavaScript/TypeScript SDK for Varity L3 Blockchain - Powered by Thirdweb v5.112.0

[![npm version](https://img.shields.io/npm/v/@varity/client-js.svg)](https://www.npmjs.com/package/@varity/client-js)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## Overview

`@varity/client-js` is a complete SDK for building applications on Varity L3, an Arbitrum Orbit L3 blockchain with USDC as the native gas token. This library provides:

- 🔗 **Wallet Management** - Connect MetaMask, WalletConnect, Coinbase, and more
- 📝 **Smart Contract Interactions** - Read, write, deploy, and monitor contracts
- 🔐 **SIWE Authentication** - Sign-In with Ethereum (EIP-4361)
- 📦 **IPFS Storage** - Upload and download files via Thirdweb
- ⚛️ **React Hooks** - Easy integration with React applications
- 💰 **USDC Support** - Native 6-decimal USDC handling utilities
- 🌐 **Multi-Chain** - Support for Varity L3, Arbitrum Sepolia, and Arbitrum One

## Installation

```bash
npm install @varity/client-js thirdweb
```

## Quick Start

```typescript
import { VarityClient, formatUSDC } from '@varity/client-js';

// Initialize client
const client = new VarityClient({
  clientId: 'your-thirdweb-client-id',
  chain: 'varity-l3'
});

// Connect wallet
const account = await client.wallet.connect({ walletType: 'metamask' });
console.log('Connected:', account.address);

// Get balance
const balance = await client.wallet.getBalance();
console.log('Balance:', formatUSDC(balance), 'USDC');
```

## Complete Documentation

See [examples/](./examples/) directory for comprehensive usage examples:

- `basic-usage.ts` - Basic client operations
- `contract-interaction.ts` - Smart contract interactions
- `wallet-connection.ts` - Wallet connection methods
- `siwe-auth.ts` - SIWE authentication flow
- `storage-ipfs.ts` - IPFS storage operations
- `react-app.tsx` - React application with hooks

## Chain Configuration

### Varity L3

```
Chain ID: 33529
RPC URL: https://rpc-varity-l3-testnet-wkkzw3oqsj.t.conduit.xyz
Native Currency: USDC (6 decimals)
Block Explorer: https://explorer-varity-l3-testnet-wkkzw3oqsj.t.conduit.xyz
```

## API Reference

- **VarityClient** - Main client class
- **WalletManager** - Wallet operations
- **ContractManager** - Smart contract interactions
- **SIWEAuth** - Authentication
- **StorageManager** - IPFS storage

## License

MIT License - see [LICENSE](./LICENSE) file for details.

---

**Made with ❤️ by Varity**
