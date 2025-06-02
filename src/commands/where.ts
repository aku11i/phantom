import { access } from "node:fs/promises";
import { join } from "node:path";
import { exit } from "node:process";
import { getGitRoot } from "../git/libs/get-git-root.ts";

export async function whereWorktree(name: string): Promise<{
  success: boolean;
  message?: string;
  path?: string;
}> {
  if (!name) {
    return { success: false, message: "Error: worktree name required" };
  }

  try {
    const gitRoot = await getGitRoot();
    const worktreesPath = join(gitRoot, ".git", "phantom", "worktrees");
    const worktreePath = join(worktreesPath, name);

    // Check if worktree exists
    try {
      await access(worktreePath);
    } catch {
      return {
        success: false,
        message: `Error: Worktree '${name}' does not exist`,
      };
    }

    return {
      success: true,
      path: worktreePath,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      message: `Error locating worktree: ${errorMessage}`,
    };
  }
}

export async function whereHandler(args: string[]): Promise<void> {
  const name = args[0];
  const result = await whereWorktree(name);

  if (!result.success) {
    console.error(result.message);
    exit(1);
  }

  console.log(result.path);
}
