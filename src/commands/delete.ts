import childProcess from "node:child_process";
import { exit } from "node:process";
import { promisify } from "node:util";
import { getWorktreePath } from "../core/paths.ts";
import { validateWorktreeExists } from "../core/worktree/validate.ts";
import { getGitRoot } from "../git/libs/get-git-root.ts";

const execAsync = promisify(childProcess.exec);

export async function deleteWorktree(
  name: string,
  options: { force?: boolean } = {},
): Promise<{
  success: boolean;
  message: string;
  hasUncommittedChanges?: boolean;
  changedFiles?: number;
}> {
  if (!name) {
    return { success: false, message: "Error: worktree name required" };
  }

  const { force = false } = options;

  try {
    const gitRoot = await getGitRoot();

    // Check if worktree exists
    const validation = await validateWorktreeExists(gitRoot, name);
    if (!validation.exists) {
      return {
        success: false,
        message: `Error: ${validation.message}`,
      };
    }

    const worktreePath = validation.path as string;

    // Check for uncommitted changes
    let hasUncommittedChanges = false;
    let changedFiles = 0;
    try {
      const { stdout } = await execAsync("git status --porcelain", {
        cwd: worktreePath,
      });
      const changes = stdout.trim();
      if (changes) {
        hasUncommittedChanges = true;
        changedFiles = changes.split("\n").length;
      }
    } catch {
      // If git status fails, assume no changes
      hasUncommittedChanges = false;
    }

    // If worktree has uncommitted changes and --force is not specified, refuse deletion
    if (hasUncommittedChanges && !force) {
      return {
        success: false,
        message: `Error: Worktree '${name}' has uncommitted changes (${changedFiles} files). Use --force to delete anyway.`,
        hasUncommittedChanges: true,
        changedFiles,
      };
    }

    // Remove git worktree
    try {
      await execAsync(`git worktree remove "${worktreePath}"`, {
        cwd: gitRoot,
      });
    } catch (error) {
      // If worktree remove fails, try force removal
      try {
        await execAsync(`git worktree remove --force "${worktreePath}"`, {
          cwd: gitRoot,
        });
      } catch {
        return {
          success: false,
          message: `Error: Failed to remove worktree '${name}'`,
        };
      }
    }

    // Delete associated branch
    const branchName = `phantom/worktrees/${name}`;
    try {
      await execAsync(`git branch -D "${branchName}"`, {
        cwd: gitRoot,
      });
    } catch {
      // Branch might not exist or already deleted - this is not an error
      // We'll still report success for the worktree removal
    }

    let message = `Deleted worktree '${name}' and its branch '${branchName}'`;
    if (hasUncommittedChanges) {
      message = `Warning: Worktree '${name}' had uncommitted changes (${changedFiles} files)\n${message}`;
    }

    return {
      success: true,
      message,
      hasUncommittedChanges,
      changedFiles: hasUncommittedChanges ? changedFiles : undefined,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      message: `Error deleting worktree: ${errorMessage}`,
    };
  }
}

export async function deleteHandler(args: string[]): Promise<void> {
  // Parse arguments for --force flag
  const forceIndex = args.indexOf("--force");
  const force = forceIndex !== -1;

  // Remove --force from args to get the worktree name
  const filteredArgs = args.filter((arg) => arg !== "--force");
  const name = filteredArgs[0];

  const result = await deleteWorktree(name, { force });

  if (!result.success) {
    console.error(result.message);
    exit(1);
  }

  console.log(result.message);
}
