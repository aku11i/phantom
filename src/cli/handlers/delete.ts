import { parseArgs } from "node:util";
import { getCurrentWorktree } from "../../core/git/libs/get-current-worktree.ts";
import { getGitRoot } from "../../core/git/libs/get-git-root.ts";
import { isErr } from "../../core/types/result.ts";
import { deleteWorktree as deleteWorktreeCore } from "../../core/worktree/delete.ts";
import {
  WorktreeError,
  WorktreeNotFoundError,
} from "../../core/worktree/errors.ts";
import { exitCodes, exitWithError, exitWithSuccess } from "../errors.ts";
import { output } from "../output.ts";

export async function deleteHandler(args: string[]): Promise<void> {
  const { values, positionals } = parseArgs({
    args,
    options: {
      force: {
        type: "boolean",
        short: "f",
      },
      current: {
        type: "boolean",
      },
    },
    strict: true,
    allowPositionals: true,
  });

  const deleteCurrent = values.current ?? false;

  if (positionals.length === 0 && !deleteCurrent) {
    exitWithError(
      "Please provide a worktree name to delete or use --current to delete the current worktree",
      exitCodes.validationError,
    );
  }

  if (positionals.length > 0 && deleteCurrent) {
    exitWithError(
      "Cannot specify both a worktree name and --current option",
      exitCodes.validationError,
    );
  }

  const forceDelete = values.force ?? false;

  try {
    const gitRoot = await getGitRoot();

    let worktreeName: string;
    if (deleteCurrent) {
      const currentWorktree = await getCurrentWorktree(gitRoot);
      if (!currentWorktree) {
        exitWithError(
          "Not in a worktree directory. The --current option can only be used from within a worktree.",
          exitCodes.validationError,
        );
      }
      worktreeName = currentWorktree;
    } else {
      worktreeName = positionals[0];
    }

    const result = await deleteWorktreeCore(gitRoot, worktreeName, {
      force: forceDelete,
    });

    if (isErr(result)) {
      const exitCode =
        result.error instanceof WorktreeNotFoundError
          ? exitCodes.validationError
          : result.error instanceof WorktreeError &&
              result.error.message.includes("uncommitted changes")
            ? exitCodes.validationError
            : exitCodes.generalError;
      exitWithError(result.error.message, exitCode);
    }

    output.log(result.value.message);
    exitWithSuccess();
  } catch (error) {
    exitWithError(
      error instanceof Error ? error.message : String(error),
      exitCodes.generalError,
    );
  }
}
