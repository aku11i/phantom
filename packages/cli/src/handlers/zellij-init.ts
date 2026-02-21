import { parseArgs } from "node:util";
import { getGitRoot } from "@aku11i/phantom-git";
import { exitCodes, exitWithError, exitWithSuccess } from "../errors.ts";
import { initLayout } from "../zellij/init.ts";

export async function zellijInitHandler(args: string[]): Promise<void> {
  const { values } = parseArgs({
    args,
    options: {
      global: {
        type: "boolean",
        short: "g",
      },
      name: {
        type: "string",
        short: "n",
      },
      force: {
        type: "boolean",
        short: "f",
      },
    },
    strict: true,
    allowPositionals: false,
  });

  const isGlobal = values.global ?? false;
  const name = values.name;
  const force = values.force ?? false;

  try {
    // We need gitRoot even for global layouts (for potential config updates)
    const gitRoot = await getGitRoot();

    const result = await initLayout({
      gitRoot,
      global: isGlobal,
      name,
      force,
    });

    if (result.alreadyExists && !result.created) {
      exitWithError(
        `Layout already exists. Use --force to overwrite.`,
        exitCodes.validationError,
      );
    }

    exitWithSuccess();
  } catch (error) {
    exitWithError(
      error instanceof Error ? error.message : String(error),
      exitCodes.generalError,
    );
  }
}
