#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createVarityServer } from "./server.js";

/**
 * Varity MCP Server
 *
 * Usage:
 *   npx @varity-labs/mcp              # stdio transport (default)
 *   npx @varity-labs/mcp --transport stdio   # explicit stdio
 *
 * For Cursor (.cursor/mcp.json):
 *   { "mcpServers": { "varity": { "command": "npx", "args": ["@varity-labs/mcp"] } } }
 *
 * For Claude Code:
 *   claude mcp add varity -- npx @varity-labs/mcp
 */

type Transport = "stdio";

function parseArgs(): { transport: Transport } {
  const args = process.argv.slice(2);
  let transport: Transport = "stdio";

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--transport" && args[i + 1]) {
      const value = args[i + 1]!;
      if (value === "stdio") {
        transport = value;
      }
      i++;
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else if (arg === "--version" || arg === "-v") {
      console.error("@varity-labs/mcp v1.0.0");
      process.exit(0);
    }
  }

  return { transport };
}

function printHelp(): void {
  console.error(`
@varity-labs/mcp — Deploy production apps from any AI coding tool

USAGE:
  npx @varity-labs/mcp [options]

OPTIONS:
  --transport stdio    Transport type (default: stdio)
  --help, -h           Show this help
  --version, -v        Show version

TOOLS:
  varity_search_docs       Search Varity documentation
  varity_cost_calculator   Compare costs vs AWS/Vercel
  varity_init              Create a new production app
  varity_deploy            Deploy to production
  varity_deploy_status     Check deployment status
  varity_deploy_logs       Read build/deployment logs
  varity_submit_to_store   Submit to Varity App Store

CURSOR (.cursor/mcp.json):
  {
    "mcpServers": {
      "varity": {
        "command": "npx",
        "args": ["@varity-labs/mcp"]
      }
    }
  }

CLAUDE CODE:
  claude mcp add varity -- npx @varity-labs/mcp

DOCS: https://docs.varity.so/mcp
`);
}

async function startStdio(): Promise<void> {
  const server = createVarityServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Varity MCP Server running on stdio");
}

async function main(): Promise<void> {
  const { transport } = parseArgs();

  if (transport === "stdio") {
    await startStdio();
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
