import { shellInWorktree as shellInWorktreeCore } from "../../commands/shell.js";
import { exitCodes, exitWithError } from "../errors.js";
import { output } from "../output.js";

export async function shellHandler(args: string[]): Promise<void> {
  if (args.length === 0) {
    exitWithError(
      "Usage: phantom shell <worktree-name>",
      exitCodes.validationError,
    );
  }

  const worktreeName = args[0];

  try {
    output.log(`Entering worktree '${worktreeName}'...`);
    output.log("(Type 'exit' or press Ctrl+D to leave)");

    const result = await shellInWorktreeCore(worktreeName);

    output.log(`Exited worktree '${worktreeName}'`);
    process.exit(result.exitCode || 0);
  } catch (error) {
    exitWithError(
      error instanceof Error ? error.message : String(error),
      exitCodes.generalError,
    );
  }
}
