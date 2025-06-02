import { exec } from "node:child_process";
import { promisify } from "node:util";
import { getGitRoot } from "./get-git-root.ts";

const execAsync = promisify(exec);

export interface WorktreeInfo {
  path: string;
  branch?: string;
  isDetached: boolean;
}

export async function getWorktrees(): Promise<WorktreeInfo[]> {
  const gitRoot = await getGitRoot();

  const { stdout } = await execAsync("git worktree list --porcelain", {
    cwd: gitRoot,
  });

  const worktrees: WorktreeInfo[] = [];
  const lines = stdout.trim().split("\n");
  let currentWorktree: Partial<WorktreeInfo> | null = null;

  for (const line of lines) {
    if (line.startsWith("worktree ")) {
      if (currentWorktree?.path) {
        worktrees.push({
          path: currentWorktree.path,
          branch: currentWorktree.branch,
          isDetached: currentWorktree.isDetached ?? false,
        });
      }
      currentWorktree = {
        path: line.substring(9),
        isDetached: false,
      };
    } else if (line.startsWith("branch ") && currentWorktree) {
      const branchRef = line.substring(7);
      currentWorktree.branch = branchRef.replace("refs/heads/", "");
    } else if (line === "detached" && currentWorktree) {
      currentWorktree.isDetached = true;
    } else if (line === "" && currentWorktree?.path) {
      worktrees.push({
        path: currentWorktree.path,
        branch: currentWorktree.branch,
        isDetached: currentWorktree.isDetached ?? false,
      });
      currentWorktree = null;
    }
  }

  if (currentWorktree?.path) {
    worktrees.push({
      path: currentWorktree.path,
      branch: currentWorktree.branch,
      isDetached: currentWorktree.isDetached ?? false,
    });
  }

  return worktrees;
}
