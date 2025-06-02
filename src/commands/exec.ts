import { exit } from "node:process";
import { type SpawnResult, spawnProcess } from "../core/process/spawn.ts";
import { validateWorktreeExists } from "../core/worktree/validate.ts";
import { getGitRoot } from "../git/libs/get-git-root.ts";

export async function execInWorktree(
  worktreeName: string,
  command: string[],
): Promise<SpawnResult> {
  if (!worktreeName) {
    return { success: false, message: "Error: worktree name required" };
  }

  if (!command || command.length === 0) {
    return { success: false, message: "Error: command required" };
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
  const [cmd, ...args] = command;

  return spawnProcess({
    command: cmd,
    args,
    options: {
      cwd: worktreePath,
    },
  });
}

export async function execHandler(args: string[]): Promise<void> {
  if (args.length < 2) {
    console.error("Usage: phantom exec <worktree-name> <command> [args...]");
    exit(1);
  }

  const worktreeName = args[0];
  const command = args.slice(1);

  const result = await execInWorktree(worktreeName, command);

  if (!result.success) {
    if (result.message) {
      console.error(result.message);
    }
    exit(result.exitCode ?? 1);
  }

  // For successful commands, exit with the same code as the child process
  exit(result.exitCode ?? 0);
}
