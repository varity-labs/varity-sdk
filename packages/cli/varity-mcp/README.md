# @varity-labs/mcp

[![npm](https://img.shields.io/npm/v/@varity-labs/mcp)](https://www.npmjs.com/package/@varity-labs/mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/varity-labs/varity-sdk/blob/main/LICENSE)
[![Status: Beta](https://img.shields.io/badge/Status-Beta-yellow.svg)](https://github.com/varity-labs/varity-mcp)

> Deploy production apps from any AI coding tool. Cursor, Claude Code, VS Code, ChatGPT, Windsurf, and more.

The Varity MCP Server gives your AI editor the power to scaffold, deploy, and manage full-stack apps with auth, database, and payments included. One server, every AI client, zero commands.

**Browser Usage:** See the [browser usage guide](https://docs.varity.so/ai-tools/browser-usage) for using in Claude.ai or ChatGPT browser
**Quick Start:** Choose your editor below and run one command

## Install

### Cursor

Add to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "varity": {
      "command": "npx",
      "args": ["-y", "@varity-labs/mcp"]
    }
  }
}
```

### Claude Code

```bash
claude mcp add varity -- npx -y @varity-labs/mcp
```

### VS Code with Copilot

1. Command Palette -> **MCP: Add Server**
2. Select **Command (stdio)**
3. Command: `npx -y @varity-labs/mcp`
4. Name: `Varity`

### Windsurf

Add to `mcp_config.json`:

```json
{
  "mcpServers": {
    "varity": {
      "command": "npx",
      "args": ["-y", "@varity-labs/mcp"]
    }
  }
}
```

### Claude.ai / ChatGPT (HTTP)

Use the hosted MCP server URL:

```
https://mcp.varity.so
```

### Any MCP-compatible client (stdio)

```json
{
  "mcpServers": {
    "varity": {
      "command": "npx",
      "args": ["-y", "@varity-labs/mcp"]
    }
  }
}
```

## Tools

| Tool | Description | Auth |
|------|-------------|------|
| `varity_search_docs` | Search Varity documentation | No |
| `varity_cost_calculator` | Compare costs vs AWS/Vercel | No |
| `varity_doctor` | Check that your environment is ready to deploy | No |
| `varity_login` | Authenticate with your deploy key or browser | No |
| `varity_init` | Create a new production app from a template | Yes |
| `varity_install_deps` | Install project dependencies | Yes |
| `varity_build` | Build the project | Yes |
| `varity_add_collection` | Add a typed database collection with codegen | Yes |
| `varity_open_browser` | Open a URL in the local browser (stdio only) | No |
| `varity_dev_server` | Start the local development server (stdio only) | Yes |
| `varity_create_repo` | Create a GitHub repo and push the project | Yes |
| `varity_deploy` | Deploy to production | Yes |
| `varity_deploy_status` | Check deployment status | Yes |
| `varity_deploy_logs` | Read build and deployment logs | Yes |
| `varity_submit_to_store` | Submit to the Varity App Store | Yes |
| `varity_migrate` | Migrate an existing app from Vercel to Varity | Yes |
| `world_model_deploy_patterns` | Query deployment telemetry patterns | No |

## Example Prompts

Try these in Cursor Agent mode, Claude Code, or any MCP-enabled AI editor:

**Create & Deploy:**
- "Create a new SaaS app called my-dashboard"
- "Deploy this project to production"
- "Deploy and submit to the Varity App Store for $19/month"

**Manage & Debug:**
- "Show my deployments"
- "Get the build logs for my last deployment"
- "Why did my deployment fail?"

**Migrate from Vercel:**
- "Migrate my Vercel app at github.com/me/my-app to Varity"
- "Preview what changes the migration will make"

**Docs & Pricing:**
- "Search Varity docs for database setup"
- "How much would it cost to host a SaaS app with 5,000 users on Varity?"
- "Compare Varity vs AWS costs for my app"

## End-to-End Workflow

From empty folder to deployed app, all from natural language:

```
You: "Create a new SaaS app called analytics-pro"
AI:  Created analytics-pro with auth, database, dashboard, landing page

You: "Deploy it to production"
AI:  Deployed! Live at https://analytics-pro.varity.app

You: "Submit to the App Store for $29/month"
AI:  Submitted. You earn $26.10/month per user (90% revenue split)
```

## What Makes This Different

| Feature | Vercel MCP | Varity MCP |
|---------|-----------|------------|
| Create new apps | No | Yes |
| Auth included | No | Yes |
| Database included | No | Yes (Document Database) |
| Payments included | No | Coming soon (90/10 split) |
| Cost | $20+/mo | 60-80% less |
| Open source | No | Yes (MIT) |

## Transports

### stdio (default)

For desktop AI editors. Cursor, Claude Code, VS Code, Windsurf.

```bash
npx -y @varity-labs/mcp
```

### HTTP

For browser-based AI tools. Claude.ai, ChatGPT.

```bash
npx -y @varity-labs/mcp --transport http --port 3100
```

Hosted at `https://mcp.varity.so`. Connect directly from any MCP client that supports HTTP.

## Prerequisites

- **Node.js** >= 20
- **For deployment**: `pip install varitykit`

## Cost

Varity is 60-80% cheaper than AWS. Auth and database are included at no extra cost. Use the `varity_cost_calculator` tool for detailed estimates.

---

**Part of the [Varity SDK](https://github.com/varity-labs/varity-sdk).** Deploy any app, 60-80% cheaper than AWS.

[Documentation](https://docs.varity.so/ai-tools/mcp-server-spec) · [GitHub](https://github.com/varity-labs/varity-sdk) · [Discord](https://discord.gg/7vWsdwa2Bg)
