# create-varity-app

[![npm](https://img.shields.io/npm/v/create-varity-app)](https://www.npmjs.com/package/create-varity-app)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/varity-labs/varity-sdk/blob/main/LICENSE)

Create production-ready apps with auth, database, and payments built in.

## Quick Start

```bash
npx create-varity-app my-app
cd my-app
npm run dev
```

Or with other package managers:

```bash
pnpm create varity-app my-app
yarn create varity-app my-app
```

## What You Get

- **Next.js 15** app with TypeScript and Tailwind CSS
- **Authentication** — email, social login, and more (zero config)
- **Database** — ready-to-use collections with typed queries
- **Dashboard** — professional layout with sidebar navigation
- **Landing page** — hero, features, pricing, testimonials
- **Settings** — profile, preferences, security, billing sections
- **6 pages** — dashboard, projects, tasks, team, settings, login

## Project Structure

```
my-app/
├── src/
│   └── app/
│       ├── (auth)/login/     # Login page
│       ├── (dashboard)/      # Protected dashboard pages
│       │   ├── dashboard/    # Overview with KPIs
│       │   ├── projects/     # Project management
│       │   ├── tasks/        # Task tracking
│       │   ├── team/         # Team members
│       │   └── settings/     # App settings (6 sections)
│       └── page.tsx          # Landing page
├── tailwind.config.ts
├── next.config.js
└── package.json
```

## Deploy

When you're ready to go live:

```bash
pip install varitykit
varitykit app deploy
```

Your app will be live in under 60 seconds.

Or deploy from your AI editor with the [Varity MCP server](../../cli/varity-mcp/) (`@varity-labs/mcp`) — just ask "deploy this project".

## Related Packages

- **[@varity-labs/sdk](../../core/varity-sdk/)** — Core SDK (database, credentials)
- **[@varity-labs/ui-kit](../../ui/varity-ui-kit/)** — React UI components
- **[@varity-labs/mcp](../../cli/varity-mcp/)** — MCP server for AI editors (Cursor, Claude Code, VS Code)

## Learn More

- [Documentation](https://docs.varity.so)
- [GitHub](https://github.com/varity-labs/varity-sdk)
- [Discord](https://discord.gg/varity)

---

**Part of the [Varity SDK](https://github.com/varity-labs/varity-sdk)** — Build, deploy, and monetize apps 70% cheaper than AWS.

[Documentation](https://docs.varity.so) · [GitHub](https://github.com/varity-labs/varity-sdk) · [Discord](https://discord.gg/varity)

## License

MIT — [Varity Labs](https://varity.so)
