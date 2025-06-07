import { execFile as execFileCallback } from "node:child_process";
import { promisify } from "node:util";
import { type Result, err, ok } from "../types/result.ts";
import { WorktreeNotFoundError } from "../worktree/errors.ts";
import { validateWorktreeExists } from "../worktree/validate.ts";
import { type ProcessError, ProcessExecutionError } from "./errors.ts";
import { type SpawnSuccess, spawnProcess } from "./spawn.ts";

const execFile = promisify(execFileCallback);

export type ExecInWorktreeSuccess = SpawnSuccess;

export interface ExecWithOutputSuccess {
  exitCode: number;
  stdout: string;
  stderr: string;
}

export async function execInWorktree(
  gitRoot: string,
  worktreeName: string,
  command: string[],
): Promise<
  Result<ExecInWorktreeSuccess, WorktreeNotFoundError | ProcessError>
> {
  const validation = await validateWorktreeExists(gitRoot, worktreeName);
  if (!validation.exists) {
    return err(new WorktreeNotFoundError(worktreeName));
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

export async function execInWorktreeWithOutput(
  gitRoot: string,
  worktreeName: string,
  command: string[],
): Promise<
  Result<ExecWithOutputSuccess, WorktreeNotFoundError | ProcessError>
> {
  const validation = await validateWorktreeExists(gitRoot, worktreeName);
  if (!validation.exists) {
    return err(new WorktreeNotFoundError(worktreeName));
  }

  const worktreePath = validation.path as string;
  const [cmd, ...args] = command;

  try {
    const result = await execFile(cmd, args, {
      cwd: worktreePath,
      encoding: "utf8",
    });

    return ok({
      exitCode: 0,
      stdout: result.stdout,
      stderr: result.stderr,
    });
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "stdout" in error &&
      "stderr" in error &&
      "code" in error
    ) {
      const execError = error as {
        stdout: string;
        stderr: string;
        code?: number;
      };

      return ok({
        exitCode: execError.code ?? 1,
        stdout: execError.stdout || "",
        stderr: execError.stderr || "",
      });
    }

    return err(new ProcessExecutionError(cmd, 1));
  }
}
