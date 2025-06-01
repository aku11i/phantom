import { access } from "node:fs/promises";
import { join } from "node:path";
import { exit } from "node:process";
import { getGitRoot } from "../../git/libs/get-git-root.ts";

export async function whereRuin(name: string): Promise<{
  success: boolean;
  message?: string;
  path?: string;
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

    return {
      success: true,
      path: ruinPath,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      message: `Error locating ruin: ${errorMessage}`,
    };
  }
}

export async function ruinsWhereHandler(args: string[]): Promise<void> {
  const name = args[0];
  const result = await whereRuin(name);

  if (!result.success) {
    console.error(result.message);
    exit(1);
  }

  console.log(result.path);
}
