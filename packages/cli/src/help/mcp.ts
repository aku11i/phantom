import { exitWithSuccess } from "../errors.ts";
import { output } from "../output.ts";

export function helpForMcp(): void {
  output.log(`Usage: phantom mcp <subcommand> [options]

Manage MCP (Model Context Protocol) server for Phantom

Subcommands:
  serve    Start the MCP server with stdio transport

Options:
  -h, --help    Show this help message

Examples:
  phantom mcp serve    Start the MCP server

The MCP server allows AI assistants to manage Git worktrees through the Model Context Protocol.`);

  exitWithSuccess();
}
