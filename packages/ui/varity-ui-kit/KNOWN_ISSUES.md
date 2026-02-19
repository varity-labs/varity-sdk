# Known Issues — @varity-labs/ui-kit@2.0.0-alpha.1

> **Last Updated:** February 10, 2026
> **Build Status:** PASSES (0 errors)
> **Test Status:** 57/57 pass (4 MVP test suites: KPICard, EmptyState, DataTable, InitScreens)

---

## What Works

| Feature | Status | Notes |
|---------|--------|-------|
| **PrivyStack** (auth provider) | Working | Zero-config with dev credentials |
| **PrivyLoginButton** | Working | Email, social, wallet login |
| **PrivyUserProfile** | Working | Shows user info + logout |
| **PrivyProtectedRoute** | Working | Guards content behind auth |
| **PrivyReadyGate** | Working | Loading screen during init |
| **InitializingScreen** | Working | Professional loading UI |
| **InitTimeoutScreen** | Working | Timeout with retry option |
| **KPICard** | Working | Variants, sizes, trends, loading |
| **DataTable** | Working | Sorting, pagination, custom renderers |
| **EmptyState** | Working | 5 presets, customizable |
| **DashboardLayout** | Partial | Desktop only — no mobile support |
| **PaymentWidget** | Beta | Payment system is in beta (see note) |
| **PaymentGate** | Beta | Payment system is in beta (see note) |
| **usePrivy** (re-exported) | Working | Privy's authentication hook |
| **useTheme** | Working | Theme context hook |

## What Doesn't Work

### 1. DashboardLayout — No Mobile Responsiveness
The `DashboardLayout` component uses fixed pixel widths with `marginLeft` and has no hamburger menu or responsive breakpoints. **The SaaS Template works around this** by implementing its own mobile navigation in `layout.tsx`.

**Workaround:** Build your own mobile navigation (see SaaS Template for reference).

### 2. Non-Functional Hooks (Hidden from Exports)
The following hooks are commented out because they require a backend API that doesn't exist yet:
- `useVarityAPI`, `useVarityQuery`, `useVarityMutation`
- `useAuth` (uses SIWE — use `usePrivy` instead)
- `useAnalytics`, `useKPI`
- `useDashboard`, `useWidgetData`
- `useWalletAuth`

**These are NOT exported** and will not appear in your IDE autocomplete.

### 3. Non-Functional Module Clients (Hidden from Exports)
13 API client modules (VarityClient, AuthClient, StorageClient, etc.) are commented out. They all call `api.varity.so` which doesn't exist.

### 4. Test Coverage
57 MVP component tests exist across 4 test suites:
- KPICard: 17 tests (render, loading, click, variants, sizes, trends)
- EmptyState: 16 tests (render, actions, presets, sizes)
- DataTable: 15 tests (render, sort, pagination, custom renderers, row click)
- InitScreens: 9 tests (render defaults, no blockchain jargon, custom content)

Tests can be run with: `node node_modules/jest/bin/jest.js --config jest.config.cjs`

### 5. npm Package is Outdated
The published npm package still has:
- `workspace:*` dependencies (breaks npm install)
- Old blockchain-focused description/keywords
- Some non-functional hooks still exported

**Will be republished** after all audit fixes are complete.

## Payment System (Beta)

The `PaymentWidget` and `PaymentGate` components are functional but the payment infrastructure is in beta:
- Payment contract needs to be deployed to Arbitrum One (currently on testnet)
- USDC payments use test tokens on testnet ($0 value)
- Two-step flow: Approve USDC → Execute payment

**Do not rely on payments for beta testing.** Use free tier for now.

## Environment Variables

| Variable | Required? | Default |
|----------|-----------|---------|
| `NEXT_PUBLIC_PRIVY_APP_ID` | No | Dev credentials auto-resolve |
| `NEXT_PUBLIC_THIRDWEB_CLIENT_ID` | No | Dev credentials auto-resolve |

## For Beta Testers

**Recommended imports:**
```tsx
// Provider (root of your app)
import { PrivyStack } from '@varity-labs/ui-kit';

// Authentication
import { PrivyLoginButton, PrivyUserProfile, PrivyProtectedRoute, usePrivy } from '@varity-labs/ui-kit';

// Dashboard components
import { KPICard, DataTable, EmptyState } from '@varity-labs/ui-kit';

// Types
import type { NavigationItem } from '@varity-labs/ui-kit';
```

**Do NOT import** (will not work):
- `VarityClient` or any module client
- `useAuth`, `useAnalytics`, `useDashboard`, `useWalletAuth`
- `VarityAPIProvider`

## Reporting Issues

Please report issues at: https://github.com/varity-labs/varity-sdk/issues
