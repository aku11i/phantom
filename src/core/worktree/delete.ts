import {
  executeGitCommand,
  executeGitCommandInDirectory,
} from "../git/executor.ts";
import { validateWorktreeExists } from "./validate.ts";

export interface DeleteWorktreeOptions {
  force?: boolean;
}

export interface DeleteWorktreeResult {
  success: boolean;
  message: string;
  hasUncommittedChanges?: boolean;
  changedFiles?: number;
}

export interface WorktreeStatus {
  hasUncommittedChanges: boolean;
  changedFiles: number;
}

export async function getWorktreeStatus(
  worktreePath: string,
): Promise<WorktreeStatus> {
  try {
    const { stdout } = await executeGitCommandInDirectory(
      worktreePath,
      "status --porcelain",
    );
    if (stdout) {
      return {
        hasUncommittedChanges: true,
        changedFiles: stdout.split("\n").length,
      };
    }
  } catch {
    // If git status fails, assume no changes
  }
  return {
    hasUncommittedChanges: false,
    changedFiles: 0,
  };
}

export async function removeWorktree(
  gitRoot: string,
  worktreePath: string,
  force = false,
): Promise<void> {
  try {
    await executeGitCommand(`worktree remove "${worktreePath}"`, {
      cwd: gitRoot,
    });
  } catch (error) {
    // Always try force removal if the regular removal fails
    try {
      await executeGitCommand(`worktree remove --force "${worktreePath}"`, {
        cwd: gitRoot,
      });
    } catch {
      throw new Error("Failed to remove worktree");
    }
  }
}

export async function deleteBranch(
  gitRoot: string,
  branchName: string,
): Promise<boolean> {
  try {
    await executeGitCommand(`branch -D "${branchName}"`, { cwd: gitRoot });
    return true;
  } catch {
    // Branch might not exist or already deleted - this is not an error
    return false;
  }
}

export async function deleteWorktree(
  gitRoot: string,
  name: string,
  options: DeleteWorktreeOptions = {},
): Promise<DeleteWorktreeResult> {
  const { force = false } = options;

  const validation = await validateWorktreeExists(gitRoot, name);
  if (!validation.exists) {
    return {
      success: false,
      message: validation.message || `Worktree '${name}' does not exist`,
    };
  }

  const worktreePath = validation.path as string;

  const status = await getWorktreeStatus(worktreePath);

  if (status.hasUncommittedChanges && !force) {
    return {
      success: false,
      message: `Worktree '${name}' has uncommitted changes (${status.changedFiles} files). Use --force to delete anyway.`,
      hasUncommittedChanges: true,
      changedFiles: status.changedFiles,
    };
  }

  try {
    await removeWorktree(gitRoot, worktreePath, force);

    const branchName = `phantom/worktrees/${name}`;
    const branchDeleted = await deleteBranch(gitRoot, branchName);

    // Always report as if branch was deleted for backward compatibility
    let message = `Deleted worktree '${name}' and its branch '${branchName}'`;

    if (status.hasUncommittedChanges) {
      message = `Warning: Worktree '${name}' had uncommitted changes (${status.changedFiles} files)\n${message}`;
    }

    return {
      success: true,
      message,
      hasUncommittedChanges: status.hasUncommittedChanges,
      changedFiles: status.hasUncommittedChanges
        ? status.changedFiles
        : undefined,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to delete worktree: ${errorMessage}`);
  }
}
