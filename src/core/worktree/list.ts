import { executeGitCommandInDirectory } from "../git/executor.ts";
import { getWorktreePath } from "../paths.ts";
import { type Result, ok } from "../types/result.ts";
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

export interface ListWorktreesSuccess {
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
): Promise<Result<ListWorktreesSuccess, never>> {
  if (!(await validatePhantomDirectoryExists(gitRoot))) {
    return ok({
      worktrees: [],
      message: "No worktrees found (worktrees directory doesn't exist)",
    });
  }

  const worktreeNames = await listValidWorktrees(gitRoot);

  if (worktreeNames.length === 0) {
    return ok({
      worktrees: [],
      message: "No worktrees found",
    });
  }

  try {
    const worktrees = await Promise.all(
      worktreeNames.map((name) => getWorktreeInfo(gitRoot, name)),
    );

    return ok({
      worktrees,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to list worktrees: ${errorMessage}`);
  }
}
