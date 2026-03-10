<p align="center">
  <img src="https://raw.githubusercontent.com/varity-labs/varity-sdk/main/.github/logo.svg" alt="Varity" width="120" />
</p>

<h1 align="center">Varity SDK</h1>

<p align="center">
  <strong>Build, deploy, and monetize production apps — 70% cheaper than AWS</strong>
</p>

<p align="center">
  Auth, database, and storage included. One command to deploy. Zero configuration.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@varity-labs/sdk"><img src="https://img.shields.io/npm/v/@varity-labs/sdk" alt="npm" /></a>
  <a href="https://pypi.org/project/varitykit/"><img src="https://img.shields.io/pypi/v/varitykit" alt="PyPI" /></a>
  <a href="https://github.com/varity-labs/varity-sdk/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="License" /></a>
  <a href="https://discord.gg/7vWsdwa2Bg"><img src="https://img.shields.io/badge/discord-join-7289DA" alt="Discord" /></a>
  <a href="https://github.com/varity-labs/varity-sdk/stargazers"><img src="https://img.shields.io/github/stars/varity-labs/varity-sdk?style=flat" alt="Stars" /></a>
</p>

<p align="center">
  <a href="https://docs.varity.so">Documentation</a> ·
  <a href="https://docs.varity.so/getting-started/quickstart">Quick Start</a> ·
  <a href="https://store.varity.so">App Store</a> ·
  <a href="https://developer.store.varity.so">Developer Portal</a> ·
  <a href="https://discord.gg/7vWsdwa2Bg">Discord</a>
</p>

<p align="center">
  <code>npx create-varity-app my-app</code>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/varity-labs/varity-sdk/main/.github/terminal-demo.svg" alt="Deploy an app with Varity in 60 seconds" width="700" />
</p>

---

## Why Varity?

Most platforms make you stitch together auth, database, storage, payments, and hosting yourself. Varity includes everything in the box.

| | Traditional Setup | **Varity** |
|---|---|---|
| **Time to deploy** | Hours (config, CI/CD, DNS, SSL) | **60 seconds** |
| **Auth** | Set up Cognito/Auth0 + write auth logic | **Included — zero config** |
| **Database** | Provision RDS/Supabase + manage schema | **Included — zero config** |
| **Storage** | Configure S3/GCS + write upload logic | **Included — zero config** |
| **Payments** | Stripe integration + webhook handlers | **Coming soon** |
| **App Store listing** | Build your own distribution | **One command** |
| **Infrastructure cost** | $500–2,800+/mo (AWS) | **~70% less** |

You build. You deploy. Users find your app. You get paid. That's it.

## Quick Start

### Option 1: npx (recommended)

```bash
npx create-varity-app my-app
cd my-app
npm run dev
```

### Option 2: CLI

```bash
pip install varitykit
varitykit init my-app
cd my-app
npm install
npm run dev
```

### Deploy

```bash
pip install varitykit   # if not already installed
varitykit app deploy
# => Live at https://my-app.varity.app
```

**3 commands from zero to production.**

## What You Get Out of the Box

### Authentication (email, Google, GitHub — zero setup)

```tsx
import { PrivyStack, PrivyLoginButton, usePrivy } from '@varity-labs/ui-kit';

function App() {
  return (
    <PrivyStack>
      <PrivyLoginButton />
    </PrivyStack>
  );
}
```

Users can sign in with email (magic link), Google, GitHub, Discord, and more. No auth logic to write. No password hashing. No session management.

### Database (zero-config, instant)

```typescript
import { db } from '@varity-labs/sdk';

// Create a collection
const posts = db.collection('posts');

// Add a document (returns the document with id and timestamps)
const post = await posts.add({ title: 'Hello World', author: userId });

// Get all documents (with optional pagination and ordering)
const allPosts = await posts.get();
const recent = await posts.get({ limit: 10, orderBy: '-created_at' });

// Update by ID
await posts.update(post.id, { title: 'Updated Title' });

// Delete by ID
await posts.delete(post.id);
```

Works out of the box. No database setup, no API keys, no configuration.

### Payments (coming soon)

> Set your price, users pay with credit card, you receive 90% revenue automatically.

```bash
# Deploy and list on the Varity App Store
varitykit app deploy --submit-to-store
```

