import { execInWorktree as execInWorktreeCore } from "../../commands/exec.js";
import { exitCodes, exitWithError } from "../errors.js";

export async function execHandler(args: string[]): Promise<void> {
  if (args.length < 2) {
    exitWithError(
      "Usage: phantom exec <worktree-name> <command> [args...]",
      exitCodes.validationError,
    );
  }

  const [worktreeName, ...commandArgs] = args;

  try {
    const result = await execInWorktreeCore(worktreeName, commandArgs);
    process.exit(result.exitCode || 0);
  } catch (error) {
    exitWithError(
      error instanceof Error ? error.message : String(error),
      exitCodes.generalError,
    );
  }
}
