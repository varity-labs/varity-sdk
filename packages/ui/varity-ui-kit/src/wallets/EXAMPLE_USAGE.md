# SmartWalletProvider - Example Usage

Complete examples showing how to use SmartWalletProvider for gasless transactions on Varity L3.

## Basic Setup

### 1. Install Dependencies

```bash
npm install @varity/ui-kit @varity/sdk thirdweb
```

### 2. Wrap Your App

```tsx
// app/layout.tsx or _app.tsx
import { createThirdwebClient } from 'thirdweb';
import { SmartWalletProvider, getDefaultSmartWalletConfig } from '@varity/ui-kit';
import { varityL3Testnet } from '@varity/sdk';

const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID!,
});

const smartWalletConfig = getDefaultSmartWalletConfig(client);

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SmartWalletProvider config={smartWalletConfig}>
          {children}
        </SmartWalletProvider>
      </body>
    </html>
  );
}
```

## Example 1: Connect Wallet & Display Status

```tsx
'use client';

import { useSmartWallet, SmartWalletConnectButton, GaslessBadge } from '@varity/ui-kit';
import { inAppWallet } from 'thirdweb/wallets';
import { createThirdwebClient } from 'thirdweb';

export function WalletStatus() {
  const { isConnected, isGasless, isDeployed, getAddress } = useSmartWallet();

  return (
    <div className="wallet-status">
      <h2>Wallet Status</h2>

      {/* Gasless badge */}
      <GaslessBadge />

      {/* Connection status */}
      <div>
        <strong>Connected:</strong> {isConnected ? '✅ Yes' : '❌ No'}
      </div>

      {isConnected && (
        <>
          <div>
            <strong>Address:</strong> {getAddress()}
          </div>
          <div>
            <strong>Deployed:</strong> {isDeployed ? '✅ Yes' : '⏳ Not yet'}
          </div>
          <div>
            <strong>Gasless:</strong> {isGasless ? '✅ Enabled' : '❌ Disabled'}
          </div>
        </>
      )}
    </div>
  );
}
```

## Example 2: Connect with Social Login (Privy)

```tsx
'use client';

import { useSmartWallet } from '@varity/ui-kit';
import { usePrivy } from '@privy-io/react-auth';
import { useEffect } from 'react';
import { createThirdwebClient } from 'thirdweb';
import { privateKeyToAccount } from 'thirdweb/wallets';

export function PrivySmartWalletConnect() {
  const { connect, isConnected } = useSmartWallet();
  const { ready, authenticated, user, exportWallet } = usePrivy();

  useEffect(() => {
    if (ready && authenticated && !isConnected) {
      connectSmartWallet();
    }
  }, [ready, authenticated, isConnected]);

  async function connectSmartWallet() {
    try {
      // Export private key from Privy embedded wallet
      const wallet = await exportWallet();

      // Create thirdweb account from private key
      const client = createThirdwebClient({
        clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID!,
      });

      const personalAccount = privateKeyToAccount({
        client,
        privateKey: wallet.privateKey,
      });

      // Connect smart wallet with personal account as admin
      await connect(personalAccount);

      console.log('✅ Smart wallet connected with Privy');
    } catch (error) {
      console.error('❌ Failed to connect smart wallet:', error);
    }
  }

  return (
    <div>
      {!authenticated ? (
        <button onClick={() => /* trigger Privy login */}>
          Login with Social
        </button>
      ) : (
        <div>
          <p>Logged in as: {user?.email?.address}</p>
          {isConnected && <p>✅ Smart wallet connected</p>}
        </div>
      )}
    </div>
  );
}
```

## Example 3: Send Gasless Transaction

