# SIWE + Payment Integration Guide

Complete guide for implementing Sign-In with Ethereum (SIWE) authentication and USDC payment processing on Varity L3.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [SIWE Authentication](#siwe-authentication)
4. [Payment Integration](#payment-integration)
5. [Complete Examples](#complete-examples)
6. [Security Best Practices](#security-best-practices)
7. [Troubleshooting](#troubleshooting)

---

## Overview

This integration provides:

- **EIP-4361 compliant SIWE authentication** - Non-custodial wallet-based login
- **USDC payment processing** - Native gas token payments on Varity L3
- **Subscription management** - Three-tier pricing ($99, $499, $2,999/month)
- **Protected routes** - Automatic authentication guards
- **Real-time payment status** - Transaction monitoring and confirmations

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React)                       │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ SIWE Provider (Authentication Context)                │  │
│  │  - Wallet connection (Thirdweb)                       │  │
│  │  - SIWE message signing                               │  │
│  │  - JWT token management                               │  │
│  │  - Auto-refresh tokens                                │  │
│  └───────────────────────────────────────────────────────┘  │
│                             │                                │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Payment Components                                     │  │
│  │  - Subscription selection                             │  │
│  │  - USDC approval & transfer                           │  │
│  │  - Transaction monitoring                             │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                    REST API (JWT Bearer Token)
                              │
┌─────────────────────────────────────────────────────────────┐
│              Backend (varity-api-server)                    │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Auth Service                                           │  │
│  │  - SIWE message generation                            │  │
│  │  - Signature verification (ethers/viem)               │  │
│  │  - JWT token signing & verification                   │  │
│  └───────────────────────────────────────────────────────┘  │
│                             │                                │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Payment Webhooks                                       │  │
│  │  - Transaction confirmation                           │  │
│  │  - Subscription activation                            │  │
│  │  - Invoice generation                                 │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                    Blockchain Interaction
                              │
┌─────────────────────────────────────────────────────────────┐
│                    Varity L3 Blockchain                     │
│  - Chain ID: 33529                                          │
│  - Native Gas: USDC (6 decimals)                           │
│  - Settlement: Arbitrum One L2                             │
│  - DA Layer: Celestia                                      │
└─────────────────────────────────────────────────────────────┘
```

---

## Prerequisites

### Environment Variables

```bash
# Frontend (.env)
REACT_APP_THIRDWEB_CLIENT_ID=a35636133eb5ec6f30eb9f4c15fce2f3
REACT_APP_API_URL=https://api.varity.so
REACT_APP_CHAIN_ID=33529
REACT_APP_USDC_CONTRACT=0x... # USDC address on Varity L3
REACT_APP_PAYMENT_RECIPIENT=0x... # Varity treasury address

# Backend (.env)
SIWE_DOMAIN=varity.so
SIWE_URI=https://varity.so
SIWE_STATEMENT=Sign in to Varity with your Ethereum account
JWT_SECRET=your-secret-key-here
JWT_EXPIRATION=1h
REFRESH_TOKEN_EXPIRATION=7d
```

### Dependencies

```bash
# Frontend
npm install thirdweb viem ethers axios

# Backend
npm install express jsonwebtoken ethers
```

---

## SIWE Authentication

### 1. Setup Provider

Wrap your app with the `SIWEProvider`:

```tsx
import React from 'react';
import { ThirdwebProvider } from 'thirdweb/react';
import { SIWEProvider } from '@varity/ui-kit';

const App = () => {
  return (
    <ThirdwebProvider
      clientId={process.env.REACT_APP_THIRDWEB_CLIENT_ID}
    >
      <SIWEProvider
        apiUrl={process.env.REACT_APP_API_URL}
        chainId={33529}
        onLoginSuccess={(user) => console.log('Logged in:', user)}
        onLoginError={(error) => console.error('Login failed:', error)}
      >
        <YourApp />
      </SIWEProvider>
    </ThirdwebProvider>
  );
};
```

### 2. Add Login Button

```tsx
import { SIWEButton } from '@varity/ui-kit';

const LoginPage = () => {
  return (
    <div>
      <h1>Welcome to Varity</h1>
      <SIWEButton
        clientId={process.env.REACT_APP_THIRDWEB_CLIENT_ID}
        theme="dark"
        variant="primary"
        size="lg"
        onLoginComplete={() => {
          // Redirect to dashboard
          window.location.href = '/dashboard';
        }}
      />
    </div>
  );
};
```

### 3. Protected Routes

```tsx
import { ProtectedRoute } from '@varity/ui-kit';

const Dashboard = () => {
  return (
    <ProtectedRoute
      clientId={process.env.REACT_APP_THIRDWEB_CLIENT_ID}
      requireAuth={true}
    >
      <DashboardContent />
    </ProtectedRoute>
  );
};
```

### 4. Use Auth Context

```tsx
import { useSIWE } from '@varity/ui-kit';

const UserProfile = () => {
  const { isAuthenticated, user, logout } = useSIWE();

  if (!isAuthenticated) {
    return <div>Not authenticated</div>;
  }

  return (
    <div>
      <p>Address: {user.address}</p>
      <p>Chain ID: {user.chainId}</p>
      <button onClick={logout}>Sign Out</button>
    </div>
  );
};
```

---

## Payment Integration

### 1. Display Subscription Plans

```tsx
import { SubscriptionWidget } from '@varity/ui-kit';
import { useState } from 'react';

const PricingPage = () => {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId);
    // Open checkout modal
  };

  return (
    <SubscriptionWidget
      currentPlan={undefined} // or current tier
      onSelectPlan={handleSelectPlan}
      theme="dark"
      showAnnualToggle={true}
    />
  );
};
```

### 2. Checkout Flow

```tsx
import { CheckoutModal, getSubscriptionPlan } from '@varity/ui-kit';
import { useState } from 'react';

const CheckoutPage = () => {
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState('professional');

  const plan = getSubscriptionPlan(selectedPlanId);

  const handlePaymentSuccess = (txHash: string) => {
    console.log('Payment successful!', txHash);
    // Redirect to dashboard or show success page
    window.location.href = '/dashboard?payment=success';
  };

  const handlePaymentError = (error: Error) => {
    console.error('Payment failed:', error);
    // Show error message
  };

  return (
    <>
      <button onClick={() => setIsCheckoutOpen(true)}>
        Subscribe Now
      </button>

      {plan && (
        <CheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          plan={plan}
          clientId={process.env.REACT_APP_THIRDWEB_CLIENT_ID}
          paymentRecipient={process.env.REACT_APP_PAYMENT_RECIPIENT}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
          theme="dark"
        />
      )}
    </>
  );
};
```

### 3. Subscription Management

```tsx
import { usePayments, SubscriptionStatus } from '@varity/ui-kit';

const SubscriptionDashboard = () => {
  const {
    subscription,
    isLoadingSubscription,
    usage,
    cancelSubscription,
    resumeSubscription,
  } = usePayments({
    apiUrl: process.env.REACT_APP_API_URL,
  });

  if (isLoadingSubscription) {
    return <div>Loading subscription...</div>;
  }

  if (!subscription) {
    return <div>No active subscription</div>;
  }

  return (
    <div>
      <h2>Your Subscription</h2>
      <p>Plan: {subscription.tier}</p>
      <p>Status: {subscription.status}</p>
      <p>Current Period: {subscription.currentPeriodStart.toLocaleDateString()} - {subscription.currentPeriodEnd.toLocaleDateString()}</p>

      {subscription.status === SubscriptionStatus.ACTIVE && (
        <button onClick={cancelSubscription}>
          Cancel Subscription
        </button>
      )}

      {subscription.status === SubscriptionStatus.CANCELED && (
        <button onClick={resumeSubscription}>
          Resume Subscription
        </button>
      )}

      {usage && (
        <div>
          <h3>Usage This Month</h3>
          <p>Dashboard Views: {usage.dashboardViews}</p>
          <p>API Calls: {usage.apiCalls}</p>
          <p>Storage Used: {usage.storageUsed} GB</p>
        </div>
      )}
    </div>
  );
};
```

---

## Complete Examples

### Full Dashboard Integration

```tsx
import React from 'react';
import {
  ThirdwebProvider,
  SIWEProvider,
  ProtectedRoute,
  SIWEButton,
  SubscriptionWidget,
  CheckoutModal,
  usePayments,
  useSIWE,
} from '@varity/ui-kit';

// App Root
export const App = () => {
  return (
    <ThirdwebProvider clientId={process.env.REACT_APP_THIRDWEB_CLIENT_ID}>
      <SIWEProvider
        apiUrl={process.env.REACT_APP_API_URL}
        chainId={33529}
      >
        <Router>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
          </Routes>
        </Router>
      </SIWEProvider>
    </ThirdwebProvider>
  );
};

// Home Page
const HomePage = () => {
  const { isAuthenticated } = useSIWE();

  return (
    <div>
      <h1>Welcome to Varity</h1>
      {isAuthenticated ? (
        <a href="/dashboard">Go to Dashboard</a>
      ) : (
        <a href="/login">Sign In</a>
      )}
    </div>
  );
};

// Login Page
const LoginPage = () => {
  return (
    <div className="login-container">
      <h1>Sign In to Varity</h1>
      <SIWEButton
        clientId={process.env.REACT_APP_THIRDWEB_CLIENT_ID}
        theme="dark"
        variant="primary"
        size="lg"
        onLoginComplete={() => {
          window.location.href = '/dashboard';
        }}
      />
    </div>
  );
};

// Pricing Page
const PricingPage = () => {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showCheckout, setShowCheckout] = useState(false);

  return (
    <div>
      <SubscriptionWidget
        onSelectPlan={(planId) => {
          setSelectedPlan(planId);
          setShowCheckout(true);
        }}
        theme="dark"
      />

      {selectedPlan && (
        <CheckoutModal
          isOpen={showCheckout}
          onClose={() => setShowCheckout(false)}
          plan={getSubscriptionPlan(selectedPlan)}
          clientId={process.env.REACT_APP_THIRDWEB_CLIENT_ID}
          paymentRecipient={process.env.REACT_APP_PAYMENT_RECIPIENT}
          onSuccess={(txHash) => {
            window.location.href = `/dashboard?payment=success&tx=${txHash}`;
          }}
        />
      )}
    </div>
  );
};

// Dashboard Page (Protected)
const DashboardPage = () => {
  return (
    <ProtectedRoute
      clientId={process.env.REACT_APP_THIRDWEB_CLIENT_ID}
      requireAuth={true}
    >
      <DashboardContent />
    </ProtectedRoute>
  );
};

const DashboardContent = () => {
  const { user, logout } = useSIWE();
  const { subscription, usage } = usePayments({
    apiUrl: process.env.REACT_APP_API_URL,
  });

  return (
    <div>
      <header>
        <h1>Dashboard</h1>
        <div>
          <span>{user?.address}</span>
          <button onClick={logout}>Sign Out</button>
        </div>
      </header>

      <main>
        <h2>Subscription: {subscription?.tier}</h2>
        <p>Status: {subscription?.status}</p>

        <h3>Usage This Month</h3>
        <ul>
          <li>Dashboard Views: {usage?.dashboardViews}</li>
          <li>API Calls: {usage?.apiCalls}</li>
          <li>Storage: {usage?.storageUsed} GB</li>
        </ul>
      </main>
    </div>
  );
};
```

---

## Security Best Practices

### 1. SIWE Message Verification

**Backend must verify:**
- Signature matches address
- Message domain matches server domain
- Nonce has not been used before
- Message is not expired

```typescript
// Example backend verification
import { verifyMessage } from 'viem';

const isValid = await verifyMessage({
  address: message.address,
  message: formatSiweMessage(message),
  signature: signature,
});
```

### 2. JWT Token Security

- **Never store JWT in localStorage for sensitive apps** (use httpOnly cookies)
- **Short expiration times** (1 hour for access token)
- **Refresh token rotation** (generate new refresh token on use)
- **Token revocation list** for logout

### 3. Payment Security

- **Verify transaction on-chain** before activating subscription
- **Implement webhook signature verification**
- **Use secure recipient address** (multisig or cold wallet)
- **Monitor for double-spend attempts**

### 4. Rate Limiting

```typescript
// Backend rate limiting
import rateLimit from 'express-rate-limit';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts
  message: 'Too many login attempts, please try again later',
});

