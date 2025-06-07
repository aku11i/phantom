import { parseArgs } from "node:util";
import { generateBashCompletion } from "../../core/completion/bash.ts";
import { generateFishCompletion } from "../../core/completion/fish.ts";
import { generateZshCompletion } from "../../core/completion/zsh.ts";
import { exitCodes, exitWithError } from "../errors.ts";
import { output } from "../output.ts";

export async function completionHandler(args: string[] = []): Promise<void> {
  const { positionals } = parseArgs({
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

  const shell = positionals[0];

  if (!shell) {
    exitWithError(
      "Shell type is required\nUsage: phantom completion <shell>\nSupported shells: bash, zsh, fish",
      exitCodes.validationError,
    );
  }

  let completionScript: string;

  switch (shell.toLowerCase()) {
    case "bash":
      completionScript = generateBashCompletion();
      break;
    case "zsh":
      completionScript = generateZshCompletion();
      break;
    case "fish":
      completionScript = generateFishCompletion();
      break;
    default:
      exitWithError(
        `Unsupported shell: ${shell}\nSupported shells: bash, zsh, fish`,
        exitCodes.validationError,
      );
  }

  output.log(completionScript);
}
