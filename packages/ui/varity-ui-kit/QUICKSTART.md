# Quick Start Guide

Get started with Varity UI Kit in under 5 minutes. Build gasless transaction apps with zero configuration.

## Fastest Way (Recommended for Beginners)

Perfect for prototyping and getting started. Uses shared development credentials - no setup required.

### 1. Install

```bash
npm install @varity/ui-kit @varity/sdk
```

### 2. Wrap Your App

```tsx
import { SimpleSmartWallet } from '@varity/ui-kit';

export default function App() {
  return (
    <SimpleSmartWallet appId="your-app-id">
      <YourApp />
    </SimpleSmartWallet>
  );
}
```

### 3. Use Wallet

```tsx
import { useSmartWallet } from '@varity/ui-kit';

function YourApp() {
  const { sendTransaction, getAddress, isConnected } = useSmartWallet();

  const handleSendTransaction = async () => {
    const txHash = await sendTransaction({
      to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      data: '0x',
      value: '1000000', // 1 USDC (6 decimals)
    });

    console.log('Transaction sent:', txHash);
  };

  return (
    <div>
      <h1>My Gasless App</h1>
      {isConnected && <p>Wallet: {getAddress()}</p>}
      <button onClick={handleSendTransaction}>
        Send Gasless Transaction
      </button>
    </div>
  );
}
```

That's it! Your app now has:
- Gasless transactions (Varity pays gas)
- Smart wallet (ERC-4337)
- Email/social login (via Privy)
- Automatic gas tracking for billing

---

## Advanced Setup

For full control over authentication, chain configuration, and wallet management, use the underlying providers.

### Full Provider Stack

```tsx
import { PrivyStack, SmartWalletProvider } from '@varity/ui-kit';
import { createThirdwebClient } from 'thirdweb';
import { varityL3Testnet } from '@varity/sdk';

const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID
});

export default function App() {
  return (
    <PrivyStack
      appId={process.env.PRIVY_APP_ID}
      thirdwebClientId={process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID}
      loginMethods={['email', 'google', 'wallet']}
      appearance={{
        theme: 'light',
        accentColor: '#2563EB',
        logo: '/logo.png'
      }}
    >
      <SmartWalletProvider
        config={{
          client,
          chain: varityL3Testnet,
          gasless: {
            enabled: true,
            paymasterUrl: 'https://aa.conduit.xyz/api/v3/60cd06d8-a734-453c-84e9-5387c315ee2e/chain/33529',
          },
          appIdentifier: {
            appId: 'your-app-id',
            developerWallet: '0x...',
          },
          gasTracking: {
            enabled: true,
            apiUrl: 'https://api.varity.so/v1/gas',
          },
        }}
      >
        <YourApp />
      </SmartWalletProvider>
    </PrivyStack>
  );
}
```

### Custom Chain Configuration

```tsx
import { SimpleSmartWallet } from '@varity/ui-kit';
import { varityL3Testnet, arbitrumSepolia } from '@varity/sdk';

// SimpleSmartWallet only supports Varity L3 by default
// For custom chains, use SmartWalletProvider
```

---

## Component Options

### SimpleSmartWallet Props

```tsx
interface SimpleSmartWalletProps {
  // Required
  appId: string; // Your app ID from Varity App Store

  // Optional
  developerWallet?: string; // Developer wallet for gas billing
  gasless?: boolean; // Enable gasless transactions (default: true)
  thirdwebClientId?: string; // Custom thirdweb client ID
  trackGas?: boolean; // Enable gas tracking (default: true in production)
  children: React.ReactNode;
}
```

### Usage Examples

#### Zero Configuration (Development)

```tsx
<SimpleSmartWallet appId="my-app-id">
  <App />
</SimpleSmartWallet>
```

#### With Custom Developer Wallet

```tsx
<SimpleSmartWallet
  appId="my-app-id"
  developerWallet="0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
>
  <App />
</SimpleSmartWallet>
```

#### Production Setup

```tsx
<SimpleSmartWallet
  appId="my-app-id"
  thirdwebClientId={process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID}
  trackGas={true}
>
  <App />
</SimpleSmartWallet>
```

---

## Hooks

### useSmartWallet

Access smart wallet functionality from any component.

```tsx
import { useSmartWallet } from '@varity/ui-kit';

function MyComponent() {
  const {
    account,           // Smart wallet account
    isConnected,       // Connection status
    isGasless,         // Gasless mode enabled
    connect,           // Connect smart wallet
    disconnect,        // Disconnect wallet
    sendTransaction,   // Send single transaction
    sendBatchTransaction, // Send multiple transactions
    getAddress,        // Get wallet address
    isDeployed,        // Check if wallet is deployed
    deployWallet,      // Deploy smart wallet
  } = useSmartWallet();

  return (
    <div>
      <p>Connected: {isConnected ? 'Yes' : 'No'}</p>
      <p>Gasless: {isGasless ? 'Yes' : 'No'}</p>
      {isConnected && <p>Address: {getAddress()}</p>}
    </div>
  );
}
```

