import { exec } from "node:child_process";
import { access } from "node:fs/promises";
import { join } from "node:path";
import { exit } from "node:process";
import { promisify } from "node:util";
import { getGitRoot } from "../../git/libs/get-git-root.ts";

const execAsync = promisify(exec);

export async function deleteRuin(name: string): Promise<{
  success: boolean;
  message: string;
  hasUncommittedChanges?: boolean;
  changedFiles?: number;
}> {
  if (!name) {
    return { success: false, message: "Error: ruin name required" };
  }

  try {
    const gitRoot = await getGitRoot();
    const ruinsPath = join(gitRoot, ".git", "phantom", "ruins");
    const ruinPath = join(ruinsPath, name);

    // Check if ruin exists
    try {
      await access(ruinPath);
    } catch {
      return {
        success: false,
        message: `Error: Ruin '${name}' does not exist`,
      };
    }

    // Check for uncommitted changes
    let hasUncommittedChanges = false;
    let changedFiles = 0;
    try {
      const { stdout } = await execAsync("git status --porcelain", {
        cwd: ruinPath,
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

    // Remove git worktree
    try {
      await execAsync(`git worktree remove "${ruinPath}"`, {
        cwd: gitRoot,
      });
    } catch (error) {
      // If worktree remove fails, try force removal
      try {
        await execAsync(`git worktree remove --force "${ruinPath}"`, {
          cwd: gitRoot,
        });
      } catch {
        return {
          success: false,
          message: `Error: Failed to remove worktree for ruin '${name}'`,
        };
      }
    }

    // Delete associated branch
    const branchName = `phantom/ruins/${name}`;
    try {
      await execAsync(`git branch -D "${branchName}"`, {
        cwd: gitRoot,
      });
    } catch {
      // Branch might not exist or already deleted - this is not an error
      // We'll still report success for the worktree removal
    }

    let message = `Deleted ruin '${name}'`;
    if (hasUncommittedChanges) {
      message = `Warning: Ruin '${name}' had uncommitted changes (${changedFiles} files)\n${message}`;
    }
    message += ` and its branch '${branchName}'`;

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
      message: `Error deleting ruin: ${errorMessage}`,
    };
  }
}

export async function ruinsDeleteHandler(args: string[]): Promise<void> {
  const name = args[0];
  const result = await deleteRuin(name);

  if (!result.success) {
    console.error(result.message);
    exit(1);
  }

  console.log(result.message);
}
