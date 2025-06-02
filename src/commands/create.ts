import { access, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { exit } from "node:process";
import { addWorktree } from "../git/libs/add-worktree.ts";
import { getGitRoot } from "../git/libs/get-git-root.ts";
import { shellInPhantom } from "./shell.ts";

export async function createPhantom(name: string): Promise<{
  success: boolean;
  message: string;
  path?: string;
}> {
  if (!name) {
    return { success: false, message: "Error: phantom name required" };
  }

  try {
    const gitRoot = await getGitRoot();
    const phantomsPath = join(gitRoot, ".git", "phantom", "worktrees");
    const worktreePath = join(phantomsPath, name);

    try {
      await access(phantomsPath);
    } catch {
      await mkdir(phantomsPath, { recursive: true });
    }

    try {
      await access(worktreePath);
      return {
        success: false,
        message: `Error: phantom '${name}' already exists`,
      };
    } catch {
      // Path doesn't exist, which is what we want
    }

    await addWorktree({
      path: worktreePath,
      branch: name,
      commitish: "HEAD",
    });

    return {
      success: true,
      message: `Created phantom '${name}' at ${worktreePath}`,
      path: worktreePath,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      message: `Error creating phantom: ${errorMessage}`,
    };
  }
}

export async function phantomsCreateHandler(args: string[]): Promise<void> {
  const name = args[0];
  const openShell = args.includes("--shell");

  const result = await createPhantom(name);

  if (!result.success) {
    console.error(result.message);
    exit(1);
  }

  console.log(result.message);

  if (openShell && result.path) {
    console.log(`\nEntering phantom '${name}' at ${result.path}`);
    console.log("Type 'exit' to return to your original directory\n");

    const shellResult = await shellInPhantom(name);

    if (!shellResult.success) {
      if (shellResult.message) {
        console.error(shellResult.message);
      }
      exit(shellResult.exitCode ?? 1);
    }

    exit(shellResult.exitCode ?? 0);
  }
}
