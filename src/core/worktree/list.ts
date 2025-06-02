import { executeGitCommandInDirectory } from "../git/executor.ts";
import { getWorktreePath } from "../paths.ts";
import {
  listValidWorktrees,
  validatePhantomDirectoryExists,
} from "./validate.ts";

export interface WorktreeInfo {
  name: string;
  path: string;
  branch: string;
  isClean: boolean;
}

export interface ListWorktreesResult {
  success: boolean;
  worktrees: WorktreeInfo[];
  message?: string;
}

export async function getWorktreeBranch(worktreePath: string): Promise<string> {
  try {
    const { stdout } = await executeGitCommandInDirectory(
      worktreePath,
      "branch --show-current",
    );
    return stdout || "(detached HEAD)";
  } catch {
    return "unknown";
  }
}

export async function getWorktreeStatus(
  worktreePath: string,
): Promise<boolean> {
  try {
    const { stdout } = await executeGitCommandInDirectory(
      worktreePath,
      "status --porcelain",
    );
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
): Promise<ListWorktreesResult> {
  if (!(await validatePhantomDirectoryExists(gitRoot))) {
    return {
      success: true,
      worktrees: [],
      message: "No worktrees found (worktrees directory doesn't exist)",
    };
  }

  const worktreeNames = await listValidWorktrees(gitRoot);

  if (worktreeNames.length === 0) {
    return {
      success: true,
      worktrees: [],
      message: "No worktrees found",
    };
  }

  try {
    const worktrees = await Promise.all(
      worktreeNames.map((name) => getWorktreeInfo(gitRoot, name)),
    );

    return {
      success: true,
      worktrees,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to list worktrees: ${errorMessage}`);
  }
}