Set your price. Users pay with credit card or Apple Pay. Varity handles all payment processing. **90% revenue to you, 10% to Varity.**

### 19 Production-Ready UI Components

```tsx
import {
  DashboardLayout,
  DataTable,
  KPICard,
  ConfirmDialog,
  CommandPalette,
  ToastProvider,
  useToast,
  Button,
  Toggle,
  Avatar,
} from '@varity-labs/ui-kit';
```

Dashboard layouts, data tables, analytics cards, modals, form components, and more. All accessible (WCAG 2.1) and compatible with Next.js static export.

## Packages

| Package | Description | Install |
|---------|-------------|---------|
| **[@varity-labs/sdk](packages/core/varity-sdk/)** | Core SDK — database, credentials, zero-config development | `npm i @varity-labs/sdk` |
| **[@varity-labs/ui-kit](packages/ui/varity-ui-kit/)** | 19 React components — auth, dashboards, payments, data tables | `npm i @varity-labs/ui-kit` |
| **[@varity-labs/types](packages/core/varity-types/)** | TypeScript type definitions for all Varity interfaces | `npm i @varity-labs/types` |
| **[create-varity-app](packages/cli/create-varity-app/)** | Scaffold a new app in one command | `npx create-varity-app` |
| **[varitykit](cli/)** | CLI — init, deploy, manage apps | `pip install varitykit` |
| **[@varity-labs/mcp](packages/cli/varity-mcp/)** | MCP Server — use Varity from Cursor, Claude Code, and 10+ AI tools | `npx @varity-labs/mcp` |

## Works with Your AI Tools

