import { parseArgs } from "node:util";
import { getCurrentWorktree } from "../../core/git/libs/get-current-worktree.ts";
import { getGitRoot } from "../../core/git/libs/get-git-root.ts";
import { isErr } from "../../core/types/result.ts";
import { deleteWorktree as deleteWorktreeCore } from "../../core/worktree/delete.ts";
import {
  WorktreeError,
  WorktreeNotFoundError,
} from "../../core/worktree/errors.ts";
import { selectWorktreeWithFzf } from "../../core/worktree/select.ts";
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
      fzf: {
        type: "boolean",
        default: false,
      },
    },
    strict: true,
    allowPositionals: true,
  });

  const deleteCurrent = values.current ?? false;
  const useFzf = values.fzf ?? false;

  if (positionals.length === 0 && !deleteCurrent && !useFzf) {
    exitWithError(
      "Please provide a worktree name to delete, use --current to delete the current worktree, or use --fzf for interactive selection",
      exitCodes.validationError,
    );
  }

  if ((positionals.length > 0 || useFzf) && deleteCurrent) {
    exitWithError(
      "Cannot specify --current with a worktree name or --fzf option",
      exitCodes.validationError,
    );
  }

  if (positionals.length > 0 && useFzf) {
    exitWithError(
      "Cannot specify both a worktree name and --fzf option",
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
    } else if (useFzf) {
      const selectResult = await selectWorktreeWithFzf(gitRoot);
      if (isErr(selectResult)) {
        exitWithError(selectResult.error.message, exitCodes.generalError);
      }
      if (!selectResult.value) {
        exitWithSuccess();
      }
      worktreeName = selectResult.value.name;
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
