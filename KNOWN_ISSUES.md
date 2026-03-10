# Known Issues — Varity SDK

> **Last Updated:** March 8, 2026
> **Status:** Beta — all core packages published and working

---

## What Works

| Feature | Package | Status |
|---------|---------|--------|
| Auth (email, social login) | @varity-labs/ui-kit@2.0.0-beta.5 | Working |
| Database (zero-config CRUD) | @varity-labs/sdk@2.0.0-beta.2 | Working |
| CLI deploy (static + dynamic) | varitykit@1.1.4 | Working |
| 19 UI components | @varity-labs/ui-kit@2.0.0-beta.5 | Working |
| MCP server (Cursor/Windsurf) | @varity-labs/mcp@1.0.2 | Working |
| App scaffolding | create-varity-app@2.0.0-beta.3 | Working |
| Gas sponsorship (automatic) | @varity-labs/ui-kit@2.0.0-beta.5 | Working |
| 4 color themes | saas-starter template | Working |

## Coming Soon

| Feature | Timeline | Notes |
|---------|----------|-------|
| Payments (credit card on/off ramp) | Before MVP launch | PaymentWidget exists but is placeholder |
| Storage API | Before MVP launch | File upload/download |
| App Store submission flow | In progress | `varitykit app submit` partially implemented |
| `useAuth()` abstraction | Post-beta | Currently uses `usePrivy()` directly |
| `NEXT_PUBLIC_VARITY_AUTH_ID` | Post-beta | Currently uses `NEXT_PUBLIC_PRIVY_APP_ID` |

## Known Limitations

### 1. React 18/19 Type Conflicts
If you see TypeScript errors related to React types, add this to `next.config.js`:
```js
typescript: { ignoreBuildErrors: true }
```
This is a known conflict between React 18 and 19 type definitions and does not affect runtime behavior.

### 2. SSL Certificate Requires www Prefix
Use `www.varity.so` (not `varity.so`) when accessing the marketing site. The App Store and docs subdomains work without www.

### 3. Database Has No Query Filters
`db.collection().get()` returns all documents. Filter client-side. There is no `.where()` or `.getById()` method.

### 4. Static Export Only (Beta)
Templates use `output: 'export'` for IPFS hosting. No server-side rendering, API routes, or dynamic routes. Dynamic hosting via Akash is available via `varitykit deploy --hosting dynamic`.

## Reporting Issues

- GitHub: https://github.com/varity-labs/varity-sdk/issues
- Discord: https://discord.gg/7vWsdwa2Bg
