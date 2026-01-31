# Provider Hierarchy

**Visual architecture guide for Varity SDK providers**

Last Updated: January 21, 2026

---

## 🏗️ Architecture Diagram

### 1. PrivyStack (Recommended for 90% of Apps)

```
┌──────────────────────────────────────────────────────────┐
│                    PrivyStack                            │
│  Zero-config provider for auth + wallet + blockchain    │
│                                                          │
│  Features:                                               │
│  • Email/social/wallet login                            │
│  • Embedded wallets (non-crypto users)                  │
│  • thirdweb blockchain integration                      │
│  • Wallet sync (Privy ↔ thirdweb)                       │
│  • No blank screen (loading states)                     │
│  • Shared dev credentials (optional)                    │
└──────────────────────────────────────────────────────────┘
                           │
                           │ Composes
                           ↓
        ┌──────────────────────────────────────┐
        │     QueryClientProvider              │
        │     (React Query - data fetching)    │
        └──────────────────────────────────────┘
                           │
                           ↓
        ┌──────────────────────────────────────┐
        │         PrivyProvider                │
        │     (Authentication layer)           │
        │  • Email/social/wallet login         │
        │  • Embedded wallet creation          │
        │  • Session management                │
        └──────────────────────────────────────┘
                           │
                           ↓
        ┌──────────────────────────────────────┐
        │        PrivyReadyGate                │
        │     (Loading state management)       │
        │  • Prevents blank screen             │
        │  • Shows initialization UI           │
        │  • Timeout handling                  │
        └──────────────────────────────────────┘
                           │
                           ↓
        ┌──────────────────────────────────────┐
        │       ThirdwebProvider               │
        │     (Blockchain operations)          │
        │  • Contract interactions             │
        │  • Transaction signing               │
        │  • Chain management                  │
        └──────────────────────────────────────┘
                           │
                           ↓
        ┌──────────────────────────────────────┐
        │      WalletSyncProvider              │
        │  (Privy ↔ thirdweb synchronization) │
        │  • Auto-sync wallet address          │
        │  • Session persistence               │
        │  • Multi-device support              │
        └──────────────────────────────────────┘
                           │
                           ↓
                    ┌──────────┐
                    │ Your App │
                    └──────────┘
```

**Usage:**
```tsx
<PrivyStack>
  <YourApp />
</PrivyStack>
```

---

### 2. PrivyStack + SmartWalletProvider (Gasless Transactions)

```
┌──────────────────────────────────────────────────────────┐
│             PrivyStack + SmartWalletProvider             │
│   Auth + wallet sync + ERC-4337 gasless transactions    │
│                                                          │
│  Features:                                               │
│  • Everything from PrivyStack                           │
│  • Gasless transactions (app sponsors gas)             │
│  • Batch transactions                                   │
│  • Social recovery                                      │
│  • Session keys                                         │
│  • Gas usage tracking                                   │
└──────────────────────────────────────────────────────────┘
                           │
                           │ Composes
                           ↓
        ┌──────────────────────────────────────┐
        │         PrivyStack                   │
        │  (see diagram above)                 │
        │  • QueryClient                       │
        │  • Privy                             │
        │  • PrivyReadyGate                    │
        │  • Thirdweb                          │
        │  • WalletSync                        │
        └──────────────────────────────────────┘
                           │
                           ↓
        ┌──────────────────────────────────────┐
        │      SmartWalletProvider             │
        │   (ERC-4337 Account Abstraction)     │
        │  • Gasless transactions              │
        │  • Batch operations                  │
        │  • Paymaster integration             │
        │  • Gas tracking                      │
        │  • Wallet factory                    │
        └──────────────────────────────────────┘
                           │
                           ↓
                    ┌──────────┐
                    │ Your App │
                    └──────────┘
```

**Usage:**
```tsx
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
    <YourApp />
  </SmartWalletProvider>
</PrivyStack>
```

---

### 3. VarityDashboardProvider (Full-Featured Dashboards)

```
┌──────────────────────────────────────────────────────────┐
│              VarityDashboardProvider                     │
│  All-in-one provider for admin dashboards and SaaS      │
│                                                          │
│  Features:                                               │
│  • Everything from PrivyStack                           │
│  • React Query (data fetching/caching)                  │
│  • Wagmi hooks (useBalance, useContract, etc.)          │
│  • Error boundaries                                     │
│  • Professional loading screens                         │
│  • NFT gating utilities (future)                        │
└──────────────────────────────────────────────────────────┘
                           │
                           │ Composes
                           ↓
        ┌──────────────────────────────────────┐
        │         PrivyProvider                │
        │     (Authentication layer)           │
        └──────────────────────────────────────┘
                           │
                           ↓
        ┌──────────────────────────────────────┐
        │     QueryClientProvider              │
        │     (React Query - enhanced)         │
        │  • Global data caching               │
        │  • Background refetching             │
        │  • Optimistic updates                │
        └──────────────────────────────────────┘
                           │
                           ↓
        ┌──────────────────────────────────────┐
        │         WagmiProvider                │
        │     (Ethereum interactions)          │
        │  • useAccount, useBalance            │
        │  • useContract, useReadContract      │
        │  • useTransaction                    │
        └──────────────────────────────────────┘
                           │
                           ↓
        ┌──────────────────────────────────────┐
        │        PrivyReadyGate                │
        │   (Enhanced loading screens)         │
        │  • InitializingScreen                │
        │  • InitTimeoutScreen                 │
        │  • ConfigErrorScreen                 │
        └──────────────────────────────────────┘
                           │
                           ↓
        ┌──────────────────────────────────────┐
        │       ThirdwebProvider               │
        │  (Blockchain + thirdweb SDK)         │
        └──────────────────────────────────────┘
                           │
                           ↓
        ┌──────────────────────────────────────┐
        │      WalletSyncProvider              │
        │  (Privy ↔ thirdweb sync)             │
        │  • onAddressChange callback          │
        │  • onWalletSyncChange callback       │
        └──────────────────────────────────────┘
                           │
                           ↓
                 ┌─────────────────┐
                 │ Your Dashboard  │
                 └─────────────────┘
```

