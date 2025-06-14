import type { CommandHelp } from "../help.ts";

export const mcpHelp: CommandHelp = {
  name: "mcp",
  description: "Manage MCP (Model Context Protocol) server for Phantom",
  usage: "phantom mcp <subcommand> [options]",
  options: [
    {
      name: "help",
      short: "h",
      type: "boolean",
      description: "Show help message",
    },
  ],
  examples: [
    {
      description: "Start the MCP server",
      command: "phantom mcp serve",
    },
  ],
  notes: [
    "Subcommands:",
    "  serve    Start the MCP server with stdio transport",
    "",
    "The MCP server allows AI assistants to manage Git worktrees through the Model Context Protocol.",
  ],
};
