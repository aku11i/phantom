import { DefaultLogger } from "@aku11i/phantom-shared";
import { helpFormatter } from "../help.ts";
import { githubHelp } from "../help/github.ts";

export async function githubHandler(args: string[]): Promise<void> {
  const logger = new DefaultLogger();
  if (args.length === 0) {
    logger.log(helpFormatter.formatCommandHelp(githubHelp));
    return;
  }

  throw new Error(`Unknown github subcommand: ${args[0]}`);
}
