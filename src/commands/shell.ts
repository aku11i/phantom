import { spawn } from "node:child_process";
import { exit } from "node:process";
import { whereWorktree } from "./where.ts";

export async function shellInWorktree(worktreeName: string): Promise<{
  success: boolean;
  message?: string;
  exitCode?: number;
}> {
  if (!worktreeName) {
    return { success: false, message: "Error: worktree name required" };
  }

  // Validate worktree exists and get its path
  const worktreeResult = await whereWorktree(worktreeName);
  if (!worktreeResult.success) {
    return { success: false, message: worktreeResult.message };
  }

  const worktreePath = worktreeResult.path as string;
  // Use user's preferred shell or fallback to /bin/sh
  const shell = process.env.SHELL || "/bin/sh";

  return new Promise((resolve) => {
    const childProcess = spawn(shell, [], {
      cwd: worktreePath,
      stdio: "inherit",
      env: {
        ...process.env,
        // Add environment variable to indicate we're in a worktree
        WORKTREE_NAME: worktreeName,
        WORKTREE_PATH: worktreePath,
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
    console.error("Usage: phantom shell <worktree-name>");
    exit(1);
  }

  const worktreeName = args[0];

  // Get worktree path for display
  const worktreeResult = await whereWorktree(worktreeName);
  if (!worktreeResult.success) {
    console.error(worktreeResult.message);
    exit(1);
  }

  // Display entering message
  console.log(`Entering worktree '${worktreeName}' at ${worktreeResult.path}`);
  console.log("Type 'exit' to return to your original directory\n");

  const result = await shellInWorktree(worktreeName);

  if (!result.success) {
    if (result.message) {
      console.error(result.message);
    }
    exit(result.exitCode ?? 1);
  }

  // Exit with the same code as the shell
  exit(result.exitCode ?? 0);
}
