# Provider Guide - Which One Should I Use?

**Last Updated**: January 21, 2026

## 🎯 Quick Decision Tree

```
START HERE
│
├─ Building a simple app? (most cases)
│  └─> Use PrivyStack ✅
│      Example: Auth + wallet + blockchain ready
│      Setup time: 30 seconds
│
├─ Need gasless transactions (ERC-4337)?
│  └─> Use PrivyStack + SmartWalletProvider ✅
│      Example: E-commerce, gaming, social apps
│      Setup time: 2 minutes
│
├─ Building a full-featured dashboard?
│  └─> Use VarityDashboardProvider ✅
│      Example: Admin panel, analytics dashboard
│      Setup time: 2 minutes
│
└─ Need complete custom control?
   └─> Compose providers manually ⚙️
       Example: Complex multi-chain app
       Setup time: 10+ minutes
```

---

## 📦 Provider Comparison

| Provider | Use Case | Setup Time | Includes |
|----------|----------|------------|----------|
| **PrivyStack** | 90% of apps | 30 sec | Auth + Wallet Sync + thirdweb |
| **VarityDashboardProvider** | Dashboards | 2 min | PrivyStack + React Query + Wagmi |
| **SmartWalletProvider** | Gasless transactions | Add-on | ERC-4337 smart wallets |
| **Manual** | Custom needs | 10+ min | You compose |

---

## 1️⃣ PrivyStack (Recommended for Most Apps)

### When to use

- ✅ You want the fastest setup (zero config)
- ✅ You need authentication (email, social, wallet)
- ✅ You want embedded wallets for non-crypto users
- ✅ You're building with AI assistants
- ✅ You need thirdweb + Privy integration

### What you get

- **Email/social login** (Privy) - Embedded wallets for email/Google/Apple/etc
- **External wallet support** - MetaMask, Coinbase Wallet, WalletConnect
- **thirdweb integration** - Full blockchain operations via thirdweb React SDK
- **Wallet synchronization** - Seamless sync between Privy and thirdweb
- **Zero configuration** - Uses shared dev credentials by default
- **Multi-device sessions** - User sessions persist across devices
- **Varity L3 optimized** - Pre-configured for Varity L3 Testnet

### Setup

**Zero-config (uses shared development credentials):**

```tsx
import { PrivyStack } from '@varity/ui-kit';

function App() {
  return (
    <PrivyStack>
      <YourApp />
    </PrivyStack>
  );
}
```

**Production setup with your own credentials:**

```tsx
import { PrivyStack } from '@varity/ui-kit';

function App() {
  return (
    <PrivyStack
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID}
      thirdwebClientId={process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID}
    >
      <YourApp />
    </PrivyStack>
  );
}
```

**With custom appearance:**

```tsx
import { PrivyStack } from '@varity/ui-kit';

function App() {
  return (
    <PrivyStack
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID}
      thirdwebClientId={process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID}
      loginMethods={['email', 'google', 'wallet']}
      appearance={{
        theme: 'light',
        accentColor: '#2563EB',
        logo: '/logo.png'
      }}
      onAddressChange={(address) => {
        console.log('Wallet connected:', address);
      }}
    >
      <YourApp />
    </PrivyStack>
  );
}
```

### Use cases

- **Web3 dashboards** - NFT gallery, portfolio tracker, analytics
- **Content platforms** - Token-gated content, creator tools
- **Social apps** - Web3 social networks (without gasless)
- **Marketplaces** - NFT marketplaces, DeFi apps
- **Developer tools** - Blockchain explorers, debugging tools

### What's inside (stack order)

```
QueryClientProvider         # React Query for data fetching
  └─ PrivyProvider           # Authentication layer
      └─ PrivyReadyGate       # Loading state management (no blank screen)
          └─ ThirdwebProvider # Blockchain operations
              └─ WalletSyncProvider # Wallet synchronization
                  └─ YourApp       # Your application
```

---

## 2️⃣ SmartWalletProvider (Add Gasless Transactions)

### When to use

