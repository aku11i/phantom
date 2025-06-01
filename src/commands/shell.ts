import { spawn } from "node:child_process";
import { exit } from "node:process";
import { whereRuin } from "../ruins/commands/where.ts";

export async function shellInRuin(ruinName: string): Promise<{
  success: boolean;
  message?: string;
  exitCode?: number;
}> {
  if (!ruinName) {
    return { success: false, message: "Error: ruin name required" };
  }

  // Validate ruin exists and get its path
  const ruinResult = await whereRuin(ruinName);
  if (!ruinResult.success) {
    return { success: false, message: ruinResult.message };
  }

  const ruinPath = ruinResult.path as string;
  // Use user's preferred shell or fallback to /bin/sh
  const shell = process.env.SHELL || "/bin/sh";

  return new Promise((resolve) => {
    const childProcess = spawn(shell, [], {
      cwd: ruinPath,
      stdio: "inherit",
      env: {
        ...process.env,
        // Add environment variable to indicate we're in a phantom ruin
        PHANTOM_RUIN: ruinName,
        PHANTOM_RUIN_PATH: ruinPath,
      },
    });

    childProcess.on("error", (error) => {
      resolve({
        success: false,
        message: `Error starting shell: ${error.message}`,
      });
    });

    childProcess.on("exit", (code, signal) => {
      if (signal) {
        resolve({
          success: false,
          message: `Shell terminated by signal: ${signal}`,
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

export async function shellHandler(args: string[]): Promise<void> {
  if (args.length < 1) {
    console.error("Usage: phantom shell <ruin-name>");
    exit(1);
  }

  const ruinName = args[0];
  
  // Get ruin path for display
  const ruinResult = await whereRuin(ruinName);
  if (!ruinResult.success) {
    console.error(ruinResult.message);
    exit(1);
  }

  // Display entering message
  console.log(`Entering ruin '${ruinName}' at ${ruinResult.path}`);
  console.log("Type 'exit' to return to your original directory\n");
  
  const result = await shellInRuin(ruinName);

  if (!result.success) {
    if (result.message) {
      console.error(result.message);
    }
    exit(result.exitCode ?? 1);
  }

  // Exit with the same code as the shell
  exit(result.exitCode ?? 0);
}
