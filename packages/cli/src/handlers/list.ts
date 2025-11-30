import { relative } from "node:path";
import { parseArgs } from "node:util";
import {
  createContext,
  listWorktrees as listWorktreesCore,
  selectWorktreeWithFzf,
} from "@aku11i/phantom-core";
import { getGitRoot } from "@aku11i/phantom-git";
import { isErr } from "@aku11i/phantom-shared";
import { exitCodes, exitWithError } from "../errors.ts";
import { output } from "../output.ts";

export async function listHandler(args: string[] = []): Promise<void> {
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
        output.log(selectResult.value.name);
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
          output.log(message || "No worktrees found.");
        }
        process.exit(exitCodes.success);
      }

      if (values.names) {
        for (const worktree of worktrees) {
          output.log(worktree.name);
        }
      } else {
        for (const worktree of worktrees) {
          const worktreeRelativePath =
            relative(process.cwd(), worktree.path) || ".";
          const status = !worktree.isClean ? " [dirty]" : "";

          output.log(`${worktree.name} (${worktreeRelativePath})${status}`);
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