- ✅ You need gasless transactions (users don't pay gas)
- ✅ You want ERC-4337 smart wallets
- ✅ You need batch transactions
- ✅ You want programmable wallet logic
- ✅ You're building consumer apps (e-commerce, gaming, social)

### What you get

- **Gasless transactions** - App sponsors user gas fees
- **ERC-4337 smart wallets** - Account abstraction standard
- **Batch transactions** - Execute multiple operations in one tx
- **Social recovery** - Recover wallet via email/social
- **Session keys** - Pre-approve actions without signing
- **Gas tracking** - Track gas usage per app (for billing)

### Setup

**Use with PrivyStack:**

```tsx
import { PrivyStack, SmartWalletProvider } from '@varity/ui-kit';
import { createThirdwebClient } from 'thirdweb';
import { varityL3Testnet } from '@varity/sdk';

const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID!
});

function App() {
  return (
    <PrivyStack>
      <SmartWalletProvider
        config={{
          client,
          chain: varityL3Testnet,
          gasless: {
            enabled: true,
            // Optional: custom paymaster
            paymasterUrl: 'https://your-paymaster.example.com',
          },
          // Optional: track gas usage for billing
          appIdentifier: {
            appId: 'your-app-id',
            developerWallet: '0x...',
            appName: 'My App'
          }
        }}
      >
        <YourApp />
      </SmartWalletProvider>
    </PrivyStack>
  );
}
```

**Using gasless transactions in your app:**

```tsx
import { useSmartWallet } from '@varity/ui-kit';

function MyComponent() {
  const { sendTransaction, isGasless, isConnected } = useSmartWallet();

  const handlePurchase = async () => {
    if (!isConnected) {
      console.error('Smart wallet not connected');
      return;
    }

    try {
      // This transaction is gasless if gasless.enabled = true
      const txHash = await sendTransaction({
        to: '0x...',
        data: '0x...',
        value: '0'
      });

      console.log('Transaction sent:', txHash);
    } catch (error) {
      console.error('Transaction failed:', error);
    }
  };

  return (
    <div>
      <button onClick={handlePurchase}>
        Purchase Item {isGasless && '(FREE - No Gas Fee!)'}
      </button>
    </div>
  );
}
```

**Batch transactions:**

```tsx
import { useSmartWallet } from '@varity/ui-kit';

function BatchExample() {
  const { sendBatchTransaction } = useSmartWallet();

  const handleBatchMint = async () => {
    const txHash = await sendBatchTransaction([
      { to: nftContract, data: mintData1 },
      { to: nftContract, data: mintData2 },
      { to: nftContract, data: mintData3 },
    ]);
    console.log('All minted in one tx:', txHash);
  };

  return <button onClick={handleBatchMint}>Mint 3 NFTs</button>;
}
```

### Use cases

- **E-commerce** - Checkout without gas fees
- **Gaming** - In-game purchases, item transfers
- **Social apps** - Tipping, content minting, reactions
- **Creator tools** - Content publishing, NFT minting
- **Onboarding flows** - Frictionless first transaction

### Important notes

- SmartWalletProvider **requires** PrivyStack or manual provider setup
- Smart wallets deploy on first transaction (automatic)
- Gas tracking helps you bill customers for sponsored gas
- Uses Conduit Bundler when deployed to Varity L3

---

## 3️⃣ VarityDashboardProvider (Full-Featured Dashboards)

### When to use

- ✅ Building admin dashboards or SaaS products
- ✅ Need React Query + Wagmi hooks
- ✅ Token-gated access or NFT licensing
- ✅ Multi-tenant applications
- ✅ Enterprise applications

### What you get

- **Everything from PrivyStack** - Auth + wallet sync + thirdweb
- **React Query configured** - Data fetching and caching
- **Wagmi hooks** - useBalance, useContract, useAccount, etc.
- **Error boundaries** - Graceful error handling
- **Loading states** - Professional initialization screens
- **NFT gating utilities** - Token-based access control (future)

### Setup

**Basic setup:**

```tsx
import { VarityDashboardProvider } from '@varity/ui-kit';

function App() {
  return (
    <VarityDashboardProvider
      privyAppId={process.env.NEXT_PUBLIC_PRIVY_APP_ID}
      thirdwebClientId={process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID}
    >
      <Dashboard />
    </VarityDashboardProvider>
  );
}
```

**With custom appearance and error handling:**

```tsx
import { VarityDashboardProvider } from '@varity/ui-kit';

function App() {
  return (
    <VarityDashboardProvider
      privyAppId={process.env.NEXT_PUBLIC_PRIVY_APP_ID}
      thirdwebClientId={process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID}
      appearance={{
        theme: 'dark',
        accentColor: '#2563EB',
        logo: '/logo.png'
      }}
      loginMethods={['email', 'google', 'wallet']}
      initTimeout={10000}
      onAddressChange={(address) => {
        console.log('Wallet changed:', address);
      }}
      onWalletSyncChange={(state) => {
        console.log('Wallet sync state:', state);
      }}
    >
      <Dashboard />
    </VarityDashboardProvider>
  );
}
```

**Using Wagmi hooks:**

```tsx
import { useAccount, useBalance } from 'wagmi';

function DashboardStats() {
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address });

  return (
    <div>
      <p>Address: {address}</p>
      <p>Balance: {balance?.formatted} {balance?.symbol}</p>
    </div>
  );
}
```

### Use cases

- **SaaS admin panels** - User management, analytics
- **Token-gated platforms** - Premium content access
- **Enterprise dashboards** - Multi-chain analytics
- **DAO governance tools** - Voting, proposals
- **DeFi dashboards** - Portfolio tracking, yield farming

### What's inside (stack order)

```
PrivyProvider               # Authentication
  └─ QueryClientProvider     # React Query
      └─ WagmiProvider        # Wagmi hooks
          └─ PrivyReadyGate    # Loading state
              └─ ThirdwebProvider # thirdweb
                  └─ WalletSyncProvider # Wallet sync
                      └─ YourDashboard  # Your app
```

---

## 4️⃣ Manual Composition (Advanced)

### When to use

- ✅ You need complete control over provider configuration
- ✅ Custom authentication flow (not Privy)
- ✅ Multi-chain with custom logic
- ✅ Integration with existing providers
- ✅ Highly specialized use cases

### What you get

- **Full flexibility** - Compose any providers in any order
- **Custom configuration** - Every option exposed
- **No abstraction overhead** - Direct access to primitives
- **Integration freedom** - Works with any auth/wallet system

### Setup

**Full manual setup:**

```tsx
import { PrivyProvider } from '@privy-io/react-auth';
import { ThirdwebProvider } from 'thirdweb/react';
import { WalletSyncProvider, SmartWalletProvider } from '@varity/ui-kit';
import { createThirdwebClient } from 'thirdweb';
import { varityL3Testnet } from '@varity/sdk';

const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID!
});

function App() {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
      config={{
        loginMethods: ['email', 'wallet'],
        appearance: {
          theme: 'light',
          accentColor: '#2563EB' as `#${string}`,
        },
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
      }}
    >
      <ThirdwebProvider>
        <WalletSyncProvider>
          <SmartWalletProvider
            config={{
              client,
              chain: varityL3Testnet,
              gasless: {
                enabled: true,
              },
            }}
          >
            <YourApp />
          </SmartWalletProvider>
        </WalletSyncProvider>
      </ThirdwebProvider>
    </PrivyProvider>
  );
}
```

**Custom authentication (no Privy):**

```tsx
import { ThirdwebProvider } from 'thirdweb/react';
import { SmartWalletProvider } from '@varity/ui-kit';
import { createThirdwebClient } from 'thirdweb';
import { varityL3Testnet } from '@varity/sdk';

