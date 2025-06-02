import { exit } from "node:process";
import { validateWorktreeExists } from "../core/worktree/validate.ts";
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

    // Check if worktree exists
    const validation = await validateWorktreeExists(gitRoot, name);
    if (!validation.exists) {
      return {
        success: false,
        message: `Error: ${validation.message}`,
      };
    }

    return {
      success: true,
      path: validation.path,
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