**Usage:**
```tsx
<VarityDashboardProvider
  privyAppId={process.env.NEXT_PUBLIC_PRIVY_APP_ID}
  thirdwebClientId={process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID}
>
  <Dashboard />
</VarityDashboardProvider>
```

---

### 4. Manual Composition (Advanced)

```
┌──────────────────────────────────────────────────────────┐
│              Manual Provider Composition                 │
│  Full control - compose providers in any order          │
│                                                          │
│  Features:                                               │
│  • Complete flexibility                                 │
│  • Custom configuration                                 │
│  • Integration with existing providers                  │
│  • No abstraction overhead                              │
└──────────────────────────────────────────────────────────┘
                           │
                           │ You compose
                           ↓
     ┌─────────────────────────────────────────┐
     │  Your choice of auth provider           │
     │  • PrivyProvider                        │
     │  • Auth0Provider                        │
     │  • Custom SSO                           │
     │  • No auth                              │
     └─────────────────────────────────────────┘
                           │
                           ↓
     ┌─────────────────────────────────────────┐
     │  Optional: QueryClientProvider          │
     │  (if you need React Query)              │
     └─────────────────────────────────────────┘
                           │
                           ↓
     ┌─────────────────────────────────────────┐
     │  Optional: WagmiProvider                │
     │  (if you need Wagmi hooks)              │
     └─────────────────────────────────────────┘
                           │
                           ↓
     ┌─────────────────────────────────────────┐
     │  ThirdwebProvider                       │
     │  (blockchain operations)                │
     └─────────────────────────────────────────┘
                           │
                           ↓
     ┌─────────────────────────────────────────┐
     │  Optional: WalletSyncProvider           │
     │  (if using Privy + thirdweb)            │
     └─────────────────────────────────────────┘
                           │
                           ↓
     ┌─────────────────────────────────────────┐
     │  Optional: SmartWalletProvider          │
     │  (if you need gasless transactions)     │
     └─────────────────────────────────────────┘
                           │
                           ↓
                    ┌──────────┐
                    │ Your App │
                    └──────────┘
```

**Usage:**
```tsx
<PrivyProvider appId="..." config={...}>
  <ThirdwebProvider>
    <WalletSyncProvider>
      <SmartWalletProvider config={...}>
        <YourApp />
      </SmartWalletProvider>
    </WalletSyncProvider>
  </ThirdwebProvider>
</PrivyProvider>
```

---

## 🔀 Composition Layers

### Layer 1: Base Infrastructure

**Purpose**: Core blockchain and data fetching

**Components**:
- `QueryClientProvider` - React Query for data fetching/caching
- `ThirdwebProvider` - Blockchain operations via thirdweb SDK
- `WagmiProvider` - Ethereum interactions via Wagmi

**Provided by**:
- PrivyStack ✅ (React Query + thirdweb)
- VarityDashboardProvider ✅ (React Query + Wagmi + thirdweb)
- Manual composition (you choose)

---

### Layer 2: Authentication

**Purpose**: User authentication and identity

**Components**:
- `PrivyProvider` - Email/social/wallet login
- `Auth0Provider` - Enterprise SSO (manual only)
- Custom auth solutions (manual only)

**Provided by**:
- PrivyStack ✅ (Privy)
- VarityDashboardProvider ✅ (Privy)
- Manual composition (you choose)

---

### Layer 3: Wallet Management

**Purpose**: Wallet synchronization and management

**Components**:
- `WalletSyncProvider` - Syncs Privy embedded wallets with thirdweb
- `PrivyReadyGate` - Loading state management (prevents blank screen)

**Provided by**:
- PrivyStack ✅
- VarityDashboardProvider ✅
- Manual composition (optional)

**Why it matters**:
- Privy creates embedded wallets for email/social login
- thirdweb needs access to these wallets for contract interactions
- WalletSyncProvider bridges the gap automatically

---

### Layer 4: Smart Wallets (Optional)

**Purpose**: ERC-4337 account abstraction for gasless transactions

