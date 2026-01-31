# Varity Development Credentials Guide

## Overview

Varity SDK provides **shared development credentials** (VARITY_DEV_CREDENTIALS) to enable developers to start building immediately without manual credential setup. This guide explains how to use shared credentials for development and upgrade to production credentials.

## Quick Start (Zero Configuration)

The simplest way to get started with Varity is to use shared development credentials:

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

That's it! No environment variables, no credential setup required. The SDK will automatically use `VARITY_DEV_CREDENTIALS` and display a helpful console message:

```
🔧 Varity Dev Mode: Using shared development credentials.
   Perfect for getting started! For production, get your own credentials:
   - Privy: https://dashboard.privy.io
   - thirdweb: https://thirdweb.com/dashboard
```

## What Are Shared Development Credentials?

Shared development credentials are Varity-managed Privy and thirdweb credentials that work out of the box for development and testing.

### Included Credentials

```typescript
import { VARITY_DEV_CREDENTIALS } from '@varity/sdk';

console.log(VARITY_DEV_CREDENTIALS);
// {
//   privy: {
//     appId: 'clpqvarity_dev_shared_001'
//   },
//   thirdweb: {
//     clientId: '0be2varity_dev_shared_001'
//   }
// }
```

### Rate Limits

Shared credentials have rate limits to prevent abuse:

- **Privy**: 1,000 monthly active users (shared across all developers)
- **thirdweb**: 100 requests/second (shared across all developers)

For unlimited usage, upgrade to production credentials.

## Development Patterns

### Pattern 1: Zero-Config (Recommended for Getting Started)

Perfect for tutorials, proof-of-concepts, and learning:

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

**Pros:**
- ✅ Works immediately
- ✅ No credential setup required
- ✅ Perfect for quick prototypes

**Cons:**
- ⚠️ Shared rate limits
- ⚠️ Not suitable for production
- ⚠️ No custom branding

### Pattern 2: Environment Variable Override

Use your own credentials via environment variables:

```tsx
// .env.local
VARITY_PRIVY_APP_ID=your-privy-app-id
VARITY_THIRDWEB_CLIENT_ID=your-thirdweb-client-id
```

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

The SDK will automatically use your environment variables if they exist.

### Pattern 3: Explicit Props (Production)

Explicitly provide credentials via props:

```tsx
import { PrivyStack } from '@varity/ui-kit';

function App() {
  return (
    <PrivyStack
      appId={process.env.PRIVY_APP_ID}
      thirdwebClientId={process.env.THIRDWEB_CLIENT_ID}
    >
      <YourApp />
    </PrivyStack>
  );
}
```

**Pros:**
- ✅ Explicit and clear
- ✅ Easy to test with different credentials
- ✅ Production-ready

## Production Upgrade Path

### Step 1: Get Privy App ID

