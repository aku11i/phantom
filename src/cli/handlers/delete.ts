import { parseArgs } from "node:util";
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
    },
    strict: true,
    allowPositionals: true,
  });

  if (positionals.length === 0) {
    exitWithError(
      "Please provide a worktree name to delete",
      exitCodes.validationError,
    );
  }

  const worktreeName = positionals[0];
  const forceDelete = values.force ?? false;

  try {
    const gitRoot = await getGitRoot();
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
