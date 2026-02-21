import { zellijHelp } from "../help/zellij.ts";
import { helpFormatter } from "../help.ts";

export async function zellijHandler(args: string[]): Promise<void> {
  if (args.length === 0) {
    console.log(helpFormatter.formatCommandHelp(zellijHelp));
    return;
  }

  throw new Error(`Unknown zellij subcommand: ${args[0]}`);
}
