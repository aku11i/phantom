import { parseArgs } from "node:util";
import { serve } from "@aku11i/phantom-mcp";
import { exitWithError } from "../errors.ts";
import { mcpHelp } from "../help/mcp.ts";

export async function mcpHandler(args: string[] = []): Promise<void> {
  const { values, positionals } = parseArgs({
    args,
    options: {
      help: {
        type: "boolean",
        short: "h",
      },
    },
    strict: true,
    allowPositionals: true,
  });

  if (values.help) {
    mcpHelp();
    return;
  }

  const [subcommand] = positionals;

  if (subcommand !== "serve") {
    exitWithError(`Unknown subcommand: ${subcommand || "(none)"}`);
  }

  try {
    await serve();
  } catch (error) {
    exitWithError(
      `Failed to start MCP server: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
