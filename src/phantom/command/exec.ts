import { spawn } from "node:child_process";
import { exit } from "node:process";
import { whereGarden } from "../../gardens/commands/where.ts";

export async function execInGarden(
  gardenName: string,
  command: string[],
): Promise<{
  success: boolean;
  message?: string;
  exitCode?: number;
}> {
  if (!gardenName) {
    return { success: false, message: "Error: garden name required" };
  }

  if (!command || command.length === 0) {
    return { success: false, message: "Error: command required" };
  }

  // Validate garden exists and get its path
  const gardenResult = await whereGarden(gardenName);
  if (!gardenResult.success) {
    return { success: false, message: gardenResult.message };
  }

  const gardenPath = gardenResult.path as string;
  const [cmd, ...args] = command;

  return new Promise((resolve) => {
    const childProcess = spawn(cmd, args, {
      cwd: gardenPath,
      stdio: "inherit",
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

export async function execHandler(args: string[]): Promise<void> {
  if (args.length < 2) {
    console.error("Usage: phantom exec <garden-name> <command> [args...]");
    exit(1);
  }

  const gardenName = args[0];
  const command = args.slice(1);

  const result = await execInGarden(gardenName, command);

  if (!result.success) {
    if (result.message) {
      console.error(result.message);
    }
    exit(result.exitCode ?? 1);
  }

  // For successful commands, exit with the same code as the child process
  exit(result.exitCode ?? 0);
}
