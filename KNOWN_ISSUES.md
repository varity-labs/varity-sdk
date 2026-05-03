# Known Issues — Varity SDK

> **Last Updated:** March 12, 2026
> **Status:** Beta — all core packages published and working

---

## What Works

| Feature | Package | Status |
|---------|---------|--------|
| Auth (email, social login) | @varity-labs/ui-kit | Working |
| Database (zero-config CRUD) | @varity-labs/sdk | Working |
| CLI deploy (static apps) | varitykit | Working |
| 19 UI components | @varity-labs/ui-kit | Working |
| MCP server (Cursor, Claude Code, VS Code) | @varity-labs/mcp | Working |
| App scaffolding | create-varity-app | Working |
| Automatic account abstraction | @varity-labs/ui-kit | Working |
| 4 color themes | saas-starter template | Working |

## Coming Soon

| Feature | Notes |
|---------|-------|
| Payments (credit card) | PaymentWidget component exists but payment processing is not yet live |
| Dynamic hosting | Currently only static apps are supported |
| File storage API | File upload/download (structured data storage works today) |
| `useAuth()` abstraction | Planned abstraction layer for auth hooks |

## Known Limitations

### 1. React 18/19 Type Conflicts

If you see TypeScript errors related to React types, add this to `next.config.js`:

```js
typescript: { ignoreBuildErrors: true }
```

This is a known conflict between React 18 and 19 type definitions and does not affect runtime behavior.

### 2. SSL Certificate Requires www Prefix

Use `www.varity.so` (not `varity.so`) when accessing the marketing site. The App Store and docs subdomains work without www.

### 3. Database Has No Server-Side Query Filters

`db.collection().get()` returns all documents. Filter client-side after fetching. There is no `.where()` or `.getById()` method.

### 4. Static Export Only (Beta)

Templates use `output: 'export'` for static hosting. Server-side rendering, API routes, and dynamic routes are not supported during the beta. Dynamic hosting is coming soon.

### 5. ESM Only

The SDK uses ES modules (`"type": "module"`). Use `import` syntax — `require()` is not supported.

## Reporting Issues

- **GitHub Issues:** [varity-labs/varity-sdk/issues](https://github.com/varity-labs/varity-sdk/issues)
- **Discord:** [discord.gg/7vWsdwa2Bg](https://discord.gg/7vWsdwa2Bg)
- **Security:** Email security@varity.so (do not open public issues for vulnerabilities)
