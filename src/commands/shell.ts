import { spawn } from "node:child_process";
import { exit } from "node:process";
import { wherePhantom } from "./where.ts";

export async function shellInPhantom(phantomName: string): Promise<{
  success: boolean;
  message?: string;
  exitCode?: number;
}> {
  if (!phantomName) {
    return { success: false, message: "Error: phantom name required" };
  }

  // Validate phantom exists and get its path
  const phantomResult = await wherePhantom(phantomName);
  if (!phantomResult.success) {
    return { success: false, message: phantomResult.message };
  }

  const phantomPath = phantomResult.path as string;
  // Use user's preferred shell or fallback to /bin/sh
  const shell = process.env.SHELL || "/bin/sh";

  return new Promise((resolve) => {
    const childProcess = spawn(shell, [], {
      cwd: phantomPath,
      stdio: "inherit",
      env: {
        ...process.env,
        // Add environment variable to indicate we're in a phantom
        PHANTOM_NAME: phantomName,
        PHANTOM_PATH: phantomPath,
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
    console.error("Usage: phantom shell <phantom-name>");
    exit(1);
  }

  const phantomName = args[0];

  // Get phantom path for display
  const phantomResult = await wherePhantom(phantomName);
  if (!phantomResult.success) {
    console.error(phantomResult.message);
    exit(1);
  }

  // Display entering message
  console.log(`Entering phantom '${phantomName}' at ${phantomResult.path}`);
  console.log("Type 'exit' to return to your original directory\n");

  const result = await shellInPhantom(phantomName);

  if (!result.success) {
    if (result.message) {
      console.error(result.message);
    }
    exit(result.exitCode ?? 1);
  }

  // Exit with the same code as the shell
  exit(result.exitCode ?? 0);
}
