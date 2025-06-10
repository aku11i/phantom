import {
  executeGitCommandInDirectory,
  listWorktrees as gitListWorktrees,
} from "@aku11i/phantom-git";
import { type Result, ok } from "@aku11i/phantom-shared";
import { getPhantomDirectory, getWorktreePath } from "../paths.ts";

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
  gitRoot: string,
  name: string,
): Promise<WorktreeInfo> {
  const worktreePath = getWorktreePath(gitRoot, name);

  const [branch, isClean] = await Promise.all([
    getWorktreeBranch(worktreePath),
    getWorktreeStatus(worktreePath),
  ]);

  return {
    name,
    path: worktreePath,
    branch,
    isClean,
  };
}

export async function listWorktrees(
  gitRoot: string,
): Promise<Result<ListWorktreesSuccess, never>> {
  try {
    const gitWorktrees = await gitListWorktrees(gitRoot);
    const phantomDir = getPhantomDirectory(gitRoot);

    const phantomWorktrees = gitWorktrees.filter((worktree) =>
      worktree.path.startsWith(phantomDir),
    );

    if (phantomWorktrees.length === 0) {
      return ok({
        worktrees: [],
        message: "No worktrees found",
      });
    }

    const worktrees = await Promise.all(
      phantomWorktrees.map(async (gitWorktree) => {
        const name = gitWorktree.path.substring(phantomDir.length + 1);
        const isClean = await getWorktreeStatus(gitWorktree.path);

        return {
          name,
          path: gitWorktree.path,
          branch: gitWorktree.branch || "(detached HEAD)",
          isClean,
        };
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
