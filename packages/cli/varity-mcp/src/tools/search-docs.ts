import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { successResponse, errorResponse } from "../utils/responses.js";
import { INFRASTRUCTURE } from "../utils/config.js";

/**
 * Bundled documentation index for offline/fallback usage.
 * Covers the most common developer queries.
 */
const DOCS_INDEX: Array<{
  title: string;
  section: string;
  url: string;
  content: string;
  keywords: string[];
}> = [
  {
    title: "Quick Start",
    section: "Getting Started",
    url: `${INFRASTRUCTURE.DOCS}/quickstart`,
    content: `Get started with Varity in 3 commands:

1. Create a new app:
   npx create-varity-app my-app

2. Start development:
   cd my-app && npm run dev

3. Deploy to production:
   pip install varitykit
   varitykit app deploy

Your app is live with auth, database, and payments included.`,
    keywords: [
      "start",
      "begin",
      "install",
      "create",
      "new",
      "setup",
      "init",
      "first",
      "getting started",
    ],
  },
  {
    title: "Database Setup",
    section: "Build",
    url: `${INFRASTRUCTURE.DOCS}/build/databases/quickstart`,
    content: `Varity includes a production PostgreSQL database via the Varity SDK.

import { db } from '@varity-labs/sdk';

// Create a collection
const users = db.collection('users');

// Add data
await users.add({ name: 'Alice', email: 'alice@example.com' });

// Query data (returns all documents)
const result = await users.get();

// Update by document ID
await users.update('doc-id-here', { role: 'admin' });

// Delete by document ID
await users.delete('doc-id-here');

No configuration required — the database is provisioned automatically when you deploy.`,
    keywords: [
      "database",
      "db",
      "postgres",
      "sql",
      "collection",
      "add",
      "query",
      "get",
      "update",
      "delete",
      "data",
      "storage",
    ],
  },
  {
    title: "Authentication",
    section: "Build",
    url: `${INFRASTRUCTURE.DOCS}/build/authentication`,
    content: `Varity includes production authentication via Privy.

import { PrivyStack, usePrivy, useLogin, useLogout } from '@varity-labs/ui-kit';

// Wrap your app (auto-configures via Credential Proxy)
<PrivyStack>
  <App />
</PrivyStack>

// Use in components
const { user, authenticated } = usePrivy();
const { login } = useLogin();
const { logout } = useLogout();

Supports: Email, Google, GitHub, Apple, and wallet login.
Users never need crypto wallets — email login works out of the box.`,
    keywords: [
      "auth",
      "authentication",
      "login",
      "signup",
      "user",
      "privy",
      "email",
      "google",
      "social",
      "session",
    ],
  },
  {
    title: "Deployment",
    section: "Deploy",
    url: `${INFRASTRUCTURE.DOCS}/deploy`,
    content: `Deploy your app to production with one command:

varitykit app deploy

What happens:
1. Framework auto-detected (Next.js, React, Vue)
2. Production build created
3. App uploaded and hosted
4. Live URL returned

Options:
  --hosting static|dynamic  Choose hosting type (default: auto-detected)
  --submit-to-store         Also list on the Varity App Store (earn 90% revenue)
  --name [app-name]         Custom domain: varity.app/{app-name}
  --verbose                 Show detailed build output

Cost: ~70% less than AWS/Vercel. Static hosting starts at ~$0.01/GB/month.`,
    keywords: [
      "deploy",
      "deployment",
      "publish",
      "host",
      "hosting",
      "production",
      "live",
      "url",
      "launch",
    ],
  },
  {
    title: "Payments & Monetization",
    section: "Build",
    url: `${INFRASTRUCTURE.DOCS}/build/payments`,
    content: `Monetize your app through the Varity App Store.

Revenue split: 90% to developer, 10% to Varity.

To submit your deployed app:
  varitykit app deploy --submit-to-store

Or submit separately at: ${INFRASTRUCTURE.DEVELOPER_PORTAL}

Pricing is set by you — free apps are welcome too.
Users pay with credit card (no crypto required).`,
    keywords: [
      "payment",
      "monetize",
      "revenue",
      "earn",
      "money",
      "price",
      "billing",
      "store",
      "app store",
      "sell",
    ],
  },
  {
    title: "UI Components",
    section: "Build",
    url: `${INFRASTRUCTURE.DOCS}/build/ui-kit`,
    content: `Varity UI Kit provides 52+ production-ready React components.

import {
  Button, Input, Select, Dialog, DataTable,
  Toggle, Checkbox, RadioGroup, Avatar,
  ProgressBar, Skeleton, Breadcrumb, DropdownMenu,
  DashboardLayout, DashboardSidebar, CommandPalette,
  KPICard, Badge, ToastProvider, useToast
} from '@varity-labs/ui-kit';

Categories: Dashboard, Analytics, Form, Overlay, Feedback,
Display, Navigation, Branding, Auth, Payment, Providers.

All components are styled with Tailwind CSS and support dark mode.
The SaaS starter template uses these components throughout.

Install: npm install @varity-labs/ui-kit`,
    keywords: [
      "ui",
      "component",
      "button",
      "modal",
      "table",
      "layout",
      "dashboard",
      "sidebar",
      "design",
      "react",
      "ui-kit",
    ],
  },
  {
    title: "Templates",
    section: "Getting Started",
    url: `${INFRASTRUCTURE.DOCS}/templates`,
    content: `Varity provides production-ready templates:

SaaS Starter (default):
  - Next.js 14 with App Router
  - Authentication (email, Google, GitHub)
  - Dashboard with sidebar navigation
  - Settings page (profile, preferences, security, billing)
  - Landing page with animations
  - Command palette (Cmd+K)
  - 20+ UI components from @varity-labs/ui-kit
  - Database integration via @varity-labs/sdk

Create from template:
  npx create-varity-app my-app
  # or
  varitykit init my-app`,
    keywords: [
      "template",
      "starter",
      "saas",
      "boilerplate",
      "scaffold",
      "next.js",
      "react",
      "dashboard",
    ],
  },
  {
    title: "SDK Reference",
    section: "Reference",
    url: `${INFRASTRUCTURE.DOCS}/reference/sdk`,
    content: `The Varity SDK (@varity-labs/sdk) provides:

Core exports:
  - db: Database client (PostgreSQL via DB Proxy)
  - getCredentials, resolveCredentials: Credential management
  - logCredentialUsage: Credential tracking
  - SDK_VERSION, CHAIN_ID: Version and chain info

Subpath exports (advanced):
  - @varity-labs/sdk/chains: Chain configurations
  - @varity-labs/sdk/blockchain: Blockchain utilities
  - @varity-labs/sdk/tracking: Usage tracking

Install: npm install @varity-labs/sdk

The SDK abstracts all infrastructure complexity.
Your app gets a production database, credential management,
and deployment configuration with zero setup.`,
    keywords: [
      "sdk",
      "api",
      "reference",
      "package",
      "import",
      "module",
      "library",
    ],
  },
  {
    title: "CLI Reference",
    section: "Reference",
    url: `${INFRASTRUCTURE.DOCS}/reference/cli`,
    content: `varitykit CLI commands:

  varitykit doctor         Check environment and dependencies
  varitykit init [name]    Create a new app from template
  varitykit login          Authenticate with deploy key
  varitykit app deploy     Deploy to production
  varitykit app list       List your deployments
  varitykit domains        Manage custom domains
  varitykit dev            Start local development server
  varitykit template       Browse and manage templates
  varitykit marketplace    Browse the template marketplace
  varitykit completions    Set up shell tab completion

Deploy options: --hosting static|dynamic, --submit-to-store, --name

Install: pip install varitykit

Global options: --verbose, --debug, --json, --version, --help`,
    keywords: [
      "cli",
      "command",
      "terminal",
      "varitykit",
      "pip",
      "python",
    ],
  },
  {
    title: "MCP Server Setup",
    section: "AI Tools",
    url: `${INFRASTRUCTURE.DOCS}/ai-tools/mcp-server-spec`,
    content: `The Varity MCP server (@varity-labs/mcp) gives AI editors 7 tools for the full build → deploy → monetize workflow.

Setup for Cursor — add to .cursor/mcp.json:
{
  "mcpServers": {
    "varity": {
      "command": "npx",
      "args": ["-y", "@varity-labs/mcp"]
    }
  }
}

Setup for Claude Code:
  claude mcp add varity -- npx -y @varity-labs/mcp

Prerequisites: Node.js 18+, Python 3.10+, pip install varitykit

Tools: varity_search_docs, varity_cost_calculator, varity_init, varity_deploy, varity_deploy_status, varity_deploy_logs, varity_submit_to_store`,
    keywords: [
      "mcp",
      "cursor",
      "claude",
      "ai",
      "editor",
      "vscode",
      "windsurf",
      "model context protocol",
      "setup",
      "configure",
    ],
  },
  {
    title: "Troubleshooting",
    section: "Resources",
    url: `${INFRASTRUCTURE.DOCS}/resources/troubleshooting`,
    content: `Common issues and fixes:

MCP: "Cannot find module @varity-labs/mcp"
  → Make sure Node.js 18+ is installed. Run: node --version

MCP: Deploy tools fail with "varitykit not found"
  → Install the CLI: pip install varitykit. Run: varitykit doctor

MCP: Server not showing in Cursor
  → Restart Cursor after adding .cursor/mcp.json. Validate JSON syntax.

MCP: Server not showing in Claude Code
  → Run: claude mcp list. Re-add: claude mcp add varity -- npx -y @varity-labs/mcp

CLI: "varitykit: command not found"
  → Reinstall: pip install varitykit. Check PATH includes Python scripts dir.

Build: TypeScript errors with @varity packages
  → Rebuild packages: cd varity-sdk && pnpm build

Deploy: Build fails silently
  → Add --verbose flag: varitykit app deploy --verbose

For more help: https://discord.gg/Uhjx6yhJ`,
    keywords: [
      "error",
      "fix",
      "debug",
      "not working",
      "failed",
      "permission",
      "troubleshoot",
      "help",
      "issue",
      "problem",
      "broken",
    ],
  },
  {
    title: "Cost Savings",
    section: "Overview",
    url: `${INFRASTRUCTURE.DOCS}/pricing`,
    content: `Varity is ~70% cheaper than AWS/Vercel.

Example (SaaS app, 1,000 users):
  AWS:     ~$225/month (hosting + DB + auth)
  Vercel:  ~$120/month (hosting + DB + auth)
  Varity:  ~$23/month (all included)

Use the varity_cost_calculator tool for exact estimates at your scale.

Includes at no extra cost:
  - Hosting (static or dynamic)
  - PostgreSQL database (via DB Proxy)
  - Authentication (via Privy)
  - Payment processing (90/10 revenue split)

No hidden fees. No surprise bills. Pay for what you use.`,
    keywords: [
      "cost",
      "price",
      "pricing",
      "cheap",
      "save",
      "money",
      "aws",
      "vercel",
      "compare",
      "savings",
    ],
  },
];