```tsx
'use client';

import { useSmartWallet } from '@varity/ui-kit';
import { useState } from 'react';
import { prepareContractCall, getContract } from 'thirdweb';
import { varityL3Testnet } from '@varity/sdk';

export function SendGaslessTransaction() {
  const { sendTransaction, isConnected, isGasless } = useSmartWallet();
  const [status, setStatus] = useState('');

  async function handleSendTransaction() {
    if (!isConnected) {
      alert('Please connect wallet first');
      return;
    }

    try {
      setStatus('Preparing transaction...');

      // Example: Call a contract function
      const contractAddress = '0x...'; // Your contract address

      // Prepare transaction data
      const txHash = await sendTransaction({
        to: contractAddress,
        data: '0x...', // Encoded function call
        value: '0', // Amount in wei
      });

      setStatus(`✅ Transaction sent: ${txHash}`);
      console.log('Transaction hash:', txHash);

      // If gasless, user didn't pay any gas!
      if (isGasless) {
        console.log('🎉 Gasless transaction successful!');
      }
    } catch (error) {
      setStatus(`❌ Transaction failed: ${error.message}`);
      console.error(error);
    }
  }

  return (
    <div>
      <h3>Send Gasless Transaction</h3>

      {isGasless && (
        <p style={{ color: 'green' }}>
          ⚡ Gasless mode enabled - no gas fees for users!
        </p>
      )}

      <button onClick={handleSendTransaction} disabled={!isConnected}>
        Send Transaction
      </button>

      {status && <p>{status}</p>}
    </div>
  );
}
```

## Example 4: Deploy Smart Wallet

```tsx
'use client';

import { useSmartWallet } from '@varity/ui-kit';
import { useState } from 'react';

export function DeploySmartWallet() {
  const { deployWallet, isDeployed, isConnected } = useSmartWallet();
  const [deploying, setDeploying] = useState(false);

  async function handleDeploy() {
    if (!isConnected) {
      alert('Please connect wallet first');
      return;
    }

    if (isDeployed) {
      alert('Wallet already deployed!');
      return;
    }

    try {
      setDeploying(true);
      console.log('Deploying smart wallet...');

      const txHash = await deployWallet();

      console.log('✅ Wallet deployed:', txHash);
      alert('Smart wallet deployed successfully!');
    } catch (error) {
      console.error('❌ Deployment failed:', error);
      alert(`Deployment failed: ${error.message}`);
    } finally {
      setDeploying(false);
    }
  }

  return (
    <div>
      <h3>Smart Wallet Deployment</h3>

      <div>
        <strong>Status:</strong>{' '}
        {isDeployed ? '✅ Deployed' : '⏳ Not deployed yet'}
      </div>

      {!isDeployed && (
        <button onClick={handleDeploy} disabled={!isConnected || deploying}>
          {deploying ? 'Deploying...' : 'Deploy Smart Wallet'}
        </button>
      )}

      <p>
        <small>
          Note: First transaction will automatically deploy the wallet if needed
        </small>
      </p>
    </div>
  );
}
```

## Example 5: Batch Transactions

```tsx
'use client';

import { useSmartWallet } from '@varity/ui-kit';
import { useState } from 'react';

export function BatchTransactions() {
  const { sendBatchTransaction, isConnected } = useSmartWallet();
  const [status, setStatus] = useState('');

  async function handleBatchSend() {
    if (!isConnected) {
      alert('Please connect wallet first');
      return;
    }

    try {
      setStatus('Preparing batch transaction...');

      // Example: Multiple operations in one transaction
      const transactions = [
        {
          to: '0x...', // Contract 1
          data: '0x...', // Function call 1
          value: '0',
        },
        {
          to: '0x...', // Contract 2
          data: '0x...', // Function call 2
          value: '0',
        },
        {
          to: '0x...', // Contract 3
          data: '0x...', // Function call 3
          value: '0',
        },
      ];

      const txHash = await sendBatchTransaction(transactions);

      setStatus(`✅ Batch transaction sent: ${txHash}`);
      console.log('🎉 3 operations in 1 transaction!');
    } catch (error) {
      setStatus(`❌ Batch transaction failed: ${error.message}`);
      console.error(error);
    }
  }

  return (
    <div>
      <h3>Batch Transactions</h3>
      <p>Execute multiple operations in a single transaction</p>

      <button onClick={handleBatchSend} disabled={!isConnected}>
        Send Batch (3 operations)
      </button>

      {status && <p>{status}</p>}
    </div>
  );
}
```

## Example 6: Complete Dashboard Integration

