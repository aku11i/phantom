import { exit } from "node:process";
import { deleteWorktree as coreDeleteWorktree } from "../core/worktree/delete.ts";
import { getGitRoot } from "../git/libs/get-git-root.ts";

// Backward compatibility wrapper for tests
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

  try {
    const gitRoot = await getGitRoot();
    const result = await coreDeleteWorktree(gitRoot, name, options);
    return {
      ...result,
      message: result.success ? result.message : `Error: ${result.message}`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    // Check if this is a failed removal error
    if (errorMessage.includes("Failed to remove worktree")) {
      return {
        success: false,
        message: `Error: Failed to remove worktree '${name}'`,
      };
    }
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

  if (!name) {
    console.error("Error: worktree name required");
    exit(1);
  }

  try {
    const gitRoot = await getGitRoot();
    const result = await coreDeleteWorktree(gitRoot, name, { force });

    if (!result.success) {
      console.error(`Error: ${result.message}`);
      exit(1);
    }

    console.log(result.message);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error deleting worktree: ${errorMessage}`);
    exit(1);
  }
}
