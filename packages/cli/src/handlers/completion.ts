import { exit } from "node:process";
import { output } from "../output.ts";
import {
  BASH_COMPLETION_SCRIPT,
  FISH_COMPLETION_SCRIPT,
  ZSH_COMPLETION_SCRIPT,
} from "../completions/index.ts";

export function completionHandler(args: string[]): void {
  const shell = args[0];

  if (!shell) {
    output.error("Usage: phantom completion <shell>");
    output.error("Supported shells: fish, zsh, bash");
    exit(1);
  }

  switch (shell.toLowerCase()) {
    case "fish":
      console.log(FISH_COMPLETION_SCRIPT);
      break;
    case "zsh":
      console.log(ZSH_COMPLETION_SCRIPT);
      break;
    case "bash":
      console.log(BASH_COMPLETION_SCRIPT);
      break;
    default:
      output.error(`Unsupported shell: ${shell}`);
      output.error("Supported shells: fish, zsh, bash");
      exit(1);
  }
}
