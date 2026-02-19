# @varity-labs/mcp

[![npm](https://img.shields.io/npm/v/@varity-labs/mcp)](https://www.npmjs.com/package/@varity-labs/mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/varity-labs/varity-sdk/blob/main/LICENSE)

> Deploy production apps from any AI coding tool — Cursor, Claude Code, VS Code, ChatGPT, Windsurf, and more.

The Varity MCP Server gives your AI editor the power to scaffold, deploy, and manage full-stack apps with auth, database, and payments included. One server, every AI client, zero commands.

## Install

### Cursor

Add to `.cursor/mcp.json`:

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

### Claude Code

```bash
claude mcp add varity -- npx @varity-labs/mcp
```

### VS Code with Copilot

1. Command Palette → **MCP: Add Server**
2. Select **Command (stdio)**
3. Command: `npx @varity-labs/mcp`
4. Name: `Varity`

### Windsurf

Add to `mcp_config.json`:

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

### Any MCP-compatible client

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

## Tools

| Tool | Description | Auth |
|------|-------------|------|
| `varity_search_docs` | Search Varity documentation | No |
| `varity_cost_calculator` | Compare costs vs AWS/Vercel | No |
| `varity_init` | Create a new production app | Yes |
| `varity_deploy` | Deploy to production | Yes |
| `varity_deploy_status` | Check deployment status | Yes |
| `varity_deploy_logs` | Read build/deployment logs | Yes |
| `varity_submit_to_store` | Submit to Varity App Store | Yes |

## Example Prompts

Try these in Cursor Agent mode or Claude Code:

- "Create a new SaaS app called my-dashboard"
- "Deploy this project to production"
- "How much would it cost to host a SaaS app with 1000 users on Varity?"
- "Search Varity docs for database setup"
- "Show my deployments"
- "Submit my app to the Varity App Store for $19/month"

## What Makes This Different

| Feature | Vercel MCP | Varity MCP |
|---------|-----------|------------|
| Create new apps | No | Yes |
| Auth included | No | Yes (Privy) |
| Database included | No | Yes (PostgreSQL) |
| Payments included | No | Yes (90/10 split) |
| Cost | $20+/mo | ~70% less |
| Open source | No | Yes (MIT) |

## Prerequisites

- Node.js >= 18
- For deployment: `pip install varitykit`

## Cost

Varity is ~70% cheaper than AWS/Vercel. Auth and database are included at no extra cost. Use the `varity_cost_calculator` tool for detailed estimates.

---

**Part of the [Varity SDK](https://github.com/varity-labs/varity-sdk)** — Build, deploy, and monetize apps 70% cheaper than AWS.

[Documentation](https://docs.varity.so) · [GitHub](https://github.com/varity-labs/varity-sdk) · [Discord](https://discord.gg/varity)
