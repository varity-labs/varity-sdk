# Thirdweb In-App Wallets - Quick Start Guide

Get users onboarded in **2 minutes** instead of 10+ minutes with traditional wallet setup.

## Installation

Dependencies are already installed. Just import and use:

```bash
# Already included in varity-ui-kit
@thirdweb-dev/react
@thirdweb-dev/wallets
@thirdweb-dev/pay
```

## 30-Second Setup

### 1. Get Your Client ID

1. Visit [Thirdweb Dashboard](https://thirdweb.com/dashboard)
2. Get your **Client ID**
3. Add to `.env.testnet`:

```bash
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=a35636133eb5ec6f30eb9f4c15fce2f3
```

### 2. Wrap Your App

```tsx
import { InAppWalletProvider } from '@varity/ui-kit';

function App() {
  return (
    <InAppWalletProvider clientId={process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID}>
      {/* Your app */}
    </InAppWalletProvider>
  );
}
```

### 3. Add Login Buttons

```tsx
import { EmailLoginButton, SocialLoginButtons } from '@varity/ui-kit';

function LoginPage() {
  return (
    <div>
      <SocialLoginButtons providers={['google', 'apple', 'facebook']} />
      <EmailLoginButton />
    </div>
  );
}
```

**That's it!** Users can now create wallets with email/social login.

---

## Complete Onboarding Flow

Use the pre-built wizard for full onboarding:

```tsx
import { InAppWalletProvider, OnboardingFlow } from '@varity/ui-kit';

function OnboardingPage() {
  return (
    <InAppWalletProvider clientId={process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID}>
      <OnboardingFlow
        onComplete={(user) => router.push('/dashboard')}
        companyName="Your Company"
      />
    </InAppWalletProvider>
  );
}
```

**Includes:**
- ✅ Welcome screen with benefits
- ✅ Email/Social authentication
- ✅ Automatic wallet creation
- ✅ Optional USDC purchase
- ✅ Progress tracking

---

## Add "Buy USDC" Button

```tsx
import { BuyUSDCButton } from '@varity/ui-kit';

<BuyUSDCButton
  walletAddress={user.walletAddress}
  clientId={process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID}
  amount={100}
/>
```

---

## Usage with Hooks

```tsx
import { useInAppWallet } from '@varity/ui-kit';

function Dashboard() {
  const { user, isAuthenticated, logout } = useInAppWallet();

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div>
      <h1>Welcome {user.email}!</h1>
      <p>Wallet: {user.walletAddress}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

---

## Authentication Methods

### Email OTP

```tsx
<EmailLoginButton
  placeholder="Enter your email"
  buttonText="Continue with Email"
/>
```

### Social Login

```tsx
<SocialLoginButtons
  providers={['google', 'apple', 'facebook', 'discord', 'twitter']}
  layout="vertical"
/>
```

### Custom Implementation

```tsx
const { loginWithEmail, loginWithGoogle, loginWithApple } = useInAppWallet();

// Email
await loginWithEmail('user@example.com');

// Google
await loginWithGoogle();

// Apple
await loginWithApple();
```

---

## Payment Integration

### Simple Button

```tsx
import { BuyUSDCButton } from '@varity/ui-kit';

<BuyUSDCButton
  walletAddress={user.walletAddress}
  clientId={process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID}
  amount={100}
  onSuccess={(tx) => console.log('Success!', tx)}
/>
```

### Full Widget

```tsx
import { OnrampWidget } from '@varity/ui-kit';

<OnrampWidget
  walletAddress={user.walletAddress}
  clientId={process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID}
  defaultAmount={100}
  showHistory={true}
/>
```

---

## Examples

See working examples in `/examples`:

- **email-onboarding.tsx** - Email OTP flow
- **social-login.tsx** - Social OAuth flow
- **buy-usdc.tsx** - Payment integration
- **complete-onboarding.tsx** - Full wizard

---

## Configuration

All environment variables in `.env.testnet`:

```bash
# Required
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=a35636133eb5ec6f30eb9f4c15fce2f3

# Optional
NEXT_PUBLIC_THIRDWEB_AUTH_DOMAIN=iso-dashboard.varity.so
NEXT_PUBLIC_THIRDWEB_PAY_ENABLED=true
NEXT_PUBLIC_THIRDWEB_PAY_MIN_AMOUNT=10
NEXT_PUBLIC_THIRDWEB_PAY_MAX_AMOUNT=10000
```

---

## Expected Results

### Onboarding Time

- **Traditional**: 6-10 minutes (MetaMask setup, seed phrase, etc.)
- **Thirdweb**: 2 minutes (email/social login)
- **Improvement**: **3-5x faster**

### Completion Rate

- **Traditional**: 20-30% (high drop-off)
- **Thirdweb**: 60-70% (familiar Web2 flow)
- **Improvement**: **2-3x higher**

### User Experience

- ✅ No MetaMask installation required
- ✅ No seed phrase management
- ✅ Familiar email/social login
- ✅ Credit card purchases
- ✅ Instant wallet creation

---

## Full Documentation

For complete documentation, see:

- **Full Guide**: `/docs/THIRDWEB_ONBOARDING_GUIDE.md`
- **Integration Report**: `/THIRDWEB_INTEGRATION_REPORT.md`
- **Thirdweb Docs**: https://portal.thirdweb.com

---

## Support

Need help?

- **Email**: support@varity.so
- **Discord**: https://discord.gg/varity
- **Thirdweb Support**: https://discord.gg/thirdweb

---

**Happy Building! 🚀**

*Powered by Varity • Built with Thirdweb • Deployed on Arbitrum*