app.post('/api/v1/auth/login', authLimiter, authController.login);
```

---

## Troubleshooting

### Common Issues

#### 1. "Wallet not connected"
- Ensure Thirdweb provider is wrapping your app
- Check that client ID is correct
- Verify user has approved wallet connection

#### 2. "Invalid signature"
- Check that SIWE message format matches EIP-4361
- Verify domain and URI in message match backend config
- Ensure nonce is fresh and not expired

#### 3. "Payment failed"
- Check USDC balance is sufficient
- Verify USDC allowance is approved
- Ensure connected to Varity L3 (Chain ID 33529)
- Check recipient address is correct

#### 4. "Token expired"
- Implement auto-refresh logic
- Check token expiration times
- Verify refresh token is still valid

### Debug Mode

Enable debug logging:

```tsx
// Frontend
localStorage.setItem('DEBUG', 'varity:*');

// Backend
process.env.LOG_LEVEL = 'debug';
```

### Support

For additional help:
- Documentation: https://docs.varity.so
- Discord: https://discord.gg/varity
- Email: support@varity.so

---

## Next Steps

1. **Test in development** - Use testnet USDC and test wallets
2. **Implement backend database** - Store subscriptions and payments
3. **Add email notifications** - Payment confirmations and receipts
4. **Setup monitoring** - Track payment success rates
5. **Deploy to production** - Use production Thirdweb credentials

---

**Version:** 1.0.0
**Last Updated:** 2025-11-14
**Varity L3 Chain ID:** 33529
