import { validateWorktreeExists } from "../worktree/validate.ts";
import { type SpawnResult, spawnProcess } from "./spawn.ts";

export interface ShellInWorktreeResult extends SpawnResult {}

export async function shellInWorktree(
  gitRoot: string,
  worktreeName: string,
): Promise<ShellInWorktreeResult> {
  const validation = await validateWorktreeExists(gitRoot, worktreeName);
  if (!validation.exists) {
    return {
      success: false,
      message: validation.message || `Worktree '${worktreeName}' not found`,
    };
  }

  const worktreePath = validation.path as string;
  const shell = process.env.SHELL || "/bin/sh";

  return spawnProcess({
    command: shell,
    args: [],
    options: {
      cwd: worktreePath,
      env: {
        ...process.env,
        PHANTOM: "1",
        PHANTOM_NAME: worktreeName,
        PHANTOM_PATH: worktreePath,
      },
    },
  });
}
