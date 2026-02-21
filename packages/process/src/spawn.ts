import {
  type ChildProcess,
  spawn as nodeSpawn,
  type SpawnOptions,
  type SpawnSyncOptions,
  spawnSync,
} from "node:child_process";
import { err, ok, type Result } from "@aku11i/phantom-shared";
import {
  type ProcessError,
  ProcessExecutionError,
  ProcessSignalError,
  ProcessSpawnError,
} from "./errors.ts";
import { resolveWindowsCommandPath } from "./resolve-windows-command-path.ts";

export interface SpawnSuccess {
  exitCode: number;
}

export interface SpawnConfig {
  command: string;
  args?: string[];
  options?: SpawnOptions;
}

export interface SpawnSyncConfig {
  command: string;
  args?: string[];
  options?: SpawnSyncOptions;
}

export async function spawnProcess(
  config: SpawnConfig,
): Promise<Result<SpawnSuccess, ProcessError>> {
  return new Promise((resolve) => {
    const { command, args = [], options = {} } = config;
    const file =
      process.platform === "win32"
        ? resolveWindowsCommandPath(command)
        : command;

    const childProcess: ChildProcess = nodeSpawn(file, args, {
      stdio: "inherit",
      ...options,
    });

    childProcess.on("error", (error) => {
      resolve(err(new ProcessSpawnError(file, error.message)));
    });

    childProcess.on("exit", (code, signal) => {
      if (signal) {
        resolve(err(new ProcessSignalError(signal)));
      } else {
        const exitCode = code ?? 0;
        if (exitCode === 0) {
          resolve(ok({ exitCode }));
        } else {
          resolve(err(new ProcessExecutionError(file, exitCode)));
        }
      }
    });
  });
}

/**
 * Spawn a process synchronously - better for interactive TUI applications
 * that need direct control of stdin/stdout/stderr
 */
export function spawnProcessSync(
  config: SpawnSyncConfig,
): Result<SpawnSuccess, ProcessError> {
  const { command, args = [], options = {} } = config;
  const file =
    process.platform === "win32" ? resolveWindowsCommandPath(command) : command;

  try {
    const result = spawnSync(file, args, {
      stdio: "inherit",
      ...options,
    });

    if (result.error) {
      return err(new ProcessSpawnError(file, result.error.message));
    }

    if (result.signal) {
      return err(new ProcessSignalError(result.signal));
    }

    const exitCode = result.status ?? 0;
    if (exitCode === 0) {
      return ok({ exitCode });
    }
    return err(new ProcessExecutionError(file, exitCode));
  } catch (error) {
    return err(
      new ProcessSpawnError(
        file,
        error instanceof Error ? error.message : String(error),
      ),
    );
  }
}
