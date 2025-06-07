import type { StdioOptions } from "node:child_process";
import { type Result, err } from "../types/result.ts";
import { WorktreeNotFoundError } from "../worktree/errors.ts";
import { validateWorktreeExists } from "../worktree/validate.ts";
import type { ProcessError } from "./errors.ts";
import { type SpawnSuccess, spawnProcess } from "./spawn.ts";

export type ExecInWorktreeSuccess = SpawnSuccess;

export interface ExecInWorktreeOptions {
  stdio?: "inherit" | "pipe";
}

export async function execInWorktree(
  gitRoot: string,
  worktreeName: string,
  command: string[],
  options: ExecInWorktreeOptions = {},
): Promise<
  Result<ExecInWorktreeSuccess, WorktreeNotFoundError | ProcessError>
> {
  const validation = await validateWorktreeExists(gitRoot, worktreeName);
  if (!validation.exists) {
    return err(new WorktreeNotFoundError(worktreeName));
  }

  const worktreePath = validation.path as string;
  const [cmd, ...args] = command;

  const stdio: StdioOptions =
    options.stdio === "pipe" ? ["ignore", "pipe", "pipe"] : "inherit";

  return spawnProcess({
    command: cmd,
    args,
    options: {
      cwd: worktreePath,
      stdio,
    },
  });
}
