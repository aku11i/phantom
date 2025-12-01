import { spawn } from "node:child_process";
import { ProcessSignalError, ProcessSpawnError } from "./errors.ts";

function shellEscape(arg: string): string {
  if (/^[a-zA-Z0-9_@%+=:,./-]*$/.test(arg)) {
    return arg;
  }

  return `'${arg.replace(/'/g, `'\\''`)}'`;
}

export async function spawnShell(
  command: string,
  args: string[],
  cwd: string,
  env: NodeJS.ProcessEnv,
): Promise<number> {
  return new Promise((resolve, reject) => {
    const commandLine = [command, ...args.map((arg) => shellEscape(arg))].join(
      " ",
    );

    const child = spawn(commandLine, [], {
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