Varity works inside **Cursor**, **Claude Code**, **VS Code Copilot**, **ChatGPT**, **Windsurf**, and 8+ AI coding tools via the [Model Context Protocol](https://modelcontextprotocol.io).

Say **"deploy this to Varity"** in your AI editor and your app is live. Zero commands.

<details>
<summary><strong>Cursor</strong> — add to <code>.cursor/mcp.json</code></summary>

```json
{
  "mcpServers": {
    "varity": {
      "command": "npx",
      "args": ["@varity-labs/mcp"]
    }
  }
}
```

</details>

<details>
<summary><strong>Claude Code</strong></summary>

```bash
claude mcp add varity -- npx @varity-labs/mcp
```

</details>

<details>
<summary><strong>VS Code with Copilot</strong></summary>

Command Palette → **MCP: Add Server** → Command (stdio) → `npx @varity-labs/mcp`

</details>

<details>
<summary><strong>Any MCP-compatible client</strong></summary>

```json
{
  "mcpServers": {
    "varity": {
      "command": "npx",
      "args": ["@varity-labs/mcp"]
    }
  }
}
```

</details>

**7 AI-powered tools:** search docs, calculate costs, create apps, deploy, check status, read logs, submit to App Store — all from natural language.

## Templates

### SaaS Starter (Production-Ready)

```bash
varitykit init my-saas --template saas-starter
```

Includes:
- Landing page with animations and social proof
- Authentication (login, signup, protected routes)
- Dashboard with sidebar navigation
- Settings page with theme customization
- Data tables with CSV export
- Toast notifications
- Command palette (Cmd+K)
- Mobile-responsive layout
- 4 color theme presets

Built with Next.js 15, Tailwind CSS, and TypeScript.

## CLI Reference

```bash
varitykit doctor              # Check your environment
varitykit init <name>         # Create a new app
varitykit app deploy          # Deploy your app
varitykit app deploy --submit-to-store   # Deploy and list on the Varity App Store
```

[Full CLI documentation →](https://docs.varity.so/cli/overview)

## Deploy and Earn

Every app deployed through Varity can be listed on the **[Varity App Store](https://store.varity.so)** — a marketplace where users discover and pay for apps.

**Revenue split: 90% to you, 10% to Varity.**

```bash
# Deploy and submit to the App Store in one command
varitykit app deploy --submit-to-store
```

Set your price. Users pay with credit card. You get paid monthly. No Stripe setup, no payment pages, no invoicing. *(Payments coming soon.)*

## Cost Savings

Varity runs on distributed infrastructure providers that compete on price — no cloud premiums.

| What you save on | How |
|------------------|-----|
| **Compute** | Decentralized providers compete on price — **~70% less** than AWS/GCP |
| **Database** | Included with every app — no separate provisioning |
| **Auth** | Included — no Cognito/Auth0 subscription needed |
| **Storage** | Distributed storage at a fraction of centralized pricing |

Auth, database, storage, and hosting are all included. Most teams save **60–80%** compared to AWS.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  Your App (Next.js, React, any framework)           │
├─────────────────────────────────────────────────────┤
│  @varity-labs/ui-kit    │  @varity-labs/sdk         │
│  - Auth components      │  - Database               │
│  - Payment widgets *    │  - Credentials            │
│  - Dashboard layouts    │  - Payments *             │
│  - 19 components        │  - Zero-config dev        │
├─────────────────────────────────────────────────────┤
│  varitykit CLI                                      │
│  - Init / Deploy / Manage / Submit to Store         │
├─────────────────────────────────────────────────────┤
│  Infrastructure (fully managed — you never touch)   │
│  - Hosting    - Auth     - Database    - Storage    │
└─────────────────────────────────────────────────────┘
```

*\* Payments coming soon.*

## Documentation

| Resource | Link |
|----------|------|
| Full Documentation | [docs.varity.so](https://docs.varity.so) |
| Quick Start (5 min) | [Getting Started](https://docs.varity.so/getting-started/quickstart) |
| Next.js Guide | [Next.js Quick Start](https://docs.varity.so/getting-started/quickstart-nextjs) |
| Auth Guide | [Authentication](https://docs.varity.so/build/auth/quickstart) |
| Database Guide | [Database Quick Start](https://docs.varity.so/build/databases/quickstart) |
| Storage Guide | [Storage Quick Start](https://docs.varity.so/build/storage/quickstart) |
| Payments Guide | [Payments Quick Start](https://docs.varity.so/build/payments/quickstart) |
| CLI Reference | [CLI Overview](https://docs.varity.so/cli/overview) |

## Community

- **GitHub** — [varity-labs](https://github.com/varity-labs) — source code, issues, contributions
- **X/Twitter** — [@VarityHQ](https://x.com/VarityHQ) — updates and announcements
- **Discord** — [Join our server](https://discord.gg/7vWsdwa2Bg) — ask questions, share what you're building
- **LinkedIn** — [Varity Labs](https://www.linkedin.com/company/varity-labs)
- **Reddit** — [r/varityHQ](https://www.reddit.com/r/varityHQ)
- **YouTube** — [@VarityHQ](https://www.youtube.com/@VarityHQ) — tutorials and demos
- **Email** — [hello@varity.so](mailto:hello@varity.so) — partnerships, feedback

## Contributing

We welcome contributions from everyone. Whether it's a bug fix, a new component, improved docs, or a feature request — we appreciate it.

```bash
# Clone the repo
git clone https://github.com/varity-labs/varity-sdk.git
cd varity-sdk

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## Built with Varity

Add a badge to your project's README:

**Built with Varity** (for apps using the SDK):

```markdown
[![Built with Varity](https://raw.githubusercontent.com/varity-labs/varity-sdk/main/.github/badges/built-with-varity.svg)](https://www.varity.so)
```

[![Built with Varity](https://raw.githubusercontent.com/varity-labs/varity-sdk/main/.github/badges/built-with-varity.svg)](https://www.varity.so)

**Deployed on Varity** (for apps hosted on Varity):

```markdown
[![Deployed on Varity](https://raw.githubusercontent.com/varity-labs/varity-sdk/main/.github/badges/deployed-on-varity.svg)](https://www.varity.so)
```

[![Deployed on Varity](https://raw.githubusercontent.com/varity-labs/varity-sdk/main/.github/badges/deployed-on-varity.svg)](https://www.varity.so)

**Shields.io fallback** (works without hosting the repo):

```markdown
[![Built with Varity](https://img.shields.io/badge/built%20with-Varity-7C3AED)](https://www.varity.so)
```

## License

MIT — see [LICENSE](LICENSE) for details.

---

<p align="center">
  <strong>Build faster. Deploy cheaper. Get paid.</strong>
</p>

<p align="center">
  <a href="https://docs.varity.so/getting-started/quickstart">Get started in 5 minutes →</a>
</p>

<p align="center">
  If Varity helps you build, consider giving us a star — it helps others find the project.
</p>