const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID!
});

function App() {
  return (
    <YourCustomAuthProvider>
      <ThirdwebProvider>
        <SmartWalletProvider
          config={{
            client,
            chain: varityL3Testnet,
            gasless: { enabled: true },
          }}
        >
          <YourApp />
        </SmartWalletProvider>
      </ThirdwebProvider>
    </YourCustomAuthProvider>
  );
}
```

### Use cases

- **Custom enterprise integrations** - Existing SSO/SAML systems
- **Multi-chain wallets** - Custom chain switching logic
- **Legacy app migration** - Gradual Web3 integration
- **Research projects** - Experimental wallet types
- **White-label solutions** - Custom branding requirements

---

## 🔄 Migration Between Providers

### From Nothing → PrivyStack

**Before (no Web3):**
```tsx
function App() {
  return <YourApp />;
}
```

**After (add auth + wallet + blockchain):**
```tsx
import { PrivyStack } from '@varity/ui-kit';

function App() {
  return (
    <PrivyStack>
      <YourApp />
    </PrivyStack>
  );
}
```

### From PrivyStack → Add Gasless Transactions

**Before:**
```tsx
<PrivyStack><App /></PrivyStack>
```

**After (add SmartWalletProvider):**
```tsx
import { PrivyStack, SmartWalletProvider } from '@varity/ui-kit';
import { createThirdwebClient } from 'thirdweb';
import { varityL3Testnet } from '@varity/sdk';

