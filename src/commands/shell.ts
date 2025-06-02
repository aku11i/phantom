import { exit } from "node:process";
import { type SpawnResult, spawnProcess } from "../core/process/spawn.ts";
import { validateWorktreeExists } from "../core/worktree/validate.ts";
import { getGitRoot } from "../git/libs/get-git-root.ts";

export async function shellInWorktree(
  worktreeName: string,
): Promise<SpawnResult> {
  if (!worktreeName) {
    return { success: false, message: "Error: worktree name required" };
  }

  // Get git root
  let gitRoot: string;
  try {
    gitRoot = await getGitRoot();
  } catch (error) {
    return {
      success: false,
      message: `Error: ${error instanceof Error ? error.message : "Failed to get git root"}`,
    };
  }

  // Validate worktree exists and get its path
  const validation = await validateWorktreeExists(gitRoot, worktreeName);
  if (!validation.exists) {
    return { success: false, message: `Error: ${validation.message}` };
  }

  const worktreePath = validation.path as string;
  // Use user's preferred shell or fallback to /bin/sh
  const shell = process.env.SHELL || "/bin/sh";

  return spawnProcess({
    command: shell,
    args: [],
    options: {
      cwd: worktreePath,
      env: {
        ...process.env,
        // Add environment variable to indicate we're in a worktree
        PHANTOM: "1",
        PHANTOM_NAME: worktreeName,
        PHANTOM_PATH: worktreePath,
      },
    },
  });
}

export async function shellHandler(args: string[]): Promise<void> {
  if (args.length < 1) {
    console.error("Usage: phantom shell <worktree-name>");
    exit(1);
  }

  const worktreeName = args[0];

  // Get git root
  let gitRoot: string;
  try {
    gitRoot = await getGitRoot();
  } catch (error) {
    console.error(
      `Error: ${error instanceof Error ? error.message : "Failed to get git root"}`,
    );
    exit(1);
  }

  // Get worktree path for display
  const validation = await validateWorktreeExists(gitRoot, worktreeName);
  if (!validation.exists) {
    console.error(`Error: ${validation.message}`);
    exit(1);
  }

  // Display entering message
  console.log(`Entering worktree '${worktreeName}' at ${validation.path}`);
  console.log("Type 'exit' to return to your original directory\n");

  const result = await shellInWorktree(worktreeName);

  if (!result.success) {
    if (result.message) {
      console.error(result.message);
    }
    exit(result.exitCode ?? 1);
  }

  // Exit with the same code as the shell
  exit(result.exitCode ?? 0);
}
