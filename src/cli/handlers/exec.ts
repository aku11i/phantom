import { getGitRoot } from "../../core/git/libs/get-git-root.ts";
import { execInWorktree as execInWorktreeCore } from "../../core/process/exec.ts";
import { isErr } from "../../core/types/result.ts";
import { WorktreeNotFoundError } from "../../core/worktree/errors.ts";
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

    if (isErr(result)) {
      const exitCode =
        result.error instanceof WorktreeNotFoundError
          ? exitCodes.notFound
          : result.error.exitCode || exitCodes.generalError;
      exitWithError(result.error.message, exitCode);
    }

    process.exit(result.value.exitCode);
  } catch (error) {
    exitWithError(
      error instanceof Error ? error.message : String(error),
      exitCodes.generalError,
    );
  }
}
