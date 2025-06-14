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
for (const tool of [
  createWorktreeTool,
  listWorktreesTool,
  deleteWorktreeTool,
  execCommandTool,
  readFileTool,
  writeFileTool,
]) {
  server.tool(tool.name, tool.inputSchema.properties, async (args) => {
    const result = await tool.handler(args);
    return {
      content: [
        {
          type: "text",
          text:
            typeof result === "string"
              ? result
              : JSON.stringify(result, null, 2),
        },
      ],
    };
  });
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