/**
 * Simple relevance scoring based on keyword matching.
 */
function scoreResult(
  entry: (typeof DOCS_INDEX)[0],
  query: string
): number {
  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/\s+/);
  let score = 0;

  // Keyword matches (highest weight)
  for (const keyword of entry.keywords) {
    if (queryLower.includes(keyword)) score += 10;
    for (const word of queryWords) {
      if (keyword.includes(word)) score += 5;
    }
  }

  // Title match
  if (entry.title.toLowerCase().includes(queryLower)) score += 15;

  // Content match
  const contentLower = entry.content.toLowerCase();
  for (const word of queryWords) {
    if (word.length > 2 && contentLower.includes(word)) score += 2;
  }

  return score;
}

export function registerSearchDocsTool(server: McpServer): void {
  server.registerTool(
    "varity_search_docs",
    {
      title: "Search Varity Docs",
      description:
        "Search Varity documentation for guides, API references, and tutorials. " +
        "Use this to help developers understand how to use Varity SDK, UI Kit, CLI, " +
        "database, authentication, deployment, and monetization. " +
        "Example queries: 'database setup', 'how to deploy', 'authentication', 'pricing'.",
      inputSchema: {
        query: z
          .string()
          .describe(
            "Search query (e.g., 'database collections', 'authentication setup', 'deploy to production')"
          ),
        maxResults: z
          .number()
          .optional()
          .default(3)
          .describe("Maximum number of results to return (default: 3)"),
      },
      annotations: {
        readOnlyHint: true,
      },
    },
    async ({ query, maxResults }) => {
      try {
        // Score all docs against the query
        const scored = DOCS_INDEX.map((entry) => ({
          ...entry,
          score: scoreResult(entry, query),
        }))
          .filter((entry) => entry.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, maxResults);

        if (scored.length === 0) {
          return successResponse(
            {
              results: [],
              docsUrl: INFRASTRUCTURE.DOCS,
            },
            `No results found for "${query}". Try browsing the full documentation at ${INFRASTRUCTURE.DOCS}`
          );
        }

        const results = scored.map((entry) => ({
          title: entry.title,
          section: entry.section,
          url: entry.url,
          content: entry.content,
        }));

        return successResponse(
          {
            results,
            query,
            totalResults: results.length,
            docsUrl: INFRASTRUCTURE.DOCS,
          },
          `Found ${results.length} result(s) for "${query}"`
        );
      } catch (error) {
        return errorResponse(
          "SEARCH_FAILED",
          `Failed to search documentation: ${error}`,
          `Try browsing the docs directly at ${INFRASTRUCTURE.DOCS}`
        );
      }
    }
  );
}
