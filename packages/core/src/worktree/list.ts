import {
  executeGitCommandInDirectory,
  listWorktrees as gitListWorktrees,
} from "@aku11i/phantom-git";
import { type Result, ok } from "@aku11i/phantom-shared";
import { getWorktreePathFromDirectory } from "../paths.ts";

export interface WorktreeInfo {
  name: string;
  path: string;
  branch: string;
  isClean: boolean;
  type: "phantom" | "native";
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
  const worktreePath = getWorktreePathFromDirectory(worktreeDirectory, name);

  const [branch, isClean] = await Promise.all([
    getWorktreeBranch(worktreePath),
    getWorktreeStatus(worktreePath),
  ]);

  return {
    name,
    path: worktreePath,
    branch,
    isClean,
    type: "phantom",
  };
}

export async function listWorktrees(
  gitRoot: string,
  worktreeDirectory: string,
): Promise<Result<ListWorktreesSuccess, never>> {
  try {
    const gitWorktrees = await gitListWorktrees(gitRoot);

    const phantomWorktrees = gitWorktrees.filter((worktree) =>
      worktree.path.startsWith(worktreeDirectory),
    );

    const nativeWorktrees = gitWorktrees.filter(
      (worktree) =>
        !worktree.path.startsWith(worktreeDirectory) &&
        worktree.path !== gitRoot,
    );

    if (phantomWorktrees.length === 0 && nativeWorktrees.length === 0) {
      return ok({
        worktrees: [],
        message: "No worktrees found",
      });
    }

    const phantomWorktreeInfos = await Promise.all(
      phantomWorktrees.map(async (gitWorktree) => {
        const name = gitWorktree.path.substring(worktreeDirectory.length + 1);
        const isClean = await getWorktreeStatus(gitWorktree.path);

        return {
          name,
          path: gitWorktree.path,
          branch: gitWorktree.branch || "(detached HEAD)",
          isClean,
          type: "phantom" as const,
        };
      }),
    );

    const nativeWorktreeInfos = await Promise.all(
      nativeWorktrees.map(async (gitWorktree) => {
        const name = gitWorktree.path.split("/").pop() || gitWorktree.path;
        const isClean = await getWorktreeStatus(gitWorktree.path);

        return {
          name,
          path: gitWorktree.path,
          branch: gitWorktree.branch || "(detached HEAD)",
          isClean,
          type: "native" as const,
        };
      }),
    );

    const worktrees = [...phantomWorktreeInfos, ...nativeWorktreeInfos];

    return ok({
      worktrees,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to list worktrees: ${errorMessage}`);
  }
}
