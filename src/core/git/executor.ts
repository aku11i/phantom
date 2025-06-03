import { execFile as execFileCallback } from "node:child_process";
import { promisify } from "node:util";

const execFile = promisify(execFileCallback);

export interface GitExecutorOptions {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
}

export interface GitExecutorResult {
  stdout: string;
  stderr: string;
}

/**
 * Execute a git command with consistent error handling
 */
export async function executeGitCommand(
  args: string[],
  options: GitExecutorOptions = {},
): Promise<GitExecutorResult> {
  try {
    const result = await execFile("git", args, {
      cwd: options.cwd,
      env: options.env || process.env,
      encoding: "utf8",
    });

    return {
      stdout: result.stdout.trim(),
      stderr: result.stderr.trim(),
    };
  } catch (error) {
    // Git commands often return non-zero exit codes for normal operations
    // (e.g., `git diff` returns 1 when there are differences)
    // So we need to handle errors carefully
    if (
      error &&
      typeof error === "object" &&
      "stdout" in error &&
      "stderr" in error
    ) {
      const execError = error as {
        stdout: string;
        stderr: string;
        code?: number;
      };

      // If we have stderr content, it's likely a real error
      if (execError.stderr?.trim()) {
        throw new Error(execError.stderr.trim());
      }

      // Otherwise, return the output even though the exit code was non-zero
      return {
        stdout: execError.stdout?.trim() || "",
        stderr: execError.stderr?.trim() || "",
      };
    }

    throw error;
  }
}

/**
 * Execute a git command in a specific directory
 */
export async function executeGitCommandInDirectory(
  directory: string,
  args: string[],
): Promise<GitExecutorResult> {
  return executeGitCommand(["-C", directory, ...args], {});
}
