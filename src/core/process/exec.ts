import { execFile as execFileCallback, spawn } from "node:child_process";
import { promisify } from "node:util";
import { type Result, err, ok } from "../types/result.ts";
import { WorktreeNotFoundError } from "../worktree/errors.ts";
import { validateWorktreeExists } from "../worktree/validate.ts";
import {
  type ProcessError,
  ProcessExecutionError,
  ProcessSignalError,
} from "./errors.ts";
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
  onStdout?: (data: string) => void,
  onStderr?: (data: string) => void,
): Promise<
  Result<ExecWithOutputSuccess, WorktreeNotFoundError | ProcessError>
> {
  const validation = await validateWorktreeExists(gitRoot, worktreeName);
  if (!validation.exists) {
    return err(new WorktreeNotFoundError(worktreeName));
  }

  const worktreePath = validation.path as string;
  const [cmd, ...args] = command;

  return new Promise((resolve) => {
    const childProcess = spawn(cmd, args, {
      cwd: worktreePath,
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    childProcess.stdout?.on("data", (data: Buffer) => {
      const text = data.toString();
      stdout += text;
      if (onStdout) {
        onStdout(text);
      }
    });

    childProcess.stderr?.on("data", (data: Buffer) => {
      const text = data.toString();
      stderr += text;
      if (onStderr) {
        onStderr(text);
      }
    });

    childProcess.on("error", (error) => {
      resolve(err(new ProcessExecutionError(cmd, 1)));
    });

    childProcess.on("exit", (code, signal) => {
      if (signal) {
        resolve(err(new ProcessSignalError(signal)));
      } else {
        const exitCode = code ?? 0;
        resolve(
          ok({
            exitCode,
            stdout,
            stderr,
          }),
        );
      }
    });
  });
}
