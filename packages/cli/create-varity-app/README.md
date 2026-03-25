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
- **Authentication** -- email, social login, and more (zero config)
- **Database** -- ready-to-use collections with typed queries
- **Dashboard** -- professional layout with sidebar navigation
- **Landing page** -- hero, features, pricing, how it works, testimonials, CTA
- **Settings** -- General, Security, Billing, and Account tabs
- **8 pages** -- landing, login, dashboard, projects, tasks, team, settings, 404

## Project Structure

```
my-app/
├── src/
│   └── app/
│       ├── login/            # Login page
│       ├── dashboard/        # Protected dashboard pages
│       │   ├── page.tsx      # Overview with KPIs
│       │   ├── projects/     # Project management
│       │   ├── tasks/        # Task tracking
│       │   ├── team/         # Team members
│       │   └── settings/     # App settings (4 tabs)
│       ├── not-found.tsx     # 404 page
│       └── page.tsx          # Landing page
├── tailwind.config.js
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

Or deploy from your AI editor with the [Varity MCP server](https://www.npmjs.com/package/@varity-labs/mcp) -- just ask "deploy this project".

## Related Packages

- **[@varity-labs/sdk](https://www.npmjs.com/package/@varity-labs/sdk)** -- Core SDK (database, credentials)
- **[@varity-labs/ui-kit](https://www.npmjs.com/package/@varity-labs/ui-kit)** -- React UI components
- **[@varity-labs/mcp](https://www.npmjs.com/package/@varity-labs/mcp)** -- MCP server for AI editors (Cursor, Claude Code, VS Code)

## Learn More

- [Documentation](https://docs.varity.so)
- [GitHub](https://github.com/varity-labs/varity-sdk)
- [Discord](https://discord.gg/7vWsdwa2Bg)

---

**Part of the [Varity SDK](https://github.com/varity-labs/varity-sdk)** -- Build, deploy, and monetize apps 70% cheaper than AWS.

[Documentation](https://docs.varity.so) | [GitHub](https://github.com/varity-labs/varity-sdk) | [Discord](https://discord.gg/7vWsdwa2Bg)

## License

MIT -- [Varity Labs](https://www.varity.so)
