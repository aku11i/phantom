import { parseArgs } from "node:util";
import { getGitRoot } from "../../core/git/libs/get-git-root.ts";
import { isErr } from "../../core/types/result.ts";
import { selectWithFzf } from "../../core/utils/fzf.ts";
import { listWorktrees as listWorktreesCore } from "../../core/worktree/list.ts";
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
    },
    strict: true,
    allowPositionals: false,
  });
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

    if (values.fzf) {
      const list = worktrees.map((wt) => {
        const branchInfo = wt.branch ? `(${wt.branch})` : "";
        const status = !wt.isClean ? " [dirty]" : "";
        return `${wt.name} ${branchInfo}${status}`;
      });

      const fzfResult = await selectWithFzf(list, {
        prompt: "Select worktree> ",
        header: "Git Worktrees (Phantoms)",
      });

      if (isErr(fzfResult)) {
        exitWithError(fzfResult.error.message, exitCodes.generalError);
      }

      if (fzfResult.value) {
        const selectedName = fzfResult.value.split(" ")[0];
        output.log(selectedName);
      }
    } else {
      const maxNameLength = Math.max(...worktrees.map((wt) => wt.name.length));

      for (const worktree of worktrees) {
        const paddedName = worktree.name.padEnd(maxNameLength + 2);
        const branchInfo = worktree.branch ? `(${worktree.branch})` : "";
        const status = !worktree.isClean ? " [dirty]" : "";

        output.log(`${paddedName} ${branchInfo}${status}`);
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
