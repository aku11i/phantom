import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
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
  "phantom_create_worktree",
  {
    name: z
      .string()
      .describe("Name for the worktree (also used as the branch name)"),
    baseBranch: z
      .string()
      .optional()
      .describe("Base branch to create from (optional)"),
  },
  async (args) => {
    const result = await createWorktreeTool.handler(args);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  },
);

server.tool("phantom_list_worktrees", {}, async (args) => {
  const result = await listWorktreesTool.handler(args);
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
});

server.tool(
  "phantom_delete_worktree",
  {
    name: z.string().describe("Name of the worktree to delete"),
    force: z
      .boolean()
      .optional()
      .describe("Force deletion even if there are uncommitted changes"),
  },
  async (args) => {
    const result = await deleteWorktreeTool.handler(args);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  },
);

server.tool(
  "phantom_exec_in_worktree",
  {
    name: z.string().describe("Name of the worktree to execute command in"),
    command: z.string().describe("Command to execute"),
    args: z.array(z.string()).optional().describe("Command arguments"),
  },
  async (args) => {
    const result = await execCommandTool.handler(args);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  },
);

server.tool(
  "phantom_read_file_from_worktree",
  {
    name: z.string().describe("Name of the worktree"),
    path: z.string().describe("Relative path to the file within the worktree"),
  },
  async (args) => {
    const result = await readFileTool.handler(args);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  },
);

server.tool(
  "phantom_write_file_to_worktree",
  {
    name: z.string().describe("Name of the worktree"),
    path: z.string().describe("Relative path to the file within the worktree"),
    content: z.string().describe("Content to write to the file"),
  },
  async (args) => {
    const result = await writeFileTool.handler(args);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  },
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
