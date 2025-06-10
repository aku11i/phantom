import { executeGitCommand } from "../executor.ts";
import { listWorktrees } from "./list-worktrees.ts";

export async function getCurrentWorktree(
  gitRoot: string,
): Promise<string | null> {
  try {
    const { stdout: currentPath } = await executeGitCommand([
      "rev-parse",
      "--show-toplevel",
    ]);

    const currentPathTrimmed = currentPath.trim();

    const worktrees = await listWorktrees(gitRoot);

    const currentWorktree = worktrees.find(
      (wt) => wt.path === currentPathTrimmed,
    );

    if (!currentWorktree || currentWorktree.path === gitRoot) {
      return null;
    }

    return currentWorktree.branch;
  } catch {
    return null;
  }
}
