import { parseArgs } from "node:util";
import { getGitRoot } from "../../core/git/libs/get-git-root.ts";
import {
  checkFzfAvailable,
  selectWorktreeWithFzf,
} from "../../core/process/fzf.ts";
import { isErr, isOk } from "../../core/types/result.ts";
import { deleteWorktree } from "../../core/worktree/delete.ts";
import { listWorktrees as listWorktreesCore } from "../../core/worktree/list.ts";
import { exitCodes, exitWithError } from "../errors.ts";
import { output } from "../output.ts";

export async function listHandler(args: string[] = []): Promise<void> {
  const { values } = parseArgs({
    args,
    options: {
      fzf: {
        type: "boolean",
        short: "f",
      },
      delete: {
        type: "boolean",
        short: "d",
      },
    },
    strict: true,
    allowPositionals: false,
  });

  const useFzf = values.fzf ?? false;
  const deleteMode = values.delete ?? false;

  if (deleteMode && !useFzf) {
    exitWithError(
      "The --delete flag can only be used with --fzf",
      exitCodes.validationError,
    );
  }
  try {
    const gitRoot = await getGitRoot();
    const result = await listWorktreesCore(gitRoot);

    if (isErr(result)) {
      exitWithError("Failed to list worktrees", exitCodes.generalError);
    }

    const { worktrees, message } = result.value;

    if (worktrees.length === 0) {
      output.log(message || "No worktrees found.");
      process.exit(exitCodes.success);
    }

    if (useFzf) {
      const fzfAvailable = await checkFzfAvailable();
      if (!fzfAvailable) {
        exitWithError(
          "fzf is not installed. Please install fzf to use the --fzf flag",
          exitCodes.validationError,
        );
      }

      const fzfOptions = {
        multiSelect: deleteMode,
        prompt: deleteMode
          ? "Select worktree(s) to delete: "
          : "Select worktree: ",
      };

      const selectionResult = await selectWorktreeWithFzf(
        worktrees,
        fzfOptions,
      );

      if (isErr(selectionResult)) {
        exitWithError(
          `Failed to run fzf: ${selectionResult.error.message}`,
          exitCodes.generalError,
        );
      }

      const selected = selectionResult.value.selected;

      if (selected.length === 0) {
        output.log("No worktree selected.");
        process.exit(exitCodes.success);
      }

      if (deleteMode) {
        output.log("\nSelected worktrees to delete:");
        for (const wt of selected) {
          output.log(`  - ${wt.name} (${wt.branch})`);
        }

        output.log("\nDeleting selected worktrees...");

        let hasError = false;
        for (const wt of selected) {
          const deleteResult = await deleteWorktree(gitRoot, wt.name);
          if (isOk(deleteResult)) {
            output.log(`✓ Deleted: ${wt.name}`);
          } else {
            output.error(
              `✗ Failed to delete ${wt.name}: ${deleteResult.error.message}`,
            );
            hasError = true;
          }
        }

        process.exit(hasError ? exitCodes.generalError : exitCodes.success);
      } else {
        const selectedWorktree = selected[0];
        output.log(selectedWorktree.path);
        process.exit(exitCodes.success);
      }
    }

    const maxNameLength = Math.max(...worktrees.map((wt) => wt.name.length));

    for (const worktree of worktrees) {
      const paddedName = worktree.name.padEnd(maxNameLength + 2);
      const branchInfo = worktree.branch ? `(${worktree.branch})` : "";
      const status = !worktree.isClean ? " [dirty]" : "";

      output.log(`${paddedName} ${branchInfo}${status}`);
    }

    process.exit(exitCodes.success);
  } catch (error) {
    exitWithError(
      error instanceof Error ? error.message : String(error),
      exitCodes.generalError,
    );
  }
}
