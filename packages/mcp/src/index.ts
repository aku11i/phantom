import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import packageJson from "../package.json" with { type: "json" };
import { createWorktreeTool } from "./tools/create-worktree.js";
import { deleteWorktreeTool } from "./tools/delete-worktree.js";
import { execCommandTool } from "./tools/exec-command.js";
import { listWorktreesTool } from "./tools/list-worktrees.js";
import { readFileTool } from "./tools/read-file.js";
import { writeFileTool } from "./tools/write-file.js";

const server = new Server(
  {
    name: "Phantom MCP Server",
    version: packageJson.version,
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

const tools = [
  createWorktreeTool,
  listWorktreesTool,
  deleteWorktreeTool,
  execCommandTool,
  readFileTool,
  writeFileTool,
];

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    })),
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const tool = tools.find((t) => t.name === request.params.name);

  if (!tool) {
    throw new Error(`Tool not found: ${request.params.name}`);
  }

  try {
    const result = await tool.handler(request.params.arguments || {});
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
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

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
