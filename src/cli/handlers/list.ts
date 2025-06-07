import { parseArgs } from "node:util";
import { getGitRoot } from "../../core/git/libs/get-git-root.ts";
import { isErr } from "../../core/types/result.ts";
import { listWorktrees as listWorktreesCore } from "../../core/worktree/list.ts";
import { selectWorktreeWithFzf } from "../../core/worktree/select.ts";
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
      format: {
        type: "string",
      },
    },
    strict: true,
    allowPositionals: false,
  });
  try {
    const gitRoot = await getGitRoot();

    if (values.fzf) {
      const selectResult = await selectWorktreeWithFzf(gitRoot);

      if (isErr(selectResult)) {
        exitWithError(selectResult.error.message, exitCodes.generalError);
      }

      if (selectResult.value) {
        output.log(selectResult.value.name);
      }
    } else {
      const result = await listWorktreesCore(gitRoot);

      if (isErr(result)) {
        exitWithError("Failed to list worktrees", exitCodes.generalError);
      }

      const { worktrees, message } = result.value;

      if (worktrees.length === 0) {
        if (values.format !== "names") {
          output.log(message || "No worktrees found.");
        }
        process.exit(exitCodes.success);
      }

      // Handle different output formats
      if (values.format === "names") {
        // Simple names output for shell completion
        for (const worktree of worktrees) {
          output.log(worktree.name);
        }
      } else if (values.format === "json") {
        // JSON output
        output.log(JSON.stringify(worktrees, null, 2));
      } else if (values.format === "simple") {
        // Simple format without padding
        for (const worktree of worktrees) {
          const branchInfo = worktree.branch ? ` (${worktree.branch})` : "";
          const status = !worktree.isClean ? " [dirty]" : "";
          output.log(`${worktree.name}${branchInfo}${status}`);
        }
      } else {
        // Default format with padding
        const maxNameLength = Math.max(
          ...worktrees.map((wt) => wt.name.length),
        );

        for (const worktree of worktrees) {
          const paddedName = worktree.name.padEnd(maxNameLength + 2);
          const branchInfo = worktree.branch ? `(${worktree.branch})` : "";
          const status = !worktree.isClean ? " [dirty]" : "";

          output.log(`${paddedName} ${branchInfo}${status}`);
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
