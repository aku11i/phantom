import { githubHelp } from "../help/github.ts";
import { helpFormatter } from "../help.ts";

export async function githubHandler(args: string[]): Promise<void> {
  if (args.length === 0) {
    console.log(helpFormatter.formatCommandHelp(githubHelp));
    return;
  }

  throw new Error(`Unknown github subcommand: ${args[0]}`);
}
