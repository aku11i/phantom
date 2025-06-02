import {
  type ChildProcess,
  type SpawnOptions,
  spawn as nodeSpawn,
} from "node:child_process";

export interface SpawnResult {
  success: boolean;
  message?: string;
  exitCode?: number;
}

export interface SpawnConfig {
  command: string;
  args?: string[];
  options?: SpawnOptions;
}

export async function spawnProcess(config: SpawnConfig): Promise<SpawnResult> {
  return new Promise((resolve) => {
    const { command, args = [], options = {} } = config;

    const childProcess: ChildProcess = nodeSpawn(command, args, {
      stdio: "inherit",
      ...options,
    });

    childProcess.on("error", (error) => {
      resolve({
        success: false,
        message: `Error executing command: ${error.message}`,
      });
    });

    childProcess.on("exit", (code, signal) => {
      if (signal) {
        resolve({
          success: false,
          message: `Command terminated by signal: ${signal}`,
          exitCode: 128 + (signal === "SIGTERM" ? 15 : 1),
        });
      } else {
        const exitCode = code ?? 0;
        resolve({
          success: exitCode === 0,
          exitCode,
        });
      }
    });
  });
}
