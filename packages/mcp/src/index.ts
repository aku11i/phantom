import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import packageJson from "../package.json" with { type: "json" };
import { createWorktreeTool } from "./tools/create-worktree.js";
import { deleteWorktreeTool } from "./tools/delete-worktree.js";
import { listWorktreesTool } from "./tools/list-worktrees.js";

const server = new McpServer({
  name: "Phantom MCP Server",
  version: packageJson.version,
});

// Define all tools
const tools = [createWorktreeTool, listWorktreesTool, deleteWorktreeTool];

// Register tools
for (const tool of tools) {
  server.tool(
    tool.name,
    tool.description,
    tool.inputSchema.shape,
    tool.handler,
  );
}

export async function serve() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  process.on("SIGINT", async () => {
    await server.close();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    await server.close();
    process.exit(0);
  });
}
