# @varity-labs/ui-kit

[![npm](https://img.shields.io/npm/v/@varity-labs/ui-kit)](https://www.npmjs.com/package/@varity-labs/ui-kit)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/varity-labs/varity-sdk/blob/main/LICENSE)

Production-ready React component library for building applications on Varity. Dashboard layouts, analytics widgets, authentication, and payments -- everything you need to build a full SaaS app.

## Install

```bash
npm install @varity-labs/ui-kit @varity-labs/sdk @varity-labs/types
```

Peer dependencies: `react` and `react-dom` 18+.

## Quick Start

```tsx
import { AuthProvider } from '@varity-labs/ui-kit'

function App() {
  return (
    <AuthProvider>
      <YourApp />
    </AuthProvider>
  )
}
```

Authentication, theming, and providers are all configured automatically with zero setup.

## Components

### Form (7)

| Component | Description |
|-----------|-------------|
| `Button` | Primary, secondary, outline, ghost, danger variants |
| `Input` | Text input with labels and validation |
| `Textarea` | Multi-line text input |
| `Select` | Dropdown selector |
| `Toggle` | On/off switch |
| `Checkbox` | Multi-select checkbox |
| `RadioGroup` | Single-select radio buttons |

### Overlay (3)

| Component | Description |
|-----------|-------------|
| `Dialog` | Modal dialog with focus trap |
| `ConfirmDialog` | Confirmation modal with confirm/cancel |
| `DropdownMenu` | Context menu with keyboard navigation |

### Feedback (3)

| Component | Description |
|-----------|-------------|
| `ToastProvider` + `useToast` | Notification toasts (success, error, info) |
| `Skeleton` | Loading skeleton placeholder |
| `ProgressBar` | Progress indicator |

### Display (3)

| Component | Description |
|-----------|-------------|
| `Badge` | Status badges (+ PriorityBadge, ProjectStatusBadge, TaskStatusBadge, RoleBadge) |
| `Avatar` + `AvatarGroup` | User avatars |
| `ProgressBar` | Progress indicator bar |

### Navigation (2)

| Component | Description |
|-----------|-------------|
| `CommandPalette` | Cmd+K command search and navigation |
| `Breadcrumb` | Navigation breadcrumbs |

### Dashboard (7)

| Component | Description |
|-----------|-------------|
| `DashboardLayout` | Full dashboard wrapper |
| `DashboardHeader` | Top navigation bar |
| `DashboardSidebar` | Side navigation |
| `DashboardFooter` | Footer |
| `KPICard` | Key performance indicator card |
| `EmptyState` | Empty state placeholder with presets |
| `LoadingSkeleton` | Dashboard loading skeleton (+ SkeletonText, SkeletonCard, SkeletonTable, SkeletonList) |

### Analytics (6)

| Component | Description |
|-----------|-------------|
| `DataTable` | Sortable, filterable data table |
| `EnhancedKPICard` | Enhanced KPI card with trends |
| `AnalyticsCard` | Analytics data card |
| `ChartContainer` | Chart wrapper with actions |
| `MetricDisplay` | Metric value display |
| `Sparkline` | Mini inline chart |

### Branding (3)

| Component | Description |
|-----------|-------------|
| `ThemeProvider` + `useTheme` | Theme management with presets |
| `Logo` | Varity logo |
| `Attribution` | "Powered by Varity" attribution |

## Authentication

Built-in authentication -- email, Google, and social login with zero configuration:

```tsx
import { AuthProvider, LoginButton } from '@varity-labs/ui-kit'
import { useAuth } from '@varity-labs/ui-kit'

function App() {
  return (
    <AuthProvider>
      <Dashboard />
    </AuthProvider>
  )
}

function Dashboard() {
  const { login, logout, authenticated, user } = useAuth()

  if (!authenticated) {
    return <button onClick={login}>Sign In</button>
  }

  return (
    <div>
      <p>Welcome, {user?.email?.address}</p>
      <button onClick={logout}>Sign Out</button>
    </div>
  )
}
```

### Auth Components

| Component | Description |
|-----------|-------------|
| `LoginButton` | Drop-in login button |
| `UserProfile` | User profile display |
| `ProtectedRoute` | Route protection wrapper |
| `ReadyGate` | Loading gate during initialization |

### Auth Hooks

| Hook | Description |
|------|-------------|
| `useAuth` | Authentication state and actions |
| `useSignIn` | Trigger sign-in flow |
| `useSignOut` | Trigger sign-out flow |

## Payments (Coming Soon)

Payment components for app monetization (90% to developer, 10% platform fee).

> **Note:** Payment components are exported but the underlying payment processing is not yet live. APIs will change before stable release.

```tsx
import { PaymentWidget, PaymentGate, useVarityPayment } from '@varity-labs/ui-kit'

// Wrap a trigger element -- opens checkout on click
// appId is a number (from Varity App Registry)
// price is in cents (e.g., 9900 = $99.00)
<PaymentWidget appId={123} price={9900} onSuccess={(receipt) => console.log('Paid!', receipt)}>
  <button>Buy Premium - $99</button>
</PaymentWidget>

// Paywall -- shows fallback until purchased, then reveals children
<PaymentGate appId={123} price={9900} fallback={<LockedContent />}>
  <PremiumContent />
</PaymentGate>

// Hook for custom payment flows
const { hasPurchased, purchase, isLoading } = useVarityPayment({ appId: 123 })
```

## Theming

```tsx
import { ThemeProvider, useTheme } from '@varity-labs/ui-kit'

function App() {
  return (
    <ThemeProvider defaultTheme="dark">
      <YourApp />
    </ThemeProvider>
  )
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  return (
    <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      Toggle Theme
    </button>
  )
}
```

## Full Dashboard Example

```tsx
import {
  AuthProvider,
  DashboardLayout,
  DashboardHeader,
  DashboardSidebar,
  KPICard,
  DataTable,
  CommandPalette,
  ToastProvider,
  useToast,
} from '@varity-labs/ui-kit'

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <DashboardLayout>
          <DashboardSidebar items={sidebarItems} />
          <DashboardHeader title="My Dashboard" />
          <CommandPalette commands={commands} onNavigate={(path) => router.push(path)} />
          <main>
            <KPICard title="Revenue" value="$12,345" trend={8.2} />
            <DataTable columns={columns} data={data} />
          </main>
        </DashboardLayout>
      </ToastProvider>
    </AuthProvider>
  )
}
```

## Providers

| Provider | Description |
|----------|-------------|
| `AuthProvider` | All-in-one provider (auth + theme + query client) |
| `ThemeProvider` | Theme management |
| `ToastProvider` | Toast notifications |
| `VarityDashboardProvider` | Dashboard state management |

## Compatibility

- **React** 18+
- **Next.js** 13+ (App Router compatible)
- **Static export** safe (`output: 'export'`)
- All components have `'use client'` directives

---

## Related Packages

- **[@varity-labs/sdk](https://www.npmjs.com/package/@varity-labs/sdk)** -- Core SDK (database, credentials)
- **[@varity-labs/types](https://www.npmjs.com/package/@varity-labs/types)** -- Shared TypeScript types
- **[@varity-labs/mcp](https://www.npmjs.com/package/@varity-labs/mcp)** -- MCP server for AI editors (Cursor, Claude Code, VS Code)
- **[create-varity-app](https://www.npmjs.com/package/create-varity-app)** -- Project scaffolding

---

**Part of the [Varity SDK](https://github.com/varity-labs/varity-sdk).** Deploy any app, AI agent, or LLM in 60 seconds. 60-80% cheaper than AWS.

[Documentation](https://docs.varity.so) | [GitHub](https://github.com/varity-labs/varity-sdk) | [Discord](https://discord.gg/7vWsdwa2Bg)

## License

MIT