### Send Transaction

```tsx
const { sendTransaction } = useSmartWallet();

// Send USDC (6 decimals)
const txHash = await sendTransaction({
  to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
  data: '0x',
  value: '1000000', // 1 USDC
});
```

### Batch Transactions

```tsx
const { sendBatchTransaction } = useSmartWallet();

// Send multiple transactions in one call
const txHash = await sendBatchTransaction([
  {
    to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    data: '0x',
    value: '1000000',
  },
  {
    to: '0x...',
    data: '0x...',
    value: '0',
  },
]);
```

---

## Authentication

SimpleSmartWallet does NOT include authentication. For authentication, use PrivyStack:

```tsx
import { PrivyStack, SimpleSmartWallet } from '@varity/ui-kit';

export default function App() {
  return (
    <PrivyStack>
      <SimpleSmartWallet appId="my-app-id">
        <YourApp />
      </SimpleSmartWallet>
    </PrivyStack>
  );
}
```

### Login Button

```tsx
import { useLogin } from '@privy-io/react-auth';

function LoginButton() {
  const { login } = useLogin();

  return (
    <button onClick={login}>
      Login with Email
    </button>
  );
}
```

---

## Production Checklist

Before deploying to production:

1. **Get Custom Credentials**
   - Privy App ID: https://dashboard.privy.io
   - thirdweb Client ID: https://thirdweb.com/dashboard

2. **Set Environment Variables**
   ```bash
   # .env.local
   PRIVY_APP_ID=your-privy-app-id
   NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your-thirdweb-client-id
   ```

3. **Update Code**
   ```tsx
   <SimpleSmartWallet
     appId="my-app-id"
     thirdwebClientId={process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID}
   >
     <App />
   </SimpleSmartWallet>
   ```

4. **Enable Gas Tracking**
   ```tsx
   <SimpleSmartWallet
     appId="my-app-id"
     trackGas={true} // Automatic in production
   >
     <App />
   </SimpleSmartWallet>
   ```

5. **Test on Varity L3 Testnet** (Chain ID 33529)
   - RPC: https://rpc-varity-testnet-rroe52pwjp.t.conduit.xyz
   - Explorer: https://explorer-varity-testnet-rroe52pwjp.t.conduit.xyz

---

## Common Patterns

### Check Connection Status

```tsx
import { useSmartWallet } from '@varity/ui-kit';

function ConnectionStatus() {
  const { isConnected, getAddress } = useSmartWallet();

  if (!isConnected) {
    return <p>Not connected</p>;
  }

  return <p>Connected: {getAddress()}</p>;
}
```

### Send USDC

```tsx
import { useSmartWallet } from '@varity/ui-kit';
import { parseUSDC } from '@varity/sdk';

function SendUSDC() {
  const { sendTransaction } = useSmartWallet();

  const sendUSDC = async (to: string, amount: string) => {
    // Parse USDC (6 decimals)
    const value = parseUSDC(amount);

    const txHash = await sendTransaction({
      to,
      data: '0x',
      value: value.toString(),
    });

    console.log('Sent', amount, 'USDC to', to, '- tx:', txHash);
  };

  return (
    <button onClick={() => sendUSDC('0x...', '10.5')}>
      Send 10.5 USDC
    </button>
  );
}
```

### Loading State

```tsx
import { useState } from 'react';
import { useSmartWallet } from '@varity/ui-kit';

function SendButton() {
  const { sendTransaction } = useSmartWallet();
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    setLoading(true);
    try {
      await sendTransaction({
        to: '0x...',
        data: '0x',
        value: '1000000',
      });
    } catch (error) {
      console.error('Transaction failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleSend} disabled={loading}>
      {loading ? 'Sending...' : 'Send Transaction'}
    </button>
  );
}
```

---

## Next Steps

- [API Reference](/docs/api) - Complete API documentation
- [Examples](/examples) - Copy-paste real-world apps
- [Provider Guide](/docs/providers) - When to use which provider
- [Smart Wallet Guide](/docs/smart-wallets) - Advanced smart wallet configuration
- [Gas Tracking](/docs/gas-tracking) - Understanding gas billing

---

## Need Help?

- Documentation: https://docs.varity.io
- Discord: https://discord.gg/varity
- Support: support@varity.io
- GitHub: https://github.com/varity-labs/varity-sdk
