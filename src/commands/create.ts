import { access, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { exit } from "node:process";
import { addWorktree } from "../git/libs/add-worktree.ts";
import { getGitRoot } from "../git/libs/get-git-root.ts";
import { shellInWorktree } from "./shell.ts";

export async function createWorktree(name: string): Promise<{
  success: boolean;
  message: string;
  path?: string;
}> {
  if (!name) {
    return { success: false, message: "Error: worktree name required" };
  }

  try {
    const gitRoot = await getGitRoot();
    const worktreesPath = join(gitRoot, ".git", "phantom", "worktrees");
    const worktreePath = join(worktreesPath, name);

    try {
      await access(worktreesPath);
    } catch {
      await mkdir(worktreesPath, { recursive: true });
    }

    try {
      await access(worktreePath);
      return {
        success: false,
        message: `Error: worktree '${name}' already exists`,
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
      message: `Created worktree '${name}' at ${worktreePath}`,
      path: worktreePath,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      message: `Error creating worktree: ${errorMessage}`,
    };
  }
}

export async function createHandler(args: string[]): Promise<void> {
  const name = args[0];
  const openShell = args.includes("--shell");

  const result = await createWorktree(name);

  if (!result.success) {
    console.error(result.message);
    exit(1);
  }

  console.log(result.message);

  if (openShell && result.path) {
    console.log(`\nEntering worktree '${name}' at ${result.path}`);
    console.log("Type 'exit' to return to your original directory\n");

    const shellResult = await shellInWorktree(name);

    if (!shellResult.success) {
      if (shellResult.message) {
        console.error(shellResult.message);
      }
      exit(shellResult.exitCode ?? 1);
    }

    exit(shellResult.exitCode ?? 0);
  }
}
