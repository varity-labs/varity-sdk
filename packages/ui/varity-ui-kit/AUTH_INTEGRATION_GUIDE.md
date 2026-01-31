# Varity Authentication Integration Guide

**Quick Start**: Get authentication working in 5 minutes

---

## Installation

```bash
npm install @varity/ui-kit@alpha @varity/sdk@alpha
```

---

## Basic Setup (Zero Config)

The simplest way to add authentication to your app:

```tsx
// src/App.tsx
import { PrivyStack } from '@varity/ui-kit';

function App() {
  return (
    <PrivyStack>
      {/* Your app components */}
      <YourApp />
    </PrivyStack>
  );
}

export default App;
```

**That's it!** PrivyStack automatically uses shared development credentials. No API keys needed for development.

---

## Using Authentication

### 1. Check Authentication Status

```tsx
import { useWalletSync } from '@varity/ui-kit';

function MyComponent() {
  const { address, isAuthenticated, isLoading, authMethod } = useWalletSync();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }

  return (
    <div>
      <p>Welcome!</p>
      <p>Wallet: {address}</p>
      <p>Logged in with: {authMethod}</p>
    </div>
  );
}
```

---

### 2. Login/Logout Buttons

```tsx
import { usePrivy } from '@varity/ui-kit';

function LoginButton() {
  const { login, logout, authenticated } = usePrivy();

  if (authenticated) {
    return <button onClick={logout}>Logout</button>;
  }

  return <button onClick={login}>Login</button>;
}
```

---

### 3. Backend Session Management (Optional)

For apps that need backend authentication:

```tsx
import { useWalletAuth } from '@varity/ui-kit';

function MyComponent() {
  const {
    isAuthenticated,
    sessionToken,
    walletAddress,
    login,
    logout,
    authFetch,
  } = useWalletAuth({
    apiBaseUrl: 'https://api.example.com',
    autoLogin: true, // Auto-login when Privy authenticates
  });

  const fetchData = async () => {
    // authFetch automatically includes session token
    const response = await authFetch('/api/v1/data');
    const data = await response.json();
    return data;
  };

  return (
    <div>
      {!isAuthenticated ? (
        <button onClick={login}>Sign In with Wallet</button>
      ) : (
        <>
          <p>Signed in: {walletAddress}</p>
          <button onClick={fetchData}>Fetch Data</button>
          <button onClick={logout}>Sign Out</button>
        </>
      )}
    </div>
  );
}
```

---

### 4. Smart Wallet (Gasless Transactions)

```tsx
import { SmartWalletProvider, useSmartWallet } from '@varity/ui-kit';
import { createThirdwebClient } from 'thirdweb';
import { varityL3Testnet, VARITY_DEV_CREDENTIALS } from '@varity/sdk';

const client = createThirdwebClient({
  clientId: VARITY_DEV_CREDENTIALS.thirdweb.clientId,
});

const smartWalletConfig = {
  client,
  chain: varityL3Testnet,
  factoryAddress: '0x85AB92708CB4d921f5c2BdCCd7f2D0813a380f71',
  gasless: { enabled: true },
};

function App() {
  return (
    <PrivyStack>
      <SmartWalletProvider config={smartWalletConfig}>
        <YourApp />
      </SmartWalletProvider>
    </PrivyStack>
  );
}

function SendTransaction() {
  const { sendTransaction, isGasless } = useSmartWallet();

  const handleSend = async () => {
    const txHash = await sendTransaction({
      to: '0x...',
      data: '0x...',
    });
    console.log('Transaction sent:', txHash);
  };

  return (
    <div>
      <button onClick={handleSend}>Send Transaction</button>
      {isGasless && <span>⚡ Gasless</span>}
    </div>
  );
}
```

---

## Complete Example

```tsx
import {
  PrivyStack,
  useWalletSync,
  useWalletAuth,
  SmartWalletProvider,
  useSmartWallet,
} from '@varity/ui-kit';
import { createThirdwebClient } from 'thirdweb';
import { varityL3Testnet, VARITY_DEV_CREDENTIALS } from '@varity/sdk';

const client = createThirdwebClient({
  clientId: VARITY_DEV_CREDENTIALS.thirdweb.clientId,
});

const smartWalletConfig = {
  client,
  chain: varityL3Testnet,
  gasless: { enabled: true },
};

function Dashboard() {
  const { address, isAuthenticated, isLoading } = useWalletSync();
  const { sessionToken } = useWalletAuth({ autoLogin: true });
  const { sendTransaction, isGasless, isDeployed } = useSmartWallet();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <div>Please log in to continue</div>;
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <div>
        <p>Wallet: {address}</p>
        <p>Session: {sessionToken ? 'Active' : 'None'}</p>
        <p>Smart Wallet: {isDeployed ? 'Deployed' : 'Not deployed'}</p>
        <p>Gasless: {isGasless ? 'Yes' : 'No'}</p>
      </div>

      <button onClick={async () => {
        const tx = await sendTransaction({
          to: '0x...',
          data: '0x...',
        });
        alert(`Transaction sent: ${tx}`);
      }}>
        Send Gasless Transaction
      </button>
    </div>
  );
}

function App() {
  return (
    <PrivyStack>
      <SmartWalletProvider config={smartWalletConfig}>
        <Dashboard />
      </SmartWalletProvider>
    </PrivyStack>
  );
}

export default App;
```

---

## Production Setup

For production, use your own credentials:

```tsx
// .env.local
NEXT_PUBLIC_PRIVY_APP_ID=your-privy-app-id
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your-thirdweb-client-id

// src/App.tsx
<PrivyStack
  appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID}
  thirdwebClientId={process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID}
>
  <YourApp />
</PrivyStack>
```

