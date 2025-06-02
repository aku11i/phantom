import { getGitRoot } from "../../core/git/libs/get-git-root.ts";
import { execInWorktree as execInWorktreeCore } from "../../core/process/exec.ts";
import { exitCodes, exitWithError } from "../errors.ts";

export async function execHandler(args: string[]): Promise<void> {
  if (args.length < 2) {
    exitWithError(
      "Usage: phantom exec <worktree-name> <command> [args...]",
      exitCodes.validationError,
    );
  }

  const [worktreeName, ...commandArgs] = args;

  try {
    const gitRoot = await getGitRoot();
    const result = await execInWorktreeCore(gitRoot, worktreeName, commandArgs);

    if (!result.success && result.message) {
      exitWithError(result.message, result.exitCode || exitCodes.generalError);
    }

    process.exit(result.exitCode || 0);
  } catch (error) {
    exitWithError(
      error instanceof Error ? error.message : String(error),
      exitCodes.generalError,
    );
  }
}