const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID!
});

<PrivyStack>
  <SmartWalletProvider
    config={{
      client,
      chain: varityL3Testnet,
      gasless: { enabled: true },
    }}
  >
    <App />
  </SmartWalletProvider>
</PrivyStack>
```

### From PrivyStack → VarityDashboardProvider

**Before (simple app):**
```tsx
<PrivyStack><App /></PrivyStack>
```

**After (add Wagmi + React Query):**
```tsx
import { VarityDashboardProvider } from '@varity/ui-kit';

<VarityDashboardProvider
  privyAppId={process.env.NEXT_PUBLIC_PRIVY_APP_ID}
  thirdwebClientId={process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID}
>
  <Dashboard />
</VarityDashboardProvider>
```

### From VarityDashboardProvider → Manual

**Before (all-in-one):**
```tsx
<VarityDashboardProvider
  privyAppId="..."
  thirdwebClientId="..."
>
  <App />
</VarityDashboardProvider>
```

**After (full control):**
```tsx
import { PrivyProvider } from '@privy-io/react-auth';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { ThirdwebProvider } from 'thirdweb/react';
import { WalletSyncProvider } from '@varity/ui-kit';

const queryClient = new QueryClient();
const wagmiConfig = /* your custom config */;

<PrivyProvider appId="..." config={/* custom */}>
  <QueryClientProvider client={queryClient}>
    <WagmiProvider config={wagmiConfig}>
      <ThirdwebProvider>
        <WalletSyncProvider>
          <App />
        </WalletSyncProvider>
      </ThirdwebProvider>
    </WagmiProvider>
  </QueryClientProvider>
