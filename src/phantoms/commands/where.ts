import { access } from "node:fs/promises";
import { join } from "node:path";
import { exit } from "node:process";
import { getGitRoot } from "../../git/libs/get-git-root.ts";

export async function wherePhantom(name: string): Promise<{
  success: boolean;
  message?: string;
  path?: string;
}> {
  if (!name) {
    return { success: false, message: "Error: phantom name required" };
  }

  try {
    const gitRoot = await getGitRoot();
    const phantomsPath = join(gitRoot, ".git", "phantom", "worktrees");
    const phantomPath = join(phantomsPath, name);

    // Check if phantom exists
    try {
      await access(phantomPath);
    } catch {
      return {
        success: false,
        message: `Error: Phantom '${name}' does not exist`,
      };
    }

    return {
      success: true,
      path: phantomPath,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      message: `Error locating phantom: ${errorMessage}`,
    };
  }
}

export async function phantomsWhereHandler(args: string[]): Promise<void> {
  const name = args[0];
  const result = await wherePhantom(name);

  if (!result.success) {
    console.error(result.message);
    exit(1);
  }

  console.log(result.path);
}
