import {
  executeGitCommand,
  executeGitCommandInDirectory,
} from "../git/executor.ts";
import { type Result, err, isErr, isOk, ok } from "../types/result.ts";
import {
  GitOperationError,
  WorktreeError,
  type WorktreeNotFoundError,
} from "./errors.ts";
import { validateWorktreeExists } from "./validate.ts";

export interface DeleteWorktreeOptions {
  force?: boolean;
}

export interface DeleteWorktreeSuccess {
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
    const { stdout } = await executeGitCommandInDirectory(worktreePath, [
      "status",
      "--porcelain",
    ]);
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
    await executeGitCommand(["worktree", "remove", worktreePath], {
      cwd: gitRoot,
    });
  } catch (error) {
    // Always try force removal if the regular removal fails
    try {
      await executeGitCommand(["worktree", "remove", "--force", worktreePath], {
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
): Promise<Result<boolean, GitOperationError>> {
  try {
    await executeGitCommand(["branch", "-D", branchName], { cwd: gitRoot });
    return ok(true);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return err(new GitOperationError("branch delete", errorMessage));
  }
}

export async function deleteWorktree(
  gitRoot: string,
  name: string,
  options: DeleteWorktreeOptions = {},
): Promise<
  Result<
    DeleteWorktreeSuccess,
    WorktreeNotFoundError | WorktreeError | GitOperationError
  >
> {
  const { force = false } = options;

  const validation = await validateWorktreeExists(gitRoot, name);
  if (isErr(validation)) {
    return err(validation.error);
  }

  const worktreePath = validation.value.path;

  const status = await getWorktreeStatus(worktreePath);

  if (status.hasUncommittedChanges && !force) {
    return err(
      new WorktreeError(
        `Worktree '${name}' has uncommitted changes (${status.changedFiles} files). Use --force to delete anyway.`,
      ),
    );
  }

  try {
    await removeWorktree(gitRoot, worktreePath, force);

    const branchName = name;
    const branchResult = await deleteBranch(gitRoot, branchName);

    let message: string;
    if (isOk(branchResult)) {
      message = `Deleted worktree '${name}' and its branch '${branchName}'`;
    } else {
      message = `Deleted worktree '${name}'`;
      message += `\nNote: Branch '${branchName}' could not be deleted: ${branchResult.error.message}`;
    }

    if (status.hasUncommittedChanges) {
      message = `Warning: Worktree '${name}' had uncommitted changes (${status.changedFiles} files)\n${message}`;
    }

    return ok({
      message,
      hasUncommittedChanges: status.hasUncommittedChanges,
      changedFiles: status.hasUncommittedChanges
        ? status.changedFiles
        : undefined,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return err(new GitOperationError("worktree remove", errorMessage));
  }
}