```tsx
'use client';

import { createThirdwebClient } from 'thirdweb';
import { SmartWalletProvider, useSmartWallet, getDefaultSmartWalletConfig } from '@varity/ui-kit';
import { PrivyProvider, usePrivy } from '@privy-io/react-auth';
import { varityL3Testnet } from '@varity/sdk';

// Create client
const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID!,
});

// App wrapper with all providers
export function DashboardApp({ children }: { children: React.ReactNode }) {
  const smartWalletConfig = getDefaultSmartWalletConfig(client);

  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
      config={{
        loginMethods: ['email', 'google', 'wallet'],
        appearance: {
          theme: 'light',
        },
      }}
    >
      <SmartWalletProvider config={smartWalletConfig}>
        <DashboardContent>{children}</DashboardContent>
      </SmartWalletProvider>
    </PrivyProvider>
  );
}

// Dashboard content with wallet integration
function DashboardContent({ children }: { children: React.ReactNode }) {
  const { authenticated } = usePrivy();
  const { isConnected, isGasless, getAddress } = useSmartWallet();

  return (
    <div className="dashboard">
      {/* Header */}
      <header>
        <h1>My Dashboard</h1>
        {authenticated && isConnected && (
          <div>
            <span>{getAddress()?.slice(0, 6)}...{getAddress()?.slice(-4)}</span>
            {isGasless && <span>⚡ Gasless</span>}
          </div>
        )}
      </header>

      {/* Main content */}
      <main>{children}</main>
    </div>
  );
}
```

## Environment Variables

Create a `.env.local` file:

```bash
# thirdweb
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your_thirdweb_client_id

# Privy (optional, for social login)
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id

# Conduit Bundler (optional, uses default if not set)
NEXT_PUBLIC_CONDUIT_BUNDLER_URL=https://api.conduit.xyz/bundler/33529

# Custom Paymaster (optional, uses thirdweb if not set)
NEXT_PUBLIC_PAYMASTER_URL=https://your-paymaster.com
```

## Testing Checklist

- [ ] Connect wallet with Privy social login
- [ ] Smart wallet address displayed
- [ ] Gasless badge shown
- [ ] Send transaction without gas fees
- [ ] Deploy smart wallet contract
- [ ] Execute batch transactions
- [ ] Verify transactions on Varity L3 explorer

## Common Patterns

### Check if contracts are deployed

```tsx
import { areContractsDeployed } from '@varity/ui-kit';

if (!areContractsDeployed()) {
  console.error('⚠️ Smart wallet contracts not deployed!');
  console.log('See DEPLOYMENT_GUIDE.md for instructions');
}
```

### Custom gasless configuration

```tsx
import { createThirdwebClient } from 'thirdweb';
import { SmartWalletProvider } from '@varity/ui-kit';
import { varityL3Testnet } from '@varity/sdk';

const customConfig = {
  client: createThirdwebClient({ clientId: '...' }),
  chain: varityL3Testnet,
  gasless: {
    enabled: true,
    policy: {
      sponsorAll: false,
      maxGasLimit: '300000',
      allowedContracts: [
        '0x...', // Only sponsor these contracts
        '0x...',
      ],
    },
  },
  factoryAddress: '0x...', // Your factory
  accountVersion: '0.6' as const,
};

<SmartWalletProvider config={customConfig}>
  <App />
</SmartWalletProvider>
```

## Troubleshooting

### "Smart wallet not connected"
**Solution**: Ensure `connect()` is called with a valid personal account

### "Transaction failed"
**Solution**: Check that:
- Wallet is connected
- Smart wallet is deployed (or will deploy on first tx)
- Paymaster is funded
- Transaction data is valid

### "Gasless not working"
**Solution**: Verify:
- `sponsorGas: true` in config
- Paymaster has USDC balance
- Bundler endpoint is correct

## Next Steps

1. **Deploy Contracts**: Follow [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
2. **Integrate Authentication**: Add Privy or other auth provider
3. **Build UI**: Use the examples above as templates
4. **Test Gasless Flow**: Verify end-to-end user experience
5. **Monitor Usage**: Track paymaster USDC consumption

## Resources

- [SmartWalletProvider API Reference](./SmartWalletProvider.tsx)
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)
- [thirdweb Smart Wallet Docs](https://portal.thirdweb.com/smart-wallet)
- [Varity L3 Explorer](https://explorer-varity-testnet-rroe52pwjp.t.conduit.xyz)

---

**Last Updated**: January 19, 2026
**Status**: Implementation Complete (contracts pending deployment)
