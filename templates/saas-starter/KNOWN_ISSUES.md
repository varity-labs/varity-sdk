# Known Issues — SaaS Starter Template

> **Last Updated:** February 14, 2026
> **Template:** `saas-starter` (TaskFlow)
> **Status:** All features functional, builds with 0 errors (8 routes + _not-found)

---

## What Works

| Feature | Status | Notes |
|---------|--------|-------|
| Landing Page | Working | 6 sections, scroll animations, social proof, testimonials, dashboard mockup |
| Login | Working | Privy email/Google auth, zero-config with dev credentials, auto-redirect |
| Dashboard | Working | KPI cards, getting started checklist, recent activity feed |
| Projects CRUD | Working | Master-detail, nested tasks, CSV export, validation, optimistic updates |
| Tasks CRUD | Working | Status cycling (click to advance), filtering, CSV export, cross-references projects |
| Team CRUD | Working | Invite members, role management, email validation, role badges |
| Settings | Working | 4 tabs (General, Security, Billing, Account), backend persistence via DB Proxy, skeleton loading |
| Command Palette | Working | Cmd+K / Ctrl+K, searches pages and actions |
| Toast Notifications | Working | Success/error/info with progress bar, exit animation, max 3 stack |
| Protected Routes | Working | Automatic redirect for unauthenticated users |
| Color Themes | Working | 4 built-in presets (Blue, Purple, Green, Orange) via CSS variables |
| Static Export | Working | `output: 'export'` for IPFS deployment |
| Mobile Nav | Working | Hamburger menu with responsive sidebar |
| CSV Export | Working | One-click export for tasks and projects |
| SEO | Working | OpenGraph, Twitter cards, robots.txt, sitemap template |

## Known Issues

### 1. Navigation Flash (UI-Kit Limitation)
Brief "Initializing Dashboard" screen when navigating between dashboard pages. Caused by `PrivyReadyGate` in UI-Kit re-checking auth state on each route change. Resolves in <1 second. This is a UI-Kit issue, not template-side.

### 2. DashboardLayout Mobile Support
The `DashboardLayout` from `@varity-labs/ui-kit` does not include mobile navigation. The template provides its own responsive sidebar in `src/app/dashboard/layout.tsx` as a workaround. UI-Kit mobile improvements are planned post-MVP.

### 3. Billing Section is Mock
The Settings > Billing tab shows a mock UI (plan name, usage bars, payment method). Developers should wire their own billing provider (Stripe, etc.).

### 4. Sessions Are Mock
The Settings > Security tab shows active sessions with a "Revoke" button. Session data is client-side mock — real session management is handled by Privy (the auth provider).

### 5. Password & Profile Managed by Auth Provider
"Change password" and profile photo are managed by Privy (the auth provider). The Settings page shows informational dialogs explaining this.

### 6. No Server-Side Rendering
All pages are statically exported (`output: 'export'`). No server-side rendering, API routes, or middleware. Data fetching happens client-side via the SDK.

### 7. Team Email Invites
No SMTP integration — team members are added to the database only. No invitation email is sent. Developers should integrate their own email service.

## Environment

### Development (Zero Config)
```bash
npm install
npm run dev
```
No `.env` file, API keys, or accounts needed. Shared development credentials are built in.

### Production
```bash
varitykit app deploy
```
The CLI provisions a private database, injects production credentials, and deploys automatically.

## Reporting Issues

Please report issues at: https://github.com/varity-labs/varity-sdk/issues
