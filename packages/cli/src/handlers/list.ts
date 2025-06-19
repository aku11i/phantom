import { parseArgs } from "node:util";
import {
  createContext,
  listWorktrees as listWorktreesCore,
  selectWorktreeWithFzf,
} from "@aku11i/phantom-core";
import { getGitRoot } from "@aku11i/phantom-git";
import { DefaultLogger, isErr } from "@aku11i/phantom-shared";
import { exitCodes, exitWithError } from "../errors.ts";

export async function listHandler(args: string[] = []): Promise<void> {
  const logger = new DefaultLogger();
  const { values } = parseArgs({
    args,
    options: {
      fzf: {
        type: "boolean",
        default: false,
      },
      names: {
        type: "boolean",
        default: false,
      },
    },
    strict: true,
    allowPositionals: false,
  });
  try {
    const gitRoot = await getGitRoot();
    const context = await createContext(gitRoot);

    if (values.fzf) {
      const selectResult = await selectWorktreeWithFzf(
        context.gitRoot,
        context.worktreesDirectory,
      );

      if (isErr(selectResult)) {
        exitWithError(selectResult.error.message, exitCodes.generalError);
      }

      if (selectResult.value) {
        logger.log(selectResult.value.name);
      }
    } else {
      const result = await listWorktreesCore(
        context.gitRoot,
        context.worktreesDirectory,
      );

      if (isErr(result)) {
        exitWithError("Failed to list worktrees", exitCodes.generalError);
      }

      const { worktrees, message } = result.value;

      if (worktrees.length === 0) {
        if (!values.names) {
          logger.log(message || "No worktrees found.");
        }
        process.exit(exitCodes.success);
      }

      if (values.names) {
        for (const worktree of worktrees) {
          logger.log(worktree.name);
        }
      } else {
        const maxNameLength = Math.max(
          ...worktrees.map((wt) => wt.name.length),
        );

        for (const worktree of worktrees) {
          const paddedName = worktree.name.padEnd(maxNameLength + 2);
          const branchInfo = worktree.branch ? `(${worktree.branch})` : "";
          const status = !worktree.isClean ? " [dirty]" : "";

          logger.log(`${paddedName} ${branchInfo}${status}`);
        }
      }
    }

    process.exit(exitCodes.success);
  } catch (error) {
    exitWithError(
      error instanceof Error ? error.message : String(error),
      exitCodes.generalError,
    );
  }
}