**Components**:
- `SmartWalletProvider` - Gasless transactions, batch operations

**Provided by**:
- PrivyStack ❌ (add manually)
- VarityDashboardProvider ❌ (add manually)
- Manual composition (you decide)

**When to use**:
- Consumer apps (e-commerce, gaming, social)
- Apps that want to sponsor user gas fees
- Apps needing batch transactions
- Apps with session keys

---

### Layer 5: Application (Your Code)

**Purpose**: Your application logic

**Components**:
- Your React components
- Your business logic
- Your UI

**Hooks available**:

From **PrivyStack**:
- `usePrivy()` - Auth state, login, logout
- `useWallets()` - Connected wallets
- `useWalletSync()` - Wallet sync state
- thirdweb React hooks (via ThirdwebProvider)

From **VarityDashboardProvider** (adds):
- `useAccount()` - Wagmi account
- `useBalance()` - Wagmi balance
- `useContract()` - Wagmi contract
- All other Wagmi hooks

From **SmartWalletProvider** (adds):
- `useSmartWallet()` - Smart wallet operations
  - `sendTransaction()` - Send gasless tx
  - `sendBatchTransaction()` - Batch operations
  - `isGasless` - Check if gasless enabled

---

## 📊 Feature Matrix by Layer

| Layer | PrivyStack | PrivyStack + SmartWallet | VarityDashboardProvider | Manual |
|-------|-----------|-------------------------|------------------------|--------|
| **Base (React Query)** | ✅ | ✅ | ✅ | Optional |
| **Base (thirdweb)** | ✅ | ✅ | ✅ | Required |
| **Base (Wagmi)** | ❌ | ❌ | ✅ | Optional |
| **Auth (Privy)** | ✅ | ✅ | ✅ | Optional |
| **Wallet Sync** | ✅ | ✅ | ✅ | Optional |
| **Loading States** | ✅ | ✅ | ✅ | You build |
| **Smart Wallets** | ❌ | ✅ | ❌ | Optional |
| **Gasless Transactions** | ❌ | ✅ | ❌ | Optional |

---

## 🎯 Decision Flow

```
Start
  │
  ├─ Do you need Wagmi hooks (useBalance, useContract)?
  │  ├─ Yes → Use VarityDashboardProvider
  │  └─ No ↓
  │
  ├─ Do you need gasless transactions?
  │  ├─ Yes → Use PrivyStack + SmartWalletProvider
  │  └─ No ↓
  │
  ├─ Do you need custom auth or complex setup?
  │  ├─ Yes → Use Manual Composition
  │  └─ No ↓
  │
  └─ Use PrivyStack (default choice for 90% of apps)
```

---

## 🔧 Common Patterns

### Pattern 1: Simple Web3 App

**Stack**: PrivyStack

**Use case**: NFT gallery, portfolio tracker, simple DApp

```tsx
<PrivyStack>
  <App />
</PrivyStack>
```

**Includes**:
- Auth (email/social/wallet)
- Wallet sync
- thirdweb blockchain operations
- React Query data fetching

---

### Pattern 2: Consumer App with Gasless

**Stack**: PrivyStack + SmartWalletProvider

**Use case**: E-commerce, gaming, social app

```tsx
<PrivyStack>
  <SmartWalletProvider config={{ gasless: { enabled: true } }}>
    <App />
  </SmartWalletProvider>
</PrivyStack>
```

**Includes**:
- Everything from PrivyStack
- Gasless transactions (ERC-4337)
- Batch operations
- Gas tracking

---

### Pattern 3: Admin Dashboard

**Stack**: VarityDashboardProvider

**Use case**: SaaS admin panel, analytics dashboard

```tsx
<VarityDashboardProvider
  privyAppId="..."
  thirdwebClientId="..."
>
  <Dashboard />
</VarityDashboardProvider>
```

**Includes**:
- Everything from PrivyStack
- Wagmi hooks
- Enhanced error handling
- Professional loading screens

---

### Pattern 4: Enterprise Integration

**Stack**: Manual composition

**Use case**: Existing enterprise app adding Web3

```tsx
<YourExistingAuthProvider>
  <ThirdwebProvider>
    <SmartWalletProvider config={...}>
      <App />
    </SmartWalletProvider>
  </ThirdwebProvider>
</YourExistingAuthProvider>
```

**Includes**:
- Your existing auth
- thirdweb for blockchain
- Optional smart wallets
- Full control

---

## 📚 Next Steps

- **Choose your provider**: See [PROVIDERS.md](./PROVIDERS.md)
- **Get credentials**: See [CREDENTIALS_GUIDE.md](./CREDENTIALS_GUIDE.md)
- **Install packages**: See [INSTALLATION_GUIDE.md](./INSTALLATION_GUIDE.md)
- **Learn Privy**: See [PRIVY_INTEGRATION.md](./PRIVY_INTEGRATION.md)
- **Learn thirdweb**: See [THIRDWEB_QUICKSTART.md](./THIRDWEB_QUICKSTART.md)

---

**Powered by Varity** 🚀
