import type { StdioOptions } from "node:child_process";
import {
  type ProcessError,
  type SpawnSuccess,
  spawnProcess,
} from "@aku11i/phantom-process";
import { type Result, err, isErr } from "@aku11i/phantom-shared";
import type { WorktreeNotFoundError } from "./worktree/errors.ts";
import { resolveWorktreeNameOrBranch } from "./worktree/resolve.ts";

export type ExecInWorktreeSuccess = SpawnSuccess;

export interface ExecInWorktreeOptions {
  interactive?: boolean;
}

export async function execInWorktree(
  gitRoot: string,
  worktreeDirectory: string,
  worktreeName: string,
  command: string[],
  options?: ExecInWorktreeOptions,
): Promise<
  Result<ExecInWorktreeSuccess, WorktreeNotFoundError | ProcessError>
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
  const [cmd, ...args] = command;

  const stdio: StdioOptions = options?.interactive
    ? "inherit"
    : ["ignore", "inherit", "inherit"];

  return spawnProcess({
    command: cmd,
    args,
    options: {
      cwd: worktreePath,
      stdio,
    },
  });
}
