# varitykit

> Deploy any app from your terminal in 60 seconds. 60-80% cheaper than AWS.

[![PyPI version](https://img.shields.io/pypi/v/varitykit)](https://pypi.org/project/varitykit/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/varity-labs/varity-sdk/blob/main/LICENSE)
[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)

## Install

```bash
pipx install varitykit
```

Or with pip:

```bash
pip install varitykit
```

## Quick Start

```bash
# 1. Check your environment
varitykit doctor

# 2. Create a new app
varitykit init my-app
cd my-app
npm install

# 3. Start developing
npm run dev

# 4. Deploy to production (one command)
varitykit app deploy
# => Live at https://my-app.varity.app
```

**4 commands from zero to production.** No Docker, no config files, no infrastructure setup.

## Commands

### `varitykit doctor`

Check that your environment is ready to build and deploy.

```bash
varitykit doctor
```

Validates: Node.js 20+, Python 3.11+, Git, npm, disk space, memory, network connectivity.

### `varitykit init [name]`

Create a new app from a production-ready template.

```bash
# Interactive mode
varitykit init

# With a name
varitykit init my-app

# With a specific template
varitykit init my-app --template saas-starter
```

### `varitykit app deploy`

Deploy your app to production with one command.

```bash
# Deploy current directory
varitykit app deploy

# Deploy and list on the Varity App Store
varitykit app deploy --submit-to-store

# Deploy a specific directory
varitykit app deploy --path ./my-app
```

Automatically detects your framework, builds the project, and deploys it. Supports both dynamic (server-side) and static apps.

### `varitykit migrate`

Migrate an existing app from Vercel to Varity.

```bash
# Migrate from a GitHub URL (clone + analyze + apply + deploy)
varitykit migrate --url https://github.com/me/my-app

# Migrate a local directory
varitykit migrate --path ./my-app

# Preview changes without applying
varitykit migrate analyze ./my-app

# Apply transforms without deploying
varitykit migrate apply ./my-app
```

Removes Vercel-specific config, patches `next.config.js`, and renames environment variables automatically.

### `varitykit app list`

List all your deployments.

```bash
varitykit app list
```

### `varitykit dev`

Start the local development server.

```bash
varitykit dev
```

### `varitykit completions`

Set up shell tab completion for bash, zsh, and fish.

```bash
# Auto-detect and show instructions
varitykit completions

# Auto-install to shell config
varitykit completions --install
```

## Global Options

| Option | Description |
|--------|-------------|
| `--verbose, -v` | Enable verbose output |
| `--debug` | Enable debug output |
| `--json` | Output in JSON format |
| `--version` | Show version |
| `--help` | Show help |

## Templates

### SaaS Starter

A production-ready SaaS application with:

- Landing page with animations and social proof
- Authentication (email, Google, GitHub)
- Dashboard with sidebar navigation
- Settings page with 6 configuration sections
- Data tables with CSV export
- Toast notifications and command palette (Cmd+K)
- Mobile-responsive layout
- 4 color theme presets

Built with Next.js 15, Tailwind CSS, and TypeScript.

```bash
varitykit init my-saas --template saas-starter
```

## Deploy and Earn (Coming Soon)

Every app deployed through Varity can be listed on the [Varity App Store](https://store.varity.so) -- a marketplace where users discover and pay for apps.

**Revenue split: 90% to you, 10% to Varity.**

```bash
# Deploy and submit in one command
varitykit app deploy --submit-to-store
```

Payments and monetization are coming soon.

## Supported Frameworks

| Framework | Status |
|-----------|--------|
| Next.js 13+ | Supported |
| React (Vite) 18+ | Supported |
| Vue 3+ | Supported |
| Express / Fastify / Nest / Koa / Hono | Supported |
| FastAPI | Supported |
| Django | Supported |
| Flask | Supported |

Go, Rust, Ruby, Elixir, Java, PHP, and .NET are on the roadmap.

## Use Varity from Your AI Editor

Prefer talking to your AI instead of typing commands? The **Varity MCP Server** lets you deploy from Cursor, Claude Code, VS Code, and 10+ AI tools.

```bash
# Claude Code
claude mcp add varity -- npx @varity-labs/mcp

# Then just say: "deploy this to Varity"
```

See [@varity-labs/mcp](https://github.com/varity-labs/varity-sdk/tree/main/packages/cli/varity-mcp) for all AI clients.

## Part of the Varity SDK

varitykit is part of the [Varity SDK](https://github.com/varity-labs/varity-sdk). Everything you need to build and deploy any app, AI agent, or LLM.

| Package | Description |
|---------|-------------|
| [@varity-labs/sdk](https://www.npmjs.com/package/@varity-labs/sdk) | Core SDK -- database, credentials, zero-config development |
| [@varity-labs/ui-kit](https://www.npmjs.com/package/@varity-labs/ui-kit) | 52+ React components -- auth, dashboards, payments (coming soon) |
| [@varity-labs/types](https://www.npmjs.com/package/@varity-labs/types) | TypeScript type definitions |
| [create-varity-app](https://www.npmjs.com/package/create-varity-app) | Scaffold a new app in one command |
| [@varity-labs/mcp](https://www.npmjs.com/package/@varity-labs/mcp) | MCP Server -- use Varity from Cursor, Claude Code, and 10+ AI tools |

## Support

- **Documentation**: [docs.varity.so](https://docs.varity.so)
- **GitHub Issues**: [varity-labs/varity-sdk/issues](https://github.com/varity-labs/varity-sdk/issues)
- **Discord**: [discord.gg/7vWsdwa2Bg](https://discord.gg/7vWsdwa2Bg)

## License

MIT -- see [LICENSE](../LICENSE) for details.
