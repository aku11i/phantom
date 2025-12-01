import { preferencesHelp } from "../help/preferences.ts";
import { helpFormatter } from "../help.ts";

export async function preferencesHandler(args: string[]): Promise<void> {
  if (args.length === 0) {
    console.log(helpFormatter.formatCommandHelp(preferencesHelp));
    return;
  }

  throw new Error(`Unknown preferences subcommand: ${args[0]}`);
}
