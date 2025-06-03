import { getGitRoot } from "../../core/git/libs/get-git-root.ts";
import { isErr } from "../../core/types/result.ts";
import { whereWorktree as whereWorktreeCore } from "../../core/worktree/where.ts";
import { exitCodes, exitWithError, exitWithSuccess } from "../errors.ts";
import { output } from "../output.ts";

export async function whereHandler(args: string[]): Promise<void> {
  if (args.length === 0) {
    exitWithError("Please provide a worktree name", exitCodes.validationError);
  }

  const worktreeName = args[0];

  try {
    const gitRoot = await getGitRoot();
    const result = await whereWorktreeCore(gitRoot, worktreeName);

    if (isErr(result)) {
      exitWithError(result.error.message, exitCodes.notFound);
    }

    output.log(result.value.path);
    exitWithSuccess();
  } catch (error) {
    exitWithError(
      error instanceof Error ? error.message : String(error),
      exitCodes.generalError,
    );
  }
}
