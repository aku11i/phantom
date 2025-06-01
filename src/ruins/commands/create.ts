import { access, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { exit } from "node:process";
import { addWorktree } from "../../git/libs/add-worktree.ts";
import { getGitRoot } from "../../git/libs/get-git-root.ts";

export async function createRuin(name: string): Promise<{
  success: boolean;
  message: string;
  path?: string;
}> {
  if (!name) {
    return { success: false, message: "Error: ruin name required" };
  }

  try {
    const gitRoot = await getGitRoot();
    const ruinsPath = join(gitRoot, ".git", "phantom", "ruins");
    const worktreePath = join(ruinsPath, name);

    try {
      await access(ruinsPath);
    } catch {
      await mkdir(ruinsPath, { recursive: true });
    }

    try {
      await access(worktreePath);
      return {
        success: false,
        message: `Error: ruin '${name}' already exists`,
      };
    } catch {
      // Path doesn't exist, which is what we want
    }

    await addWorktree({
      path: worktreePath,
      branch: `phantom/ruins/${name}`,
      commitish: "HEAD",
    });

    return {
      success: true,
      message: `Created ruin '${name}' at ${worktreePath}`,
      path: worktreePath,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, message: `Error creating ruin: ${errorMessage}` };
  }
}

export async function ruinsCreateHandler(args: string[]): Promise<void> {
  const name = args[0];
  const result = await createRuin(name);

  if (!result.success) {
    console.error(result.message);
    exit(1);
  }

  console.log(result.message);
}
