import { parseArgs } from "node:util";
import { serve } from "@aku11i/phantom-mcp";
import { exitWithError } from "../errors.ts";
import { helpFormatter } from "../help.ts";
import { mcpHelp } from "../help/mcp.ts";
import { output } from "../output.ts";

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
    output.log(helpFormatter.formatCommandHelp(mcpHelp));
    return;
  }

  if (positionals.length === 0) {
    output.log(helpFormatter.formatCommandHelp(mcpHelp));
    return;
  }

  const [subcommand] = positionals;

  if (subcommand !== "serve") {
    exitWithError(`Unknown subcommand: ${subcommand}`);
  }

  try {
    await serve();
  } catch (error) {
    exitWithError(
      `Failed to start MCP server: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
