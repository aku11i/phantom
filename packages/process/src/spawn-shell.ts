import { spawn } from "node:child_process";
import { ProcessSignalError, ProcessSpawnError } from "./errors.ts";

export async function spawnShell(
  command: string,
  args: string[],
  cwd: string,
  env: NodeJS.ProcessEnv,
): Promise<number> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env,
      stdio: "inherit",
      shell: true,
    });

    child.on("error", (error) => {
      reject(new ProcessSpawnError(command, error.message));
    });

    child.on("exit", (code, signal) => {
      if (signal) {
        reject(new ProcessSignalError(signal));
        return;
      }

      resolve(code ?? 0);
    });
  });
}
