import {
  executeGitCommandInDirectory,
  listWorktrees as gitListWorktrees,
} from "@aku11i/phantom-git";
import { ok, type Result } from "@aku11i/phantom-shared";

export interface WorktreeInfo {
  name: string;
  path: string;
  branch: string;
  isClean: boolean;
}

export interface ListWorktreesSuccess {
  worktrees: WorktreeInfo[];
  message?: string;
}

export async function getWorktreeBranch(worktreePath: string): Promise<string> {
  try {
    const { stdout } = await executeGitCommandInDirectory(worktreePath, [
      "branch",
      "--show-current",
    ]);
    return stdout || "(detached HEAD)";
  } catch {
    return "unknown";
  }
}

export async function getWorktreeStatus(
  worktreePath: string,
): Promise<boolean> {
  try {
    const { stdout } = await executeGitCommandInDirectory(worktreePath, [
      "status",
      "--porcelain",
    ]);
    return !stdout; // Clean if no output
  } catch {
    // If git status fails, assume clean
    return true;
  }
}

export async function getWorktreeInfo(
  _gitRoot: string,
  worktreeDirectory: string,
  name: string,
): Promise<WorktreeInfo> {
  const worktreePath = `${worktreeDirectory}/${name}`;

  const [branch, isClean] = await Promise.all([
    getWorktreeBranch(worktreePath),
    getWorktreeStatus(worktreePath),
  ]);

  return {
    name: branch,
    path: worktreePath,
    branch,
    isClean,
  };
}

export async function listWorktrees(
  gitRoot: string,
  worktreeDirectory: string,
): Promise<Result<ListWorktreesSuccess, never>> {
  try {
    const gitWorktrees = await gitListWorktrees(gitRoot);

    if (gitWorktrees.length === 0) {
      return ok({
        worktrees: [],
        message: "No worktrees found",
      });
    }

    const worktrees = await Promise.all(
      gitWorktrees.map(async (gitWorktree) => {
        const branch = gitWorktree.branch || "(detached HEAD)";
        const isClean = await getWorktreeStatus(gitWorktree.path);

        return {
          name: branch,
          path: gitWorktree.path,
          branch,
          isClean,
        } satisfies WorktreeInfo;
      }),
    );

    return ok({
      worktrees,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to list worktrees: ${errorMessage}`);
  }
}
