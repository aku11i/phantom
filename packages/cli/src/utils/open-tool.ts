import { spawn } from "node:child_process";

export async function openToolInWorktree(
  command: string,
  args: string[],
  cwd: string,
  env: NodeJS.ProcessEnv,
): Promise<number> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      // shell:true keeps commands with flags (e.g., "code --wait") working.
      cwd,
      env,
      stdio: "inherit",
      shell: true,
    });

    child.on("error", (error) => {
      reject(error);
    });

    child.on("exit", (code, signal) => {
      if (signal) {
        reject(new Error(`Command exited with signal ${signal}`));
        return;
      }

      resolve(code ?? 0);
    });
  });
}

export const openEditor = openToolInWorktree;
