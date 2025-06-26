import {
  type ProcessError,
  type SpawnSuccess,
  getPhantomEnv,
  spawnProcess,
} from "@aku11i/phantom-process";
import { type Result, err, isErr } from "@aku11i/phantom-shared";
import type { WorktreeNotFoundError } from "./worktree/errors.ts";
import { resolveWorktreeNameOrBranch } from "./worktree/resolve.ts";

export type ShellInWorktreeSuccess = SpawnSuccess;

export async function shellInWorktree(
  gitRoot: string,
  worktreeDirectory: string,
  worktreeName: string,
): Promise<
  Result<ShellInWorktreeSuccess, WorktreeNotFoundError | ProcessError>
> {
  const resolution = await resolveWorktreeNameOrBranch(
    gitRoot,
    worktreeDirectory,
    worktreeName,
  );
  if (isErr(resolution)) {
    return err(resolution.error);
  }

  const worktreePath = resolution.value.path;
  const shell = process.env.SHELL || "/bin/sh";

  return spawnProcess({
    command: shell,
    args: [],
    options: {
      cwd: worktreePath,
      env: {
        ...process.env,
        ...getPhantomEnv(resolution.value.name, worktreePath),
      },
    },
  });
}
