# Changelog

All notable changes to the Varity SDK will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0-beta.14] - 2026-04-19

### Added
- **Dynamic cloud hosting** — new compute provider fully integrated
  - Multi-service deployments (app + postgres + redis + ollama)
  - Managed hosting API — no local tooling or provider accounts needed
  - Git clone at runtime (no Docker required on developer machine)
  - Orchestration algorithm auto-detects static vs dynamic hosting
- **varity_login** MCP tool — authenticate with deploy key or browser
- **varity_add_collection** — full codegen for database collections (types, hooks, API)
- **Varity Payments** — usage-based billing with Stripe integration
- **Stripe payments** — credit card → deploy key, zero setup UX
- **Vercel migration strategy** — `13-vercel-migration/` with full implementation spec

### Changed
- **@varity-labs/mcp** v2.0.0-beta.14 — 15 tools, 5 resources, 3 prompts
- **@varity-labs/sdk** v2.0.0-beta.11 — thirdweb REMOVED from runtime deps
- **@varity-labs/ui-kit** v2.0.0-beta.12 — legacy third-party bindings removed, unused files excluded from build
- **@varity-labs/types** v2.0.0-beta.5
- **create-varity-app** v2.0.0-beta.22 — webpack stubs for optional third-party libraries
- **varitykit** v1.2.5 — compute hosting API integration, multi-service configuration generation
- **Gateway** v1.7.6 — fixed http:// prefix for provider URLs
- **Credential Proxy** v1.1.3 — added `/api/credentials/hosting` endpoint
- Revenue model: usage-based billing with 20% hidden margin (tier pricing removed)
- Primary flow: custom apps via MCP (SaaS template is secondary)

### Fixed
- Gateway ERR_INVALID_URL — prepend http:// to provider URLs
- MCP deploy not routing to dynamic hosting — --hosting dynamic flag for all dynamic frameworks
- project_info.features crash — replaced with _detect_database_need() method
- Leading comma in add_collection codegen (import type {, Client})
- workspace:^ leak in published packages
- Python 3.8 breaking varitykit — now requires 3.11+
- Hosting API key field name mismatch (console_api_key vs api_key)

## [2.0.0-beta.6] - 2026-03-11

### Added
- **@varity-labs/mcp** v1.3.2 — MCP Server for AI coding tools
  - 8 tools: search docs, calculate costs, create apps, create repos, deploy, check status, read logs, submit to store
  - Works with Cursor, Claude Code, VS Code (Copilot), Windsurf, and any MCP client
  - 15 searchable documentation entries with accurate API references
- **Account Abstraction** — gasless transactions enabled by default
  - Zero configuration required for developers
  - All transaction fees sponsored automatically

### Changed
- **varitykit** v1.1.13 — zero jargon in all CLI output
  - "platforms" instead of "chains"
  - `--target varity` or `--target avalanche`
  - No technical jargon in any user-facing text
- **create-varity-app** v2.0.0-beta.9 — production-ready SaaS template
  - Account abstraction included by default
  - Abstracted auth components
  - Standardized environment variables
- **@varity-labs/ui-kit** v2.0.0-beta.7 — account abstraction support added
- **@varity-labs/sdk** v2.0.0-beta.6 — platform configuration exported
- **@varity-labs/types** v2.0.0-beta.4 — core types updated

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
  - Auth provider (zero-config)
  - Login button, user profile
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
- Production services deployed
  - Gateway v1.5.0 live at https://varity.app
  - Credential Proxy v1.1.1 live
  - DB Proxy v1.0.2 live
- App Store submission flow (submit → approve → list)
- Revenue split: 90% developer, 10% platform

## License

MIT License - See [LICENSE](LICENSE) file for details.

---

[Website](https://www.varity.so) · [Documentation](https://docs.varity.so) · [GitHub](https://github.com/varity-labs) · [Discord](https://discord.gg/7vWsdwa2Bg) · [X/Twitter](https://x.com/VarityHQ)
