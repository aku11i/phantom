import { helpFormatter } from "../help.ts";
import { githubHelp } from "../help/github.ts";
import { output } from "../output.ts";

export async function githubHandler(args: string[]): Promise<void> {
  if (args.length === 0) {
    output.log(helpFormatter.formatCommandHelp(githubHelp));
    return;
  }

  throw new Error(`Unknown github subcommand: ${args[0]}`);
}
