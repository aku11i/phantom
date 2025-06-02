import childProcess from "node:child_process";
import { promisify } from "node:util";
import { getWorktreePath } from "../paths.ts";
import {
  listValidWorktrees,
  validatePhantomDirectoryExists,
} from "./validate.ts";

const execAsync = promisify(childProcess.exec);

export interface WorktreeInfo {
  name: string;
  branch: string;
  status: "clean" | "dirty";
  changedFiles?: number;
}

export interface ListWorktreesResult {
  success: boolean;
  worktrees: WorktreeInfo[];
  message?: string;
}

export async function getWorktreeBranch(worktreePath: string): Promise<string> {
  try {
    const { stdout } = await execAsync("git branch --show-current", {
      cwd: worktreePath,
    });
    return stdout.trim() || "detached HEAD";
  } catch {
    return "unknown";
  }
}

export async function getWorktreeStatus(
  worktreePath: string,
): Promise<{ status: "clean" | "dirty"; changedFiles?: number }> {
  try {
    const { stdout } = await execAsync("git status --porcelain", {
      cwd: worktreePath,
    });
    const changes = stdout.trim();
    if (changes) {
      return {
        status: "dirty",
        changedFiles: changes.split("\n").length,
      };
    }
  } catch {
    // If git status fails, assume clean
  }
  return { status: "clean" };
}

export async function getWorktreeInfo(
  gitRoot: string,
  name: string,
): Promise<WorktreeInfo> {
  const worktreePath = getWorktreePath(gitRoot, name);

  const [branch, statusInfo] = await Promise.all([
    getWorktreeBranch(worktreePath),
    getWorktreeStatus(worktreePath),
  ]);

  return {
    name,
    branch,
    ...statusInfo,
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
