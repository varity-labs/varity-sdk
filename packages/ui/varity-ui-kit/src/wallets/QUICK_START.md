# SmartWalletProvider - Quick Start Guide

Get gasless transactions working in 5 minutes.

## 1. Install

```bash
npm install @varity/ui-kit @varity/sdk thirdweb
```

## 2. Setup Provider

```tsx
// app/layout.tsx
import { createThirdwebClient } from 'thirdweb';
import { SmartWalletProvider, getDefaultSmartWalletConfig } from '@varity/ui-kit';

const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID!,
});

export default function Layout({ children }) {
  return (
    <SmartWalletProvider config={getDefaultSmartWalletConfig(client)}>
      {children}
    </SmartWalletProvider>
  );
}
```

## 3. Use in Component

```tsx
'use client';

import { useSmartWallet, GaslessBadge } from '@varity/ui-kit';

export function MyComponent() {
  const { sendTransaction, isGasless, isConnected } = useSmartWallet();

  async function handleClick() {
    if (!isConnected) return;

    const txHash = await sendTransaction({
      to: '0x...', // contract address
      data: '0x...', // encoded function call
      value: '0',
    });

    console.log('Transaction sent:', txHash);
  }

  return (
    <div>
      <GaslessBadge />
      <button onClick={handleClick}>Send Gasless Transaction</button>
    </div>
  );
}
```

## 4. Environment Variables

```bash
# .env.local
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your_client_id_here
```

## That's It!

Your users can now send transactions **without paying gas fees**.

## What You Get

✅ **Gasless Transactions** - Users never see gas prompts
✅ **Social Login** - Email, Google, wallet - all work
✅ **Batch Operations** - Multiple actions in one transaction
✅ **Smart Wallets** - ERC-4337 account abstraction
✅ **6-Decimal USDC** - Varity L3 native token

## Next Steps

- **Full Examples**: See [EXAMPLE_USAGE.md](./EXAMPLE_USAGE.md)
- **Deploy Contracts**: See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- **Implementation Details**: See [IMPLEMENTATION_REPORT.md](./IMPLEMENTATION_REPORT.md)

## Common Patterns

### Check if Connected

```tsx
const { isConnected, getAddress } = useSmartWallet();

if (isConnected) {
  console.log('Wallet:', getAddress());
}
```

### Send Transaction

```tsx
const { sendTransaction } = useSmartWallet();

const txHash = await sendTransaction({
  to: contractAddress,
  data: encodedFunctionCall,
  value: '0',
});
```

### Batch Transactions

```tsx
const { sendBatchTransaction } = useSmartWallet();

const txHash = await sendBatchTransaction([
  { to: '0x...', data: '0x...', value: '0' },
  { to: '0x...', data: '0x...', value: '0' },
  { to: '0x...', data: '0x...', value: '0' },
]);
```

### Deploy Wallet

```tsx
const { deployWallet, isDeployed } = useSmartWallet();

if (!isDeployed) {
  const txHash = await deployWallet();
  console.log('Wallet deployed:', txHash);
}
```

## Troubleshooting

### "Smart wallet not connected"
Call `connect()` with a personal account first.

### "Contracts not deployed"
Run deployment scripts: See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

### "Transaction failed"
Check that paymaster is funded with USDC.

## Architecture

```
User → Privy Login → Personal Wallet → Smart Wallet → Transaction → Bundler → Paymaster → Varity L3
                                            ↓
                                    No Gas Fees! ⚡
```

## Key Concepts

- **Personal Account**: EOA from Privy (email, Google, wallet)
- **Smart Wallet**: ERC-4337 account (contract on Varity L3)
- **Bundler**: Submits UserOperations to blockchain
- **Paymaster**: Sponsors gas fees (funded with USDC)
- **Factory**: Creates deterministic smart wallets

## Status

- ✅ **Implementation**: Complete (95%)
- ⚠️ **Contract Deployment**: Pending (see DEPLOYMENT_GUIDE.md)
- ⚠️ **Integration Testing**: After contract deployment
- 🎯 **MVP Launch**: Feb 2-9, 2026

---

**Need Help?**
- [Full Examples](./EXAMPLE_USAGE.md)
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)
- [Implementation Report](./IMPLEMENTATION_REPORT.md)

**Last Updated**: January 19, 2026
