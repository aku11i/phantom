import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import packageJson from "../package.json" with { type: "json" };
import { createWorktreeTool } from "./tools/create-worktree.js";
import { deleteWorktreeTool } from "./tools/delete-worktree.js";
import { execCommandTool } from "./tools/exec-command.js";
import { listWorktreesTool } from "./tools/list-worktrees.js";
import { readFileTool } from "./tools/read-file.js";
import { writeFileTool } from "./tools/write-file.js";

const server = new McpServer({
  name: "Phantom MCP Server",
  version: packageJson.version,
});

// Register tools
server.tool(
  createWorktreeTool.name,
  createWorktreeTool.description,
  createWorktreeTool.inputSchema.shape,
  createWorktreeTool.handler,
);

server.tool(
  listWorktreesTool.name,
  listWorktreesTool.description,
  listWorktreesTool.inputSchema.shape,
  listWorktreesTool.handler,
);

server.tool(
  deleteWorktreeTool.name,
  deleteWorktreeTool.description,
  deleteWorktreeTool.inputSchema.shape,
  deleteWorktreeTool.handler,
);

server.tool(
  execCommandTool.name,
  execCommandTool.description,
  execCommandTool.inputSchema.shape,
  execCommandTool.handler,
);

server.tool(
  readFileTool.name,
  readFileTool.description,
  readFileTool.inputSchema.shape,
  readFileTool.handler,
);

server.tool(
  writeFileTool.name,
  writeFileTool.description,
  writeFileTool.inputSchema.shape,
  writeFileTool.handler,
);

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