</PrivyProvider>
```

---

## ❓ FAQ

### General Questions

**Q: Can I use multiple providers?**

A: You can nest compatible providers (e.g., SmartWalletProvider inside PrivyStack), but don't use competing providers (e.g., PrivyStack + VarityDashboardProvider both provide PrivyProvider).

**Q: Which is fastest to set up?**

A: PrivyStack (30 seconds, zero config). Just wrap your app.

**Q: Which gives me most control?**

A: Manual composition, but requires more setup and knowledge.

**Q: What if I'm using AI to build my app?**

A: Use PrivyStack for zero-config setup. AI assistants can easily work with it.

**Q: Can I switch providers later?**

A: Yes! They all use the same underlying hooks, migration is straightforward.

**Q: Do I need environment variables?**

A: No for development (uses shared dev credentials). Yes for production (use your own Privy App ID + thirdweb Client ID).

### Provider-Specific Questions

**Q: What's the difference between PrivyStack and VarityDashboardProvider?**

A: PrivyStack is lightweight (auth + wallet sync + thirdweb). VarityDashboardProvider adds Wagmi hooks + React Query for dashboards.

**Q: When do I need SmartWalletProvider?**

A: When you want gasless transactions (app sponsors user gas fees). Required for consumer apps where users shouldn't pay gas.

**Q: Can I use SmartWalletProvider without PrivyStack?**

A: Yes, but you need some provider for authentication and thirdweb client. You can use manual composition.

**Q: Does PrivyStack include gasless transactions?**

A: No. Add SmartWalletProvider inside PrivyStack for gasless transactions.

**Q: What's the cost of gasless transactions?**

A: Your app pays the gas. Use `appIdentifier` in SmartWalletProvider to track costs and bill users accordingly.

**Q: Can I use Wagmi hooks with PrivyStack?**

A: No, use VarityDashboardProvider (includes Wagmi) or add WagmiProvider manually.

### Development Questions

**Q: How do I get Privy App ID and thirdweb Client ID?**

A: See [CREDENTIALS_GUIDE.md](./CREDENTIALS_GUIDE.md). For development, omit these props to use shared dev credentials.

**Q: What chains are supported?**

A: Varity L3 Testnet (default), Arbitrum Sepolia, Arbitrum One, Base Sepolia, Base. See [@varity/sdk chains](../../core/varity-sdk/src/chains).

**Q: How do I customize login methods?**

A: Pass `loginMethods` prop to PrivyStack or VarityDashboardProvider:
```tsx
<PrivyStack loginMethods={['email', 'google', 'wallet']}>
```

**Q: How do I track wallet changes?**

A: Use `onAddressChange` callback:
```tsx
<PrivyStack onAddressChange={(address) => console.log('New address:', address)}>
```

**Q: Can I customize the loading screen?**

A: Yes, in VarityDashboardProvider, pass custom `initTimeout` or use manual composition with custom PrivyReadyGate.

### Troubleshooting

**Q: I see a blank screen on load**

A: You're missing PrivyReadyGate. Use PrivyStack or VarityDashboardProvider (includes it) or add manually.

**Q: "Privy not initialized" error**

A: Provider order is wrong. Privy must be outermost. Use PrivyStack or VarityDashboardProvider.

**Q: Wallet not syncing between Privy and thirdweb**

A: Add WalletSyncProvider. PrivyStack and VarityDashboardProvider include it.

**Q: Gasless transactions not working**

A: Check:
1. SmartWalletProvider has `gasless: { enabled: true }`
2. Conduit Bundler is installed on your chain
3. Paymaster has funds (if custom paymaster)

**Q: TypeScript errors with providers**

A: Update imports. Use `@varity/ui-kit` exports, not direct paths.

---

## 📚 Additional Resources

- **Installation Guide**: [INSTALLATION_GUIDE.md](./INSTALLATION_GUIDE.md)
- **Credentials Setup**: [CREDENTIALS_GUIDE.md](./CREDENTIALS_GUIDE.md)
- **Privy Integration**: [PRIVY_INTEGRATION.md](./PRIVY_INTEGRATION.md)
- **thirdweb Quickstart**: [THIRDWEB_QUICKSTART.md](./THIRDWEB_QUICKSTART.md)
- **Provider Hierarchy**: [PROVIDER_HIERARCHY.md](./PROVIDER_HIERARCHY.md)
- **API Reference**: [API_REFERENCE.md](./API_REFERENCE.md)

---

## 🎯 Quick Reference Table

| Feature | PrivyStack | +SmartWallet | VarityDashboardProvider | Manual |
|---------|-----------|--------------|-------------------------|--------|
| **Auth (email/social)** | ✅ | ✅ | ✅ | You decide |
| **Wallet support** | ✅ | ✅ | ✅ | You decide |
| **thirdweb integration** | ✅ | ✅ | ✅ | You decide |
| **Wallet sync (Privy↔thirdweb)** | ✅ | ✅ | ✅ | You decide |
| **Zero config** | ✅ | ❌ | ❌ | ❌ |
| **Gasless transactions** | ❌ | ✅ | ❌ (add manually) | You decide |
| **React Query** | ❌ | ❌ | ✅ | You decide |
| **Wagmi hooks** | ❌ | ❌ | ✅ | You decide |
| **Loading screens** | ✅ | ✅ | ✅ | You build |
| **Setup time** | 30 sec | 2 min | 2 min | 10+ min |
| **Flexibility** | Low | Medium | Medium | High |
| **Best for** | 90% of apps | Consumer apps | Dashboards | Enterprise |

---

**Need help?** Join our [Discord](https://discord.gg/varity) or check the [docs](https://docs.varity.com).

**Found a bug?** [Open an issue](https://github.com/varity/varity-sdk/issues).

**Powered by Varity** 🚀
