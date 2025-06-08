import { type Result, err } from "../types/result.ts";
import { WorktreeNotFoundError } from "../worktree/errors.ts";
import { validateWorktreeExists } from "../worktree/validate.ts";
import { getPhantomEnv } from "./env.ts";
import type { ProcessError } from "./errors.ts";
import { type SpawnSuccess, spawnProcess } from "./spawn.ts";

export type ShellInWorktreeSuccess = SpawnSuccess;

export async function shellInWorktree(
  gitRoot: string,
  worktreeName: string,
): Promise<
  Result<ShellInWorktreeSuccess, WorktreeNotFoundError | ProcessError>
> {
  const validation = await validateWorktreeExists(gitRoot, worktreeName);
  if (!validation.exists) {
    return err(new WorktreeNotFoundError(worktreeName));
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
        ...getPhantomEnv(worktreeName, worktreePath),
      },
    },
  });
}
