import {
  type ProcessError,
  type SpawnSuccess,
  getPhantomEnv,
  spawnProcess,
} from "@aku11i/phantom-process";
import { type Result, err, isErr } from "@aku11i/phantom-shared";
import type { WorktreeNotFoundError } from "./worktree/errors.ts";
import { validateWorktreeExists } from "./worktree/validate.ts";

export type ShellInWorktreeSuccess = SpawnSuccess;

export async function shellInWorktree(
  gitRoot: string,
  worktreeName: string,
): Promise<
  Result<ShellInWorktreeSuccess, WorktreeNotFoundError | ProcessError>
> {
  const validation = await validateWorktreeExists(gitRoot, worktreeName);
  if (isErr(validation)) {
    return err(validation.error);
  }

  const worktreePath = validation.value.path;
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
