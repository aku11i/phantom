import { exit } from "node:process";
import { createWorktree as coreCreateWorktree } from "../core/worktree/create.ts";
import { getGitRoot } from "../git/libs/get-git-root.ts";
import { shellInWorktree } from "./shell.ts";

// Backward compatibility wrapper for tests
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
    const result = await coreCreateWorktree(gitRoot, name);
    return {
      ...result,
      message: result.success ? result.message : `Error: ${result.message}`,
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

  if (!name) {
    console.error("Error: worktree name required");
    exit(1);
  }

  try {
    const gitRoot = await getGitRoot();
    const result = await coreCreateWorktree(gitRoot, name);

    if (!result.success) {
      console.error(`Error: ${result.message}`);
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
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error creating worktree: ${errorMessage}`);
    exit(1);
  }
}
