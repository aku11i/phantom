import { getGitRoot } from "../../core/git/libs/get-git-root.ts";
import { deleteWorktree as deleteWorktreeCore } from "../../core/worktree/delete.ts";
import { exitCodes, exitWithError, exitWithSuccess } from "../errors.ts";
import { output } from "../output.ts";

export async function deleteHandler(args: string[]): Promise<void> {
  const forceDelete = args.includes("--force");
  const filteredArgs = args.filter((arg) => arg !== "--force");

  if (filteredArgs.length === 0) {
    exitWithError(
      "Please provide a worktree name to delete",
      exitCodes.validationError,
    );
  }

  const worktreeName = filteredArgs[0];

  try {
    const gitRoot = await getGitRoot();
    const result = await deleteWorktreeCore(gitRoot, worktreeName, {
      force: forceDelete,
    });

    if (!result.success) {
      exitWithError(result.message, exitCodes.generalError);
    }

    output.log(result.message);
    exitWithSuccess();
  } catch (error) {
    exitWithError(
      error instanceof Error ? error.message : String(error),
      exitCodes.generalError,
    );
  }
}
