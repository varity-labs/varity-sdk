# @varity-labs/ui-kit

[![npm](https://img.shields.io/npm/v/@varity-labs/ui-kit)](https://www.npmjs.com/package/@varity-labs/ui-kit)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/varity-labs/varity-sdk/blob/main/LICENSE)

Production-ready React component library for building applications on Varity. 19 components, dashboard layouts, analytics widgets, authentication, and payments — everything you need to build a full SaaS app.

## Install

```bash
npm install @varity-labs/ui-kit @varity-labs/sdk @varity-labs/types
```

## Quick Start

```tsx
import { PrivyStack } from '@varity-labs/ui-kit'

function App() {
  return (
    <PrivyStack>
      <YourApp />
    </PrivyStack>
  )
}
```

That's it — authentication, theming, and providers are all configured automatically with zero setup.

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
| `EmptyState` | Empty state placeholder with presets |

### Navigation (2)

| Component | Description |
|-----------|-------------|
| `CommandPalette` | Cmd+K command search and navigation |
| `Breadcrumb` | Navigation breadcrumbs |

### Dashboard Layout (4)

| Component | Description |
|-----------|-------------|
| `DashboardLayout` | Full dashboard wrapper |
| `DashboardHeader` | Top navigation bar |
| `DashboardSidebar` | Side navigation |
| `DashboardFooter` | Footer |

### Analytics (6)

| Component | Description |
|-----------|-------------|
| `DataTable` | Sortable, filterable data table |
| `KPICard` / `EnhancedKPICard` | Key performance indicator cards |
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

Built-in authentication via Privy — email, Google, and wallet login with zero configuration:

```tsx
import { PrivyStack } from '@varity-labs/ui-kit'
import { usePrivy } from '@privy-io/react-auth'

function App() {
  return (
    <PrivyStack>
      <Dashboard />
    </PrivyStack>
  )
}

function Dashboard() {
  const { login, logout, authenticated, user } = usePrivy()

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

- `PrivyLoginButton` — Drop-in login button
- `PrivyUserProfile` — User profile display
- `PrivyProtectedRoute` — Route protection wrapper
- `PrivyReadyGate` — Loading gate during initialization
- Re-exports: `usePrivy`, `useWallets`, `useLogin`, `useLogout`

## Payments

Built-in payment components for app monetization (90% to developer, 10% platform fee):

```tsx
import { PaymentWidget, PaymentGate } from '@varity-labs/ui-kit'

// One-time payment button
<PaymentWidget appId="your-app" price={4.99} />

// Paywall — hides content until payment
<PaymentGate appId="your-app" price={9.99}>
  <PremiumContent />
</PaymentGate>
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
  PrivyStack,
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
    <PrivyStack>
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
    </PrivyStack>
  )
}
```

## Compatibility

- **React** 18+
- **Next.js** 13+ (App Router compatible)
- **Static export** safe (`output: 'export'`)
- All components have `'use client'` directives
- WCAG 2.1 Level A accessibility

---

## Related Packages

- **[@varity-labs/sdk](../../core/varity-sdk/)** — Core SDK (database, credentials)
- **[@varity-labs/types](../../core/varity-types/)** — Shared TypeScript types
- **[@varity-labs/mcp](../../cli/varity-mcp/)** — MCP server for AI editors (Cursor, Claude Code, VS Code)
- **[create-varity-app](../../cli/create-varity-app/)** — Project scaffolding

---

**Part of the [Varity SDK](https://github.com/varity-labs/varity-sdk)** — Build, deploy, and monetize apps 70% cheaper than AWS.

[Documentation](https://docs.varity.so) · [GitHub](https://github.com/varity-labs/varity-sdk) · [Discord](https://discord.gg/varity)

## License

MIT
