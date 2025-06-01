import { spawn } from "node:child_process";
import { exit } from "node:process";
import { whereGarden } from "../../gardens/commands/where.ts";

export async function shellInGarden(gardenName: string): Promise<{
  success: boolean;
  message?: string;
  exitCode?: number;
}> {
  if (!gardenName) {
    return { success: false, message: "Error: garden name required" };
  }

  // Validate garden exists and get its path
  const gardenResult = await whereGarden(gardenName);
  if (!gardenResult.success) {
    return { success: false, message: gardenResult.message };
  }

  const gardenPath = gardenResult.path as string;
  // Use user's preferred shell or fallback to /bin/sh
  const shell = process.env.SHELL || "/bin/sh";

  return new Promise((resolve) => {
    const childProcess = spawn(shell, [], {
      cwd: gardenPath,
      stdio: "inherit",
      env: {
        ...process.env,
        // Add environment variable to indicate we're in a phantom garden
        PHANTOM_GARDEN: gardenName,
        PHANTOM_GARDEN_PATH: gardenPath,
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
    console.error("Usage: phantom shell <garden-name>");
    exit(1);
  }

  const gardenName = args[0];

  // Get garden path for display
  const gardenResult = await whereGarden(gardenName);
  if (!gardenResult.success) {
    console.error(gardenResult.message);
    exit(1);
  }

  // Display entering message
  console.log(`Entering garden '${gardenName}' at ${gardenResult.path}`);
  console.log("Type 'exit' to return to your original directory\n");

  const result = await shellInGarden(gardenName);

  if (!result.success) {
    if (result.message) {
      console.error(result.message);
    }
    exit(result.exitCode ?? 1);
  }

  // Exit with the same code as the shell
  exit(result.exitCode ?? 0);
}
