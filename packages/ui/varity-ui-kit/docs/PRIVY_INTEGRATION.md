# Privy Integration Guide
## Email/Social Authentication for Non-Crypto Native Users

This guide explains how to use Privy authentication in your Varity L3 applications. Privy is **perfect for non-crypto native users** who need to migrate apps from cloud providers or build/deploy apps on Varity without needing MetaMask or cryptocurrency knowledge.

---

## Table of Contents

- [Why Privy?](#why-privy)
- [Quick Start](#quick-start)
- [Installation](#installation)
- [Basic Usage](#basic-usage)
- [Components](#components)
- [Examples](#examples)
- [Configuration](#configuration)
- [Migration from SIWE](#migration-from-siwe)

---

## Why Privy?

### For Non-Crypto Native Users

**Problem**: Traditional Web3 authentication (SIWE - Sign-In With Ethereum) requires:
- MetaMask or other crypto wallet installed
- Understanding of seed phrases and private keys
- Holding crypto (ETH/USDC) for gas fees
- Crypto knowledge and technical expertise

**Solution**: Privy provides **email and social login** with:
- ✅ Email OTP authentication (no wallet needed)
- ✅ Social logins (Google, Twitter, Discord, GitHub)
- ✅ Embedded wallets (automatically created)
- ✅ No MetaMask or seed phrase management
- ✅ Familiar UX for traditional business users
- ✅ SMS authentication option

### Use Cases

1. **Cloud Migration**: Businesses migrating from AWS/GCP to Varity
2. **App Deployment**: Developers building on Varity ecosystem
3. **Company Dashboards**: B2B customers onboarding to AI dashboards
4. **Non-Crypto Apps**: Traditional businesses going decentralized

---

## Quick Start

### 1. Get Privy Credentials

From Conduit Marketplace or [Privy Dashboard](https://dashboard.privy.io/):
- Create a Privy app
- Copy your **App ID**
- Copy your **App Secret** (backend only)

### 2. Add to .env

```bash
# .env.local or .env
NEXT_PUBLIC_PRIVY_APP_ID=your-privy-app-id-here
PRIVY_APP_SECRET=your-privy-app-secret-here
```

### 3. Wrap Your App

```tsx
import { VarityPrivyProvider } from '@varity/ui-kit';

function App() {
  return (
    <VarityPrivyProvider appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID}>
      <YourApp />
    </VarityPrivyProvider>
  );
}
```

### 4. Add Login Button

```tsx
import { PrivyLoginButton } from '@varity/ui-kit';

function LoginPage() {
  return (
    <PrivyLoginButton>
      Sign In with Email or Social
    </PrivyLoginButton>
  );
}
```

**That's it!** Users can now login with email/social without MetaMask.

---

## Installation

```bash
npm install @varity/ui-kit @privy-io/react-auth @privy-io/wagmi @tanstack/react-query wagmi viem
```

All dependencies are included in `@varity/ui-kit` v2.0+.

---

## Basic Usage

### Minimal Example

```tsx
import React from 'react';
import {
  VarityPrivyProvider,
  PrivyLoginButton,
  PrivyUserProfile,
  usePrivy,
} from '@varity/ui-kit';

function Dashboard() {
  const { authenticated, user, logout } = usePrivy();

  if (!authenticated) {
    return <PrivyLoginButton>Sign In</PrivyLoginButton>;
  }

  return (
    <div>
      <h1>Welcome, {user.email?.address}!</h1>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

export default function App() {
  return (
    <VarityPrivyProvider appId="your-app-id">
      <Dashboard />
    </VarityPrivyProvider>
  );
}
```

---

## Components

### 1. VarityPrivyProvider

Main provider component that wraps your application.

```tsx
<VarityPrivyProvider
  appId="your-privy-app-id"
  onLoginSuccess={(user) => console.log('User logged in:', user)}
  onLoginError={(error) => console.error('Login failed:', error)}
  appearance={{
    theme: 'light', // or 'dark'
    accentColor: '#6366f1',
    logo: 'https://your-logo.com/logo.png',
  }}
>
  <App />
</VarityPrivyProvider>
```

**Props:**
- `appId` (required): Your Privy App ID
- `onLoginSuccess`: Callback when user logs in
- `onLoginError`: Callback when login fails
- `appearance`: Customize look and feel

### 2. PrivyLoginButton

Button to trigger Privy authentication modal.

```tsx
<PrivyLoginButton
  onSuccess={(user) => console.log('Logged in:', user)}
  onError={(error) => console.error('Error:', error)}
  className="custom-button-class"
>
  Sign In
</PrivyLoginButton>
```

**Login Methods Supported:**
- 📧 Email (OTP verification)
- 🔍 Google
- 🐦 Twitter
- 💬 Discord
- 🐙 GitHub
- 👛 Wallet (MetaMask, WalletConnect, etc.)

### 3. PrivyUserProfile

Displays authenticated user information.

```tsx
<PrivyUserProfile
  showLogoutButton={true}
  onLogout={() => console.log('User logged out')}
/>
```

Shows:
- Account type (Email, Google, Twitter, etc.)
- User email or username
- Embedded wallet address
- User ID
- Join date

### 4. PrivyProtectedRoute

Wrapper for protected content requiring authentication.

```tsx
<PrivyProtectedRoute
  fallback={<LoginPage />}
  loadingComponent={<Loader />}
>
  <ProtectedDashboard />
</PrivyProtectedRoute>
```

---

## Hooks

### usePrivy

Main hook for Privy authentication state.

```tsx
import { usePrivy } from '@varity/ui-kit';

function Component() {
  const {
    ready,              // Privy initialized
    authenticated,      // User is authenticated
    user,              // User object
    login,             // Open login modal
    logout,            // Logout user
  } = usePrivy();

  // User data
  const email = user?.email?.address;
  const userId = user?.id;
  const createdAt = user?.createdAt;
}
```

### useWallets

Access user's embedded wallets.

```tsx
import { useWallets } from '@varity/ui-kit';

function Component() {
  const { wallets } = useWallets();

  const primaryWallet = wallets[0];
  const address = primaryWallet?.address;
  const chainId = primaryWallet?.chainId;

  return <div>Wallet: {address}</div>;
}
```

---

## Examples

### Complete Onboarding Flow

See: `examples/privy-complete-onboarding.tsx`

Features:
- Landing page with login
- Protected dashboard
- User profile display
- Quick actions menu
- Wallet information
- Responsive design

### Email-Only Login

```tsx
import { VarityPrivyProvider, PrivyLoginButton, usePrivy } from '@varity/ui-kit';

function EmailLoginApp() {
  const { user, authenticated } = usePrivy();

  if (authenticated) {
    return (
      <div>
        <h1>Welcome, {user.email.address}!</h1>
        <p>Your wallet: {user.wallet.address}</p>
      </div>
    );
  }

  return <PrivyLoginButton>Login with Email</PrivyLoginButton>;
}

export default function App() {
  return (
    <VarityPrivyProvider appId="your-app-id">
      <EmailLoginApp />
    </VarityPrivyProvider>
  );
}
```

### Social Login Buttons

Privy automatically shows all enabled login methods. To customize:

```tsx
// In Privy Dashboard, configure which methods to enable:
// - Email
// - Google
// - Twitter
// - Discord
// - GitHub
// - SMS
// - Wallet
```

---

## Configuration

### Privy Dashboard Configuration

1. Go to [Privy Dashboard](https://dashboard.privy.io/)
2. Select your app
3. Configure:
   - **Login Methods**: Enable email, social, wallet
   - **Embedded Wallets**: Auto-create on login
   - **Appearance**: Theme, colors, logo
   - **Chains**: Add Varity L3 (Chain ID 33529)

### Environment Variables

```bash
# Frontend
NEXT_PUBLIC_PRIVY_APP_ID=clxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_VARITY_CHAIN_ID=33529

# Backend
PRIVY_APP_SECRET=your-app-secret
PRIVY_VERIFICATION_KEY=your-verification-key
```

### Varity L3 Chain Config

Already configured in `VarityPrivyProvider`:

```typescript
{
  id: 33529,
  name: 'Varity L3 Testnet',
  nativeCurrency: {
    decimals: 6,  // USDC (not 18!)
    name: 'USDC',
    symbol: 'USDC',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc-varity-l3-testnet-wkkzw3oqsj.t.conduit.xyz'],
    },
  },
}
```

---

## Migration from SIWE

### Before (SIWE)

```tsx
import { SIWEProvider, SIWEButton, useSIWE } from '@varity/ui-kit';

function App() {
  return (
    <SIWEProvider apiUrl="https://api.varity.so">
      <SIWEButton>Sign In with Wallet</SIWEButton>
    </SIWEProvider>
  );
}
```

**Requires**: MetaMask, crypto wallet, technical knowledge

### After (Privy)

```tsx
import { VarityPrivyProvider, PrivyLoginButton, usePrivy } from '@varity/ui-kit';

function App() {
  return (
    <VarityPrivyProvider appId="your-app-id">
      <PrivyLoginButton>Sign In with Email or Social</PrivyLoginButton>
    </VarityPrivyProvider>
  );
}
```

**Requires**: Just an email address or social account

### Using Both (Hybrid)

You can support both authentication methods:

```tsx
import {
  VarityProvider,
  VarityPrivyProvider,
  PrivyLoginButton,
  SIWEButton,
} from '@varity/ui-kit';

function LoginOptions() {
  return (
    <div>
      <h3>Choose Login Method:</h3>
      <PrivyLoginButton>Easy Login (Email/Social)</PrivyLoginButton>
      <SIWEButton>Advanced (Web3 Wallet)</SIWEButton>
    </div>
  );
}

export default function App() {
  return (
    <VarityProvider>
      <VarityPrivyProvider appId="your-app-id">
        <LoginOptions />
      </VarityPrivyProvider>
    </VarityProvider>
  );
}
```

---

## Advanced Features

### Embedded Wallets

Privy automatically creates an embedded wallet for email/social users:

```tsx
import { useWallets } from '@varity/ui-kit';

function WalletInfo() {
  const { wallets } = useWallets();
  const embeddedWallet = wallets[0]; // Auto-created wallet

  return (
    <div>
      <p>Wallet Address: {embeddedWallet.address}</p>
      <p>Chain: Varity L3</p>
      <p>No seed phrase needed!</p>
    </div>
  );
}
```

### Multi-Factor Authentication (MFA)

Enable in Privy Dashboard for additional security:
- Email + SMS verification
- Email + Authenticator app
- Configurable per-app

### Fiat Onramp Integration

Combine with Thirdweb Pay for fiat to USDC:

```tsx
import { BuyUSDCButton, useWallets } from '@varity/ui-kit';

function FundWallet() {
  const { wallets } = useWallets();

  return (
    <div>
      <h3>Fund Your Varity Wallet</h3>
      <BuyUSDCButton toAddress={wallets[0].address}>
        Buy USDC with Card
      </BuyUSDCButton>
    </div>
  );
}
```

---

## Troubleshooting

### Common Issues

**1. "Privy not initialized"**
- Ensure `VarityPrivyProvider` wraps your app
- Check App ID is correct in .env
- Verify Privy Dashboard configuration

**2. "Chain not supported"**
- Add Varity L3 in Privy Dashboard
- Chain ID: 33529
- RPC URL: `https://rpc-varity-l3-testnet-wkkzw3oqsj.t.conduit.xyz`

**3. "Email login not working"**
- Enable email in Privy Dashboard login methods
- Check email provider settings
- Verify user's email is valid

**4. "Wallet not created"**
- Enable "Create wallet on login" in Privy Dashboard
- Check embedded wallet settings
- Ensure user has completed email verification

---

## Resources

- **Privy Documentation**: https://docs.privy.io/
- **Privy Dashboard**: https://dashboard.privy.io/
- **Varity Documentation**: https://docs.varity.so/
- **Example App**: `examples/privy-complete-onboarding.tsx`

---

## Support

For questions or issues:
- Privy Support: https://support.privy.io/
- Varity Discord: [Join here]
- GitHub Issues: https://github.com/varity/packages

---

## Summary

**Privy enables non-crypto users to:**
- ✅ Login with email or social (no MetaMask)
- ✅ Auto-create embedded wallets
- ✅ Migrate apps from cloud to Varity
- ✅ Build/deploy on Varity ecosystem
- ✅ Familiar UX for traditional businesses

**Perfect for:**
- Cloud migration projects
- B2B SaaS applications
- Company-specific dashboards
- Traditional businesses going decentralized

**Get Started:**
1. Get Privy App ID from Conduit Marketplace
2. Add `VarityPrivyProvider` to your app
3. Use `PrivyLoginButton` for authentication
4. Deploy to Varity L3

🚀 **Ready to onboard non-crypto users? Start building with Privy today!**