Get credentials:
- **Privy**: https://dashboard.privy.io
- **thirdweb**: https://thirdweb.com/dashboard

---

## Advanced Configuration

### Custom Login Methods

```tsx
<PrivyStack
  loginMethods={['email', 'google', 'wallet']}
  appearance={{
    theme: 'dark',
    accentColor: '#7C3AED',
    logo: '/logo.png',
  }}
>
  <YourApp />
</PrivyStack>
```

---

### Custom Chains

```tsx
import { base, arbitrum } from 'thirdweb/chains';

<PrivyStack
  chains={[varityL3Testnet, base, arbitrum]}
>
  <YourApp />
</PrivyStack>
```

---

### Track Wallet Changes

```tsx
<PrivyStack
  onAddressChange={(address) => {
    console.log('Wallet changed:', address);
    if (address) {
      // User connected
      localStorage.setItem('last_wallet', address);
    } else {
      // User disconnected
      localStorage.removeItem('last_wallet');
    }
  }}
>
  <YourApp />
</PrivyStack>
```

---

### Multi-Device Session Management

```tsx
import { useWalletAuth } from '@varity/ui-kit';

function SessionManager() {
  const {
    sessions,
    getSessions,
    logoutFromSession,
    logoutFromAllDevices,
  } = useWalletAuth();

  useEffect(() => {
    getSessions(); // Load all active sessions
  }, []);

  return (
    <div>
      <h2>Active Sessions ({sessions.length})</h2>
      {sessions.map(session => (
        <div key={session.session_token}>
          <p>Device: {session.metadata.user_agent}</p>
          <p>Created: {new Date(session.created_at * 1000).toLocaleString()}</p>
          <button onClick={() => logoutFromSession(session.session_token)}>
            Logout
          </button>
        </div>
      ))}
      <button onClick={logoutFromAllDevices}>
        Logout All Devices
      </button>
    </div>
  );
}
```

---

### Batch Transactions

```tsx
import { useSmartWallet } from '@varity/ui-kit';

function BatchTransfer() {
  const { sendBatchTransaction } = useSmartWallet();

  const handleBatch = async () => {
    const txHash = await sendBatchTransaction([
      { to: '0x...', data: '0x...', value: '0' },
      { to: '0x...', data: '0x...', value: '0' },
      { to: '0x...', data: '0x...', value: '0' },
    ]);
    console.log('Batch sent:', txHash);
  };

  return <button onClick={handleBatch}>Send Batch</button>;
}
```

---

## Backend API Requirements

If using `useWalletAuth`, your backend needs these endpoints:

### 1. Get Authentication Message
```
POST /api/v1/wallet/auth/message
Body: { wallet_address: string }
Response: { message: string, nonce: string }
```

### 2. Login with Signature
```
POST /api/v1/wallet/auth/login
Body: {
  wallet_address: string,
  signature: string,
  message: string,
  nonce: string,
  user_agent: string
}
Response: {
  sessionToken: string,
  walletAddress: string,
  expiresAt: number,
  expiresIn: number
}
```

### 3. Verify Session
```
GET /api/v1/wallet/auth/session
Headers: { 'X-Session-Token': string }
Response: 200 OK or 401 Unauthorized
```

### 4. Refresh Session
```
POST /api/v1/wallet/auth/refresh
Headers: { 'X-Session-Token': string }
Response: {
  sessionToken: string,
  expiresAt: number
}
```

### 5. Get All Sessions
```
GET /api/v1/wallet/auth/sessions
Headers: { 'X-Session-Token': string }
Response: SessionInfo[]
```

### 6. Logout Session
```
DELETE /api/v1/wallet/auth/sessions/{sessionToken}
Headers: { 'X-Session-Token': string }
Response: 200 OK
```

### 7. Logout All Devices
```
DELETE /api/v1/wallet/auth/sessions
Headers: { 'X-Session-Token': string }
Response: 200 OK
```

---

## Troubleshooting

### "Privy not ready" error

Make sure you're using `PrivyStack` which includes `PrivyReadyGate`:

```tsx
// ✅ Correct
<PrivyStack>
  <App />
</PrivyStack>

// ❌ Wrong (no loading screen)
<PrivyProvider appId="...">
  <App />
</PrivyProvider>
```

---

### "No wallet connected" error

Check that user has authenticated with Privy:

```tsx
const { authenticated } = usePrivy();

if (!authenticated) {
  return <button onClick={login}>Login</button>;
}
```

---

### "Smart wallet not connected" error

Make sure you connect the smart wallet after Privy authentication:

```tsx
const { wallets } = useWallets();
const { connect } = useSmartWallet();

useEffect(() => {
  if (wallets.length > 0) {
    connect(wallets[0]); // Connect with Privy wallet as signer
  }
}, [wallets]);
```

---

### Gasless transactions not working

1. Check that contracts are deployed to Varity L3 (Chain ID 33529)
2. Verify Conduit Bundler endpoint is configured
3. Ensure paymaster is funded for gas sponsorship

```tsx
const config = {
  gasless: {
    enabled: true,
    paymasterUrl: 'https://bundler-varity-testnet-rroe52pwjp.t.conduit.xyz',
  },
};
```

---

## Examples Repository

Check out complete examples at:
https://github.com/varity-labs/varity-sdk/tree/main/examples

---

## Support

- **Documentation**: https://docs.varity.io
- **Discord**: https://discord.gg/varity
- **GitHub Issues**: https://github.com/varity-labs/varity-sdk/issues

---

**Last Updated**: January 20, 2026
**Package Version**: @varity/ui-kit@2.0.0-alpha.1
