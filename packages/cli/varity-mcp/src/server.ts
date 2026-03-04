import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerSearchDocsTool } from "./tools/search-docs.js";
import { registerCostCalculatorTool } from "./tools/cost-calculator.js";
import { registerInitTool } from "./tools/init.js";
import { registerDeployTool } from "./tools/deploy.js";
import { registerDeployStatusTool } from "./tools/deploy-status.js";
import { registerDeployLogsTool } from "./tools/deploy-logs.js";
import { registerSubmitToStoreTool } from "./tools/submit-to-store.js";

/**
 * Create and configure the Varity MCP Server.
 *
 * The server exposes 7 tools:
 *   - varity_search_docs (public)
 *   - varity_cost_calculator (public)
 *   - varity_init (authenticated)
 *   - varity_deploy (authenticated, requires confirmation)
 *   - varity_deploy_status (authenticated)
 *   - varity_deploy_logs (authenticated)
 *   - varity_submit_to_store (authenticated, requires confirmation)
 */
export function createVarityServer(): McpServer {
  const server = new McpServer({
    name: "varity",
    version: "1.0.0",
  });

  // Public tools (no auth required)
  registerSearchDocsTool(server);
  registerCostCalculatorTool(server);

  // Authenticated tools
  registerInitTool(server);
  registerDeployTool(server);
  registerDeployStatusTool(server);
  registerDeployLogsTool(server);
  registerSubmitToStoreTool(server);

  return server;
}
