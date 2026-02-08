import { parseArgs } from "node:util";
import { executeGitCommand } from "@aku11i/phantom-git";
import { exitCodes, exitWithError, exitWithSuccess } from "../errors.ts";
import { output } from "../output.ts";

const supportedKeys = ["editor", "ai", "worktreesDirectory"] as const;

export async function preferencesRemoveHandler(args: string[]): Promise<void> {
  const { positionals, values } = parseArgs({
    args,
    options: {
      local: { type: "boolean" },
    },
    strict: true,
    allowPositionals: true,
  });

  const isLocal = values.local ?? false;
  const scope = isLocal ? "local" : "global";

  if (positionals.length !== 1) {
    exitWithError(
      "Usage: phantom preferences remove [--local] <key>",
      exitCodes.validationError,
    );
  }

  const inputKey = positionals[0];

  if (!supportedKeys.includes(inputKey as (typeof supportedKeys)[number])) {
    exitWithError(
      `Unknown preference '${inputKey}'. Supported keys: ${supportedKeys.join(", ")}`,
      exitCodes.validationError,
    );
  }

  try {
    await executeGitCommand([
      "config",
      `--${scope}`,
      "--unset",
      `phantom.${inputKey}`,
    ]);

    output.log(`Removed phantom.${inputKey} from ${scope} git config`);
    exitWithSuccess();
  } catch (error) {
    exitWithError(
      error instanceof Error ? error.message : String(error),
      exitCodes.generalError,
    );
  }
}