1. Visit [Privy Dashboard](https://dashboard.privy.io)
2. Sign up or log in
3. Click "Create New App"
4. Configure login methods:
   - Email (recommended)
   - Google, Discord, Twitter (optional)
   - Wallet (MetaMask, WalletConnect, etc.)
5. Copy your App ID (starts with `clp`)

**Free Tier**: Up to 1,000 monthly active users

### Step 2: Get thirdweb Client ID

1. Visit [thirdweb Dashboard](https://thirdweb.com/dashboard)
2. Sign up or log in
3. Click "Create Project"
4. Configure settings:
   - Project name
   - Allowed domains (for production)
5. Copy your Client ID

**Free Tier**: Generous limits for development

### Step 3: Configure Environment Variables

Create a `.env.local` file in your project root:

```bash
# Production credentials
PRIVY_APP_ID=clpq_your_actual_privy_app_id
THIRDWEB_CLIENT_ID=your_actual_thirdweb_client_id

# Optional: Override defaults
VARITY_PRIVY_APP_ID=clpq_your_actual_privy_app_id
VARITY_THIRDWEB_CLIENT_ID=your_actual_thirdweb_client_id
```

**Important**: Add `.env.local` to your `.gitignore`:

```gitignore
# Environment variables
.env.local
.env.production
.env.*.local
```

### Step 4: Update Your Code

```tsx
import { PrivyStack } from '@varity/ui-kit';

function App() {
  return (
    <PrivyStack
      appId={process.env.PRIVY_APP_ID}
      thirdwebClientId={process.env.THIRDWEB_CLIENT_ID}
    >
      <YourApp />
    </PrivyStack>
  );
}
```

### Step 5: Verify Production Setup

```tsx
import {
  isProductionCredentials,
  validateCredentials
} from '@varity/sdk';

const appId = process.env.PRIVY_APP_ID;
const clientId = process.env.THIRDWEB_CLIENT_ID;

// Check if using production credentials
if (!isProductionCredentials(appId, clientId)) {
  console.error('❌ Production requires custom credentials!');
}

// Validate credentials
try {
  validateCredentials(appId!, clientId!);
  console.log('✅ Credentials validated successfully');
} catch (error) {
  console.error('❌ Invalid credentials:', error.message);
}
```

## Deployment Environments

### Development

```tsx
// Uses VARITY_DEV_CREDENTIALS automatically
<PrivyStack>
  <YourApp />
</PrivyStack>
```

Console output:
```
🔧 Varity Dev Mode: Using shared development credentials.
```

### Staging

```bash
# .env.staging
PRIVY_APP_ID=clpq_staging_app_id
THIRDWEB_CLIENT_ID=staging_client_id
```

```tsx
<PrivyStack
  appId={process.env.PRIVY_APP_ID}
  thirdwebClientId={process.env.THIRDWEB_CLIENT_ID}
>
  <YourApp />
</PrivyStack>
```

### Production

```bash
# .env.production
PRIVY_APP_ID=clpq_production_app_id
THIRDWEB_CLIENT_ID=production_client_id
```

```tsx
<PrivyStack
  appId={process.env.PRIVY_APP_ID}
  thirdwebClientId={process.env.THIRDWEB_CLIENT_ID}
>
  <YourApp />
</PrivyStack>
```

**Production Warning**: If you accidentally use shared dev credentials in production, you'll see:

```
⚠️  WARNING: Using shared VARITY_DEV_CREDENTIALS in production environment!

Shared credentials are NOT suitable for production use.

Action Required:
1. Get Privy App ID: https://dashboard.privy.io
2. Get thirdweb Client ID: https://thirdweb.com/dashboard
3. Set environment variables:
   - PRIVY_APP_ID=your-privy-app-id
   - THIRDWEB_CLIENT_ID=your-thirdweb-client-id
```

## Advanced Usage

### Check Credential Type

```tsx
import { isUsingDevCredentials } from '@varity/sdk';

const appId = process.env.PRIVY_APP_ID;
const clientId = process.env.THIRDWEB_CLIENT_ID;

if (isUsingDevCredentials(appId, clientId)) {
  console.log('Using shared dev credentials');
} else {
  console.log('Using custom credentials');
}
```

### Get Upgrade Instructions

```tsx
import { getUpgradeInstructions } from '@varity/sdk';

// Display in UI
console.log(getUpgradeInstructions());
```

### Resolve Credentials Manually

```tsx
import { resolveCredentials } from '@varity/sdk';

// Manually resolve credentials with fallback
const credentials = resolveCredentials(
  process.env.PRIVY_APP_ID,
  process.env.THIRDWEB_CLIENT_ID
);

console.log(credentials.privy.appId);
console.log(credentials.thirdweb.clientId);
```

## Security Best Practices

### 1. Never Commit Credentials

```gitignore
# .gitignore
.env
.env.local
.env.production
.env.*.local
```

### 2. Use Environment Variables

```tsx
// ✅ CORRECT
appId={process.env.PRIVY_APP_ID}

// ❌ WRONG - Never hardcode
appId="clpq_hardcoded_app_id"
```

### 3. Validate in CI/CD

```bash
# In your deployment script
if [ -z "$PRIVY_APP_ID" ]; then
  echo "Error: PRIVY_APP_ID not set"
  exit 1
fi

if [ -z "$THIRDWEB_CLIENT_ID" ]; then
  echo "Error: THIRDWEB_CLIENT_ID not set"
  exit 1
fi
```

### 4. Rotate Credentials Periodically

Privy and thirdweb allow credential rotation. Update your environment variables when rotating.

## Troubleshooting

### Issue: "Missing Privy App ID"

**Cause**: No appId provided and VARITY_DEV_CREDENTIALS not available

**Solution**:
```tsx
<PrivyStack appId={process.env.PRIVY_APP_ID}>
```

### Issue: "Rate limit exceeded"

**Cause**: Too many developers using shared credentials

**Solution**: Upgrade to your own credentials

### Issue: "Authentication failed in production"

**Cause**: Using shared dev credentials in production

**Solution**:
1. Get production credentials
2. Set environment variables
3. Deploy with production config

### Issue: "Privy App ID should start with 'clp'"

**Cause**: Invalid or malformed App ID

**Solution**: Copy the full App ID from Privy Dashboard (includes 'clp' prefix)

## Cost Comparison

### Shared Development Credentials (Free)

- ✅ Perfect for learning and prototyping
- ⚠️ Shared rate limits
- ⚠️ No SLA guarantee
- ⚠️ Not suitable for production

### Production Credentials (Free Tier Available)

**Privy:**
- Free: Up to 1,000 MAU
- Growth: $99/month for up to 10,000 MAU
- Custom branding
- Priority support

**thirdweb:**
- Free tier with generous limits
- Pay-as-you-grow pricing
- Full feature access
- Production SLA

## Examples

### Complete Development Setup

```tsx
// src/App.tsx
import { PrivyStack } from '@varity/ui-kit';
import { Dashboard } from './components/Dashboard';

export default function App() {
  return (
    <PrivyStack>
      <Dashboard />
    </PrivyStack>
  );
}
```

### Complete Production Setup

```bash
# .env.production
PRIVY_APP_ID=clpq_production_abc123
THIRDWEB_CLIENT_ID=production_xyz789
```

```tsx
// src/App.tsx
import { PrivyStack } from '@varity/ui-kit';
import { Dashboard } from './components/Dashboard';
import { validateCredentials } from '@varity/sdk';

// Validate on startup
const appId = process.env.PRIVY_APP_ID;
const clientId = process.env.THIRDWEB_CLIENT_ID;

if (process.env.NODE_ENV === 'production') {
  if (!appId || !clientId) {
    throw new Error('Production credentials required!');
  }
  validateCredentials(appId, clientId);
}

export default function App() {
  return (
    <PrivyStack
      appId={appId}
      thirdwebClientId={clientId}
    >
      <Dashboard />
    </PrivyStack>
  );
}
```

## Migration Timeline

### Week 1: Development (Shared Credentials)

```tsx
<PrivyStack>
  <YourApp />
</PrivyStack>
```

### Week 2-3: Staging (Your Own Credentials)

```tsx
<PrivyStack
  appId={process.env.PRIVY_APP_ID}
  thirdwebClientId={process.env.THIRDWEB_CLIENT_ID}
>
  <YourApp />
</PrivyStack>
```

### Week 4: Production Launch

```bash
# Production environment variables set
# Credentials validated in CI/CD
# Monitoring enabled
```

## Support

- **Documentation**: https://docs.varity.io/credentials
- **Discord**: https://discord.gg/varity
- **Email**: support@varity.io
- **GitHub Issues**: https://github.com/varity-labs/varity-sdk/issues

## FAQ

**Q: Can I use shared credentials in production?**
A: No. Shared credentials have rate limits and may be rotated. Use your own credentials for production.

**Q: How much does it cost to upgrade?**
A: Both Privy and thirdweb offer generous free tiers. You only pay when you exceed the free tier limits.

**Q: Can I test with my own credentials in development?**
A: Yes! Set `PRIVY_APP_ID` and `THIRDWEB_CLIENT_ID` environment variables, and the SDK will use them instead of shared credentials.

**Q: What happens if shared credentials are rotated?**
A: We'll announce rotations in advance. Your own credentials are never affected by rotations.

**Q: Do I need both Privy and thirdweb accounts?**
A: Yes, Varity uses both services. Privy handles authentication, and thirdweb provides blockchain infrastructure.

---

**Last Updated**: January 19, 2026
