# Thirdweb In-App Wallets & Onramp Integration Guide

Complete guide for integrating Thirdweb In-App Wallets and Onramp for non-crypto user onboarding on Varity L3.

## Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Components](#components)
4. [Configuration](#configuration)
5. [Integration Examples](#integration-examples)
6. [Onboarding Flow](#onboarding-flow)
7. [Analytics & Tracking](#analytics--tracking)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

---

## Overview

### What is Thirdweb In-App Wallets?

Thirdweb In-App Wallets enables users to create blockchain wallets using familiar Web2 authentication methods:

- **Email OTP**: Passwordless email authentication
- **Social OAuth**: Google, Apple, Facebook, Discord, Twitter
- **Custodial Management**: Thirdweb manages private keys securely
- **No Browser Extension**: No MetaMask or wallet extension required
- **Seamless UX**: Users don't need to understand crypto

### What is Thirdweb Pay (Onramp)?

Thirdweb Pay allows users to buy crypto with fiat currency:

- **Payment Methods**: Credit card, debit card, Apple Pay, Google Pay
- **135+ Currencies**: USD, EUR, GBP, and more
- **KYC Handling**: Automatic KYC verification by payment providers
- **Direct Deposit**: Crypto sent directly to user's wallet on Varity L3

### Benefits for Varity L3

- **3-5x Faster Onboarding**: Email login vs. manual wallet setup
- **Lower Friction**: No crypto knowledge required
- **Higher Conversion**: Users can buy USDC with credit card
- **Better UX**: Familiar Web2 authentication patterns
- **Cost Effective**: No infrastructure management needed

---

## Quick Start

### 1. Installation

The Thirdweb dependencies are already installed in `@varity/ui-kit`:

```bash
# Already included in varity-ui-kit
@thirdweb-dev/react
@thirdweb-dev/wallets
@thirdweb-dev/pay
react-hot-toast
```

### 2. Get Thirdweb Client ID

1. Go to [Thirdweb Dashboard](https://thirdweb.com/dashboard)
2. Create a new project or use existing
3. Navigate to **Settings > API Keys**
4. Copy your **Client ID**
5. Add to `.env.testnet`:

```bash
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your_client_id_here
```

### 3. Basic Setup

```tsx
import { InAppWalletProvider, OnboardingFlow } from '@varity/ui-kit';

function App() {
  return (
    <InAppWalletProvider clientId={process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID}>
      <OnboardingFlow
        onComplete={(user) => console.log('User onboarded:', user)}
        companyName="Your Company"
      />
    </InAppWalletProvider>
  );
}
```

---

## Components

### InAppWalletProvider

Main provider component that wraps your application.

```tsx
<InAppWalletProvider
  clientId="your-client-id"
  onLoginSuccess={(user) => console.log('Login success:', user)}
  onLoginError={(error) => console.error('Login error:', error)}
  onLogout={() => console.log('User logged out')}
>
  {/* Your app */}
</InAppWalletProvider>
```

**Props:**
- `clientId` (required): Your Thirdweb client ID
- `onLoginSuccess`: Callback when user logs in successfully
- `onLoginError`: Callback when login fails
- `onLogout`: Callback when user logs out

### EmailLoginButton

Email OTP authentication button with input form.

```tsx
<EmailLoginButton
  onSuccess={(user) => console.log('Email login success')}
  onError={(error) => console.error('Email login error')}
  placeholder="Enter your email"
  buttonText="Continue with Email"
  loadingText="Sending code..."
/>
```

**Props:**
- `onSuccess`: Callback on successful authentication
- `onError`: Callback on authentication error
- `buttonClassName`: Custom button CSS classes
- `inputClassName`: Custom input CSS classes
- `placeholder`: Email input placeholder text
- `buttonText`: Button text
- `loadingText`: Loading state text

### SocialLoginButtons

Social OAuth authentication buttons.

```tsx
<SocialLoginButtons
  providers={['google', 'apple', 'facebook']}
  onSuccess={(provider) => console.log(`Logged in with ${provider}`)}
  onError={(error) => console.error('Social login error')}
  layout="vertical"
  size="md"
  showDivider={true}
  dividerText="or continue with"
/>
```

**Props:**
- `providers`: Array of social providers to show
- `onSuccess`: Callback on successful authentication
- `onError`: Callback on authentication error
- `layout`: Button layout (`horizontal` | `vertical` | `grid`)
- `size`: Button size (`sm` | `md` | `lg`)
- `showDivider`: Show divider above buttons
- `dividerText`: Text for divider

**Available Providers:**
- `google`
- `apple`
- `facebook`
- `discord`
- `twitter`

### OnboardingFlow

Complete multi-step onboarding wizard.

```tsx
<OnboardingFlow
  onComplete={(user) => router.push('/dashboard')}
  onSkip={() => router.push('/dashboard')}
  skipBuyUSDC={false}
  companyName="Your Company"
  companyLogo="/logo.png"
/>
```

**Props:**
- `onComplete`: Callback when onboarding completes
- `onSkip`: Callback when user skips onboarding
- `skipBuyUSDC`: Skip the "Buy USDC" step
- `companyName`: Your company name for branding
- `companyLogo`: URL to your company logo

**Onboarding Steps:**
1. **Welcome**: Introduction and benefits
2. **Authentication**: Email/Social login
3. **Wallet Created**: Success confirmation
4. **Buy USDC**: (Optional) Purchase USDC with card
5. **Complete**: Redirect to dashboard

### BuyUSDCButton

Simple button to buy USDC with fiat.

```tsx
<BuyUSDCButton
  walletAddress={user.walletAddress}
  amount={100}
  clientId={process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID}
  onSuccess={(tx) => console.log('Purchase complete')}
  onError={(error) => console.error('Purchase error')}
  buttonText="Buy USDC"
/>
```

**Props:**
- `walletAddress` (required): User's wallet address
- `clientId` (required): Thirdweb client ID
- `amount`: Default purchase amount in USD
- `onSuccess`: Callback on successful purchase
- `onError`: Callback on purchase error
- `buttonText`: Button text
- `className`: Custom button CSS classes

### OnrampWidget

Full embedded payment widget with history.

```tsx
<OnrampWidget
  walletAddress={user.walletAddress}
  clientId={process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID}
  defaultAmount={100}
  minAmount={10}
  maxAmount={10000}
  onComplete={(purchase) => console.log('Purchase:', purchase)}
  onError={(error) => console.error('Error:', error)}
  showHistory={true}
  theme="light"
/>
```

**Props:**
- `walletAddress` (required): User's wallet address
- `clientId` (required): Thirdweb client ID
- `defaultAmount`: Default purchase amount
- `minAmount`: Minimum purchase amount
- `maxAmount`: Maximum purchase amount
- `onComplete`: Callback on purchase completion
- `onError`: Callback on purchase error
- `showHistory`: Show purchase history
- `theme`: Widget theme (`light` | `dark`)

---

## Configuration

### Environment Variables

Add these to `.env.testnet`:

```bash
# Thirdweb Client ID (REQUIRED)
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=a35636133eb5ec6f30eb9f4c15fce2f3

# Thirdweb Secret Key (Optional - for server-side operations)
NEXT_PUBLIC_THIRDWEB_SECRET_KEY=

# In-App Wallet Configuration
NEXT_PUBLIC_THIRDWEB_AUTH_DOMAIN=iso-dashboard.varity.so
NEXT_PUBLIC_THIRDWEB_WALLET_ID=inAppWallet

# Onramp Configuration
NEXT_PUBLIC_THIRDWEB_PAY_ENABLED=true
NEXT_PUBLIC_THIRDWEB_PAY_MIN_AMOUNT=10
NEXT_PUBLIC_THIRDWEB_PAY_MAX_AMOUNT=10000
```

### Varity L3 Chain Configuration

The components are pre-configured for Varity L3:

```typescript
const VARITY_L3_CHAIN = {
  chainId: 33529,
  rpc: ['https://varity-l3-rpc.varity.so'],
  nativeCurrency: {
    decimals: 6,
    name: 'USDC',
    symbol: 'USDC',
  },
  name: 'Varity L3 Testnet',
  testnet: true,
};
```

---

## Integration Examples

### Example 1: Replace Web3Auth with Thirdweb

```tsx
// OLD: Web3Auth
import { Web3Auth } from '@web3auth/modal';

// NEW: Thirdweb In-App Wallets
import { InAppWalletProvider, useInAppWallet, EmailLoginButton, SocialLoginButtons } from '@varity/ui-kit';

function LoginPage() {
  const { loginWithEmail, loginWithGoogle, isLoading } = useInAppWallet();

  return (
    <div>
      <h1>Login</h1>
      <SocialLoginButtons providers={['google', 'apple']} />
      <EmailLoginButton />
    </div>
  );
}

function App() {
  return (
    <InAppWalletProvider clientId={process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID}>
      <LoginPage />
    </InAppWalletProvider>
  );
}
```

### Example 2: Complete Onboarding with Buy USDC

```tsx
import { InAppWalletProvider, OnboardingFlow } from '@varity/ui-kit';
import { useRouter } from 'next/navigation';

function OnboardingPage() {
  const router = useRouter();

  const handleComplete = (user) => {
    // Store user data
    localStorage.setItem('varity_user', JSON.stringify(user));

    // Redirect to dashboard
    router.push('/dashboard');
  };

  return (
    <InAppWalletProvider clientId={process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID}>
      <OnboardingFlow
        onComplete={handleComplete}
        skipBuyUSDC={false}
        companyName="ISO Dashboard"
      />
    </InAppWalletProvider>
  );
}
```

### Example 3: Add "Buy USDC" Button to Dashboard

```tsx
import { BuyUSDCButton } from '@varity/ui-kit';
import { useInAppWallet } from '@varity/ui-kit';

function DashboardHeader() {
  const { user } = useInAppWallet();

  return (
    <header>
      <h1>Dashboard</h1>
      <BuyUSDCButton
        walletAddress={user?.walletAddress}
        clientId={process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID}
        amount={100}
        onSuccess={(tx) => toast.success('Purchase complete!')}
      />
    </header>
  );
}
```

### Example 4: Custom Onboarding Flow

```tsx
import { useInAppWallet, EmailLoginButton, SocialLoginButtons } from '@varity/ui-kit';
import { useState } from 'react';

function CustomOnboarding() {
  const { user, isAuthenticated } = useInAppWallet();
  const [step, setStep] = useState(1);

  if (isAuthenticated) {
    return <div>Welcome {user.email}!</div>;
  }

  return (
    <div>
      {step === 1 && (
        <div>
          <h1>Welcome to Varity</h1>
          <button onClick={() => setStep(2)}>Get Started</button>
        </div>
      )}

      {step === 2 && (
        <div>
          <h2>Create Your Wallet</h2>
          <SocialLoginButtons providers={['google', 'apple', 'facebook']} />
          <EmailLoginButton />
        </div>
      )}
    </div>
  );
}
```

---

## Onboarding Flow

### User Journey

```
1. User arrives at dashboard
   ↓
2. Click "Get Started" or "Create Wallet"
   ↓
3. Choose authentication method:
   - Email (OTP)
   - Google
   - Apple
   - Facebook
   ↓
4. Complete authentication (email code / OAuth popup)
   ↓
5. Wallet automatically created by Thirdweb
   ↓
6. (Optional) Buy USDC with credit card
   ↓
7. User onboarded and redirected to dashboard
```

### Conversion Metrics

Track these key metrics:

- **Welcome → Auth**: Users who click "Get Started"
- **Auth → Wallet**: Users who complete authentication
- **Wallet → Buy USDC**: Users who attempt purchase
- **Buy USDC → Complete**: Users who complete purchase
- **Overall Conversion**: Welcome → Complete

### Expected Improvements

- **Onboarding Time**: 3-5x faster (2 min vs. 6-10 min)
- **Completion Rate**: 2-3x higher (60-70% vs. 20-30%)
- **Drop-off Reduction**: 50-70% fewer drop-offs
- **Purchase Rate**: 30-40% of users buy USDC

---

## Analytics & Tracking

### Track Onboarding Events

```tsx
import { InAppWalletProvider, OnboardingFlow } from '@varity/ui-kit';

function OnboardingPage() {
  const handleLoginSuccess = (user) => {
    // Track login event
    analytics.track('User Login', {
      method: user.authMethod,
      wallet_address: user.walletAddress,
      email: user.email,
    });
  };

  const handleOnboardingComplete = (user) => {
    // Track completion
    analytics.track('Onboarding Complete', {
      wallet_address: user.walletAddress,
      onboarding_time: Date.now() - startTime,
    });
  };

  const handlePurchaseComplete = (purchase) => {
    // Track USDC purchase
    analytics.track('USDC Purchase', {
      amount: purchase.amount,
      transaction_hash: purchase.txHash,
      payment_method: 'credit_card',
    });
  };

  return (
    <InAppWalletProvider
      clientId={process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID}
      onLoginSuccess={handleLoginSuccess}
    >
      <OnboardingFlow
        onComplete={handleOnboardingComplete}
      />
    </InAppWalletProvider>
  );
}
```

### Key Events to Track

1. **onboarding_started**: User sees welcome screen
2. **auth_method_selected**: User chooses email/social
3. **auth_completed**: User completes authentication
4. **wallet_created**: Wallet created successfully
5. **buy_usdc_clicked**: User clicks "Buy USDC"
6. **purchase_completed**: USDC purchase successful
7. **onboarding_completed**: Full onboarding complete
8. **onboarding_skipped**: User skips onboarding

---

## Best Practices

### 1. Progressive Onboarding

Don't require all steps upfront:

```tsx
<OnboardingFlow
  skipBuyUSDC={false}  // Allow skipping buy USDC
  onSkip={() => router.push('/dashboard')}  // Let users skip
/>
```

### 2. Clear Value Proposition

Explain benefits before asking for authentication:

```tsx
<div className="benefits">
  <h3>What you'll get:</h3>
  <ul>
    <li>✓ Your own wallet - no crypto knowledge needed</li>
    <li>✓ Free transactions - USDC as gas token</li>
    <li>✓ Buy crypto with card - credit card accepted</li>
  </ul>
</div>
```

### 3. Session Persistence

Save user session across page reloads:

```tsx
const handleLoginSuccess = (user) => {
  localStorage.setItem('varity_user', JSON.stringify(user));
  localStorage.setItem('varity_wallet_address', user.walletAddress);
};
```

### 4. Error Handling

Provide clear error messages:

```tsx
const handleLoginError = (error) => {
  if (error.message.includes('email')) {
    toast.error('Invalid email address');
  } else if (error.message.includes('network')) {
    toast.error('Network error. Please try again');
  } else {
    toast.error('Authentication failed');
  }
};
```

### 5. Loading States

Show loading indicators during authentication:

```tsx
{isLoading ? (
  <div className="loading">
    <Spinner />
    <p>Creating your wallet...</p>
  </div>
) : (
  <EmailLoginButton />
)}
```

---

## Troubleshooting

### Issue: "Client ID not configured"

**Solution:** Add Thirdweb client ID to environment variables:

```bash
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your_client_id_here
```

### Issue: Email OTP not sending

**Possible causes:**
1. Invalid email format
2. Thirdweb rate limiting
3. Email provider blocking

**Solution:** Check Thirdweb dashboard for email delivery logs

### Issue: Social login popup blocked

**Solution:** Ensure popups are allowed in browser settings. Add redirect URLs to Thirdweb dashboard.

### Issue: Payment fails with KYC error

**Solution:** KYC is required for purchases over certain amounts. User must complete KYC verification.

### Issue: Chain ID mismatch

**Solution:** Verify Varity L3 chain configuration matches:

```typescript
chainId: 33529
nativeCurrency: { symbol: 'USDC', decimals: 6 }
```

### Issue: Wallet not created after authentication

**Solution:** Check browser console for errors. Verify Thirdweb SDK version compatibility.

---

## Support

### Resources

- **Thirdweb Docs**: https://portal.thirdweb.com
- **Thirdweb Discord**: https://discord.gg/thirdweb
- **Varity Docs**: https://docs.varity.so
- **GitHub Issues**: https://github.com/varity/varity-ui-kit/issues

### Contact

For integration support, contact:
- Email: support@varity.so
- Discord: https://discord.gg/varity

---

## Next Steps

1. ✅ Install dependencies
2. ✅ Get Thirdweb Client ID
3. ✅ Configure environment variables
4. ✅ Add InAppWalletProvider to app
5. ✅ Implement OnboardingFlow
6. ✅ Test email and social login
7. ✅ Test USDC purchases
8. ✅ Add analytics tracking
9. ✅ Deploy to production

---

**Last Updated:** November 14, 2025
**Version:** 2.0.0
