# Changelog

All notable changes to the Varity SDK will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0-beta.3] - 2026-03-06

### Added
- **@varity-labs/mcp** v1.0.2 — MCP Server for AI coding tools
  - 7 tools: search docs, calculate costs, create apps, deploy, check status, read logs, submit to store
  - Works with Cursor, Claude Code, VS Code (Copilot), Windsurf, and any MCP client
  - 15 searchable documentation entries with accurate API references
- **ZeroDev Account Abstraction** — gasless transactions enabled by default
  - ZeroDevProvider exported from @varity-labs/ui-kit
  - Conduit bundler + paymaster (EntryPoint v0.7)
  - Kernel v0.3.1 smart accounts
  - Zero configuration required for developers

### Changed
- **varitykit** v1.1.4 — zero crypto jargon in all CLI output
  - "platforms" instead of "chains"
  - `--target varity` or `--target avalanche`
  - No blockchain terminology in any user-facing text
- **create-varity-app** v2.0.0-beta.3 — jargon-free SaaS starter template
  - ZeroDev AA integration included by default
  - `useAuth()` abstraction layer
  - `NEXT_PUBLIC_VARITY_AUTH_ID` instead of provider-specific env vars
- **@varity-labs/ui-kit** v2.0.0-beta.3 — ZeroDevProvider added
- **@varity-labs/sdk** v2.0.0-beta.2 — contract addresses exported
- **@varity-labs/types** v2.0.0-beta.2 — core types updated

### Fixed
- 6 incorrect API references in MCP search-docs entries
- 8 documentation URLs in MCP tool responses

## [2.0.0-beta.2] - 2026-02-16

### Added
- **create-varity-app** v1.0.0 — `npx create-varity-app my-app` scaffolding
  - SaaS starter template with auth, database, dashboard
  - Works with npm, pnpm, and yarn
- **@varity-labs/mcp** v1.0.0 — initial MCP server release
  - stdio transport, no API keys required

### Changed
- All package READMEs updated with cross-links

## [2.0.0-beta.1] - 2026-02-08

### Added
- **@varity-labs/sdk** — core SDK with zero-config database
  - `db.collection()` API with `.add()`, `.get()`, `.update()`, `.delete()`
  - Built-in credential management
- **@varity-labs/ui-kit** — 19 production-ready React components
  - PrivyStack (auth provider, zero-config)
  - PrivyLoginButton, PrivyUserProfile
  - DashboardLayout, DataTable, KPICard
  - ConfirmDialog, CommandPalette, ToastProvider
  - Button, Toggle, Avatar, EmptyState, and more
- **@varity-labs/types** — shared TypeScript type definitions
  - APIResponse, UserProfile, DashboardConfig
  - Runtime error utilities
- **varitykit** CLI — init, deploy, manage apps from terminal
  - `varitykit doctor` — environment validation
  - `varitykit init` — scaffold new apps
  - `varitykit app deploy` — deploy to production
  - `varitykit app deploy --submit-to-store` — deploy + App Store listing
- SaaS starter template with Next.js 15, Tailwind CSS, TypeScript
  - Landing page, auth, dashboard, settings, data tables
  - Command palette (Cmd+K), toast notifications, 4 color themes

### Infrastructure
- Varity L3 deployed (Arbitrum Orbit, Chain ID 33529)
- Gateway v1.5.0 live at https://varity.app
- Credential Proxy v1.1.1 live
- DB Proxy v1.0.2 live
- TemplateMarketplace contract: 90/10 revenue split

## License

MIT License - See [LICENSE](LICENSE) file for details.

---

[Website](https://www.varity.so) · [Documentation](https://docs.varity.so) · [GitHub](https://github.com/varity-labs) · [Discord](https://discord.gg/7vWsdwa2Bg) · [X/Twitter](https://x.com/VarityHQ)
