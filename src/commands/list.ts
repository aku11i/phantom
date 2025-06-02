import {
  type WorktreeInfo,
  listWorktrees as coreListWorktrees,
} from "../core/worktree/list.ts";
import { getGitRoot } from "../git/libs/get-git-root.ts";

// Re-export WorktreeInfo for backward compatibility
export type { WorktreeInfo };

// Backward compatibility wrapper for tests
export async function listWorktrees(): Promise<{
  success: boolean;
  message?: string;
  worktrees?: WorktreeInfo[];
}> {
  try {
    const gitRoot = await getGitRoot();
    const result = await coreListWorktrees(gitRoot);
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      message: `Error listing worktrees: ${errorMessage}`,
    };
  }
}

export async function listHandler(): Promise<void> {
  try {
    const gitRoot = await getGitRoot();
    const result = await coreListWorktrees(gitRoot);

    if (!result.success) {
      console.error(result.message);
      return;
    }

    if (!result.worktrees || result.worktrees.length === 0) {
      console.log(result.message || "No worktrees found");
      return;
    }

    console.log("Worktrees:");
    for (const worktree of result.worktrees) {
      const statusText =
        worktree.status === "clean"
          ? "[clean]"
          : `[dirty: ${worktree.changedFiles} files]`;

      console.log(
        `  ${worktree.name.padEnd(20)} (branch: ${worktree.branch.padEnd(20)}) ${statusText}`,
      );
    }

    console.log(`\nTotal: ${result.worktrees.length} worktrees`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error listing worktrees: ${errorMessage}`);
  }
}
