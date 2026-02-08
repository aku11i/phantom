import { executeGitCommand } from "@aku11i/phantom-git";
import { exitCodes, exitWithError, exitWithSuccess } from "../errors.ts";
import { output } from "../output.ts";

const supportedKeys = ["editor", "ai", "worktreesDirectory"] as const;

export async function preferencesSetHandler(args: string[]): Promise<void> {
  const isLocal = args.includes("--local");
  const remainingArgs = args.filter((arg) => arg !== "--local");
  const scope = isLocal ? "local" : "global";

  if (remainingArgs.length < 2) {
    exitWithError(
      "Usage: phantom preferences set [--local] <key> <value>",
      exitCodes.validationError,
    );
  }

  const [inputKey, ...valueParts] = remainingArgs;

  if (!supportedKeys.includes(inputKey as (typeof supportedKeys)[number])) {
    exitWithError(
      `Unknown preference '${inputKey}'. Supported keys: ${supportedKeys.join(", ")}`,
      exitCodes.validationError,
    );
  }

  const value = valueParts.join(" ");

  if (!value) {
    exitWithError(
      `Preference '${inputKey}' requires a value`,
      exitCodes.validationError,
    );
  }

  try {
    await executeGitCommand([
      "config",
      `--${scope}`,
      `phantom.${inputKey}`,
      value,
    ]);

    output.log(`Set phantom.${inputKey} (${scope}) to '${value}'`);
    exitWithSuccess();
  } catch (error) {
    exitWithError(
      error instanceof Error ? error.message : String(error),
      exitCodes.generalError,
    );
  }
}
