import { validateWorktreeExists } from "../worktree/validate.ts";
import { type SpawnResult, spawnProcess } from "./spawn.ts";

export interface ExecInWorktreeResult extends SpawnResult {}

export async function execInWorktree(
  gitRoot: string,
  worktreeName: string,
  command: string[],
): Promise<ExecInWorktreeResult> {
  const validation = await validateWorktreeExists(gitRoot, worktreeName);
  if (!validation.exists) {
    return {
      success: false,
      message: validation.message || `Worktree '${worktreeName}' not found`,
    };
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
