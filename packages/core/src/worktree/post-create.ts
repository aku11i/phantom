import { err, isErr, ok, type Result } from "@aku11i/phantom-shared";
import { execInWorktree } from "../exec.ts";
import { getWorktreePathFromDirectory } from "../paths.ts";
import { copyFiles } from "./file-copier.ts";

export interface PostCreateExecutionOptions {
  gitRoot: string;
  worktreesDirectory: string;
  worktreeName: string;
  commands: string[];
}

export interface PostCreateExecutionResult {
  executedCommands: string[];
}

export interface PostCreateOptions {
  gitRoot: string;
  worktreesDirectory: string;
  worktreeName: string;
  copyFiles?: string[];
  commands?: string[];
}

export interface PostCreateResult {
  copyError?: string;
  executedCommands: string[];
}

export async function executePostCreateCommands(
  options: PostCreateExecutionOptions,
): Promise<Result<PostCreateExecutionResult>> {
  const { gitRoot, worktreesDirectory, worktreeName, commands } = options;

  const executedCommands: string[] = [];

  for (const command of commands) {
    console.log(`Executing: ${command}`);
    const shell = process.env.SHELL || "/bin/sh";
    const cmdResult = await execInWorktree(
      gitRoot,
      worktreesDirectory,
      worktreeName,
      [shell, "-c", command],
    );

    if (isErr(cmdResult)) {
      const errorMessage =
        cmdResult.error instanceof Error
          ? cmdResult.error.message
          : String(cmdResult.error);
      return err(
        new Error(
          `Failed to execute post-create command "${command}": ${errorMessage}`,
        ),
      );
    }

    // Check exit code
    if (cmdResult.value.exitCode !== 0) {
      return err(
        new Error(
          `Post-create command failed with exit code ${cmdResult.value.exitCode}: ${command}`,
        ),
      );
    }

    executedCommands.push(command);
  }

  return ok({ executedCommands });
}

export async function runPostCreate(
  options: PostCreateOptions,
): Promise<Result<PostCreateResult>> {
  const { gitRoot, worktreesDirectory, worktreeName, copyFiles, commands } =
    options;

  let copyError: string | undefined;

  if (copyFiles && copyFiles.length > 0) {
    const copyResult = await copyFilesToWorktree(
      gitRoot,
      worktreesDirectory,
      worktreeName,
      copyFiles,
    );
    if (isErr(copyResult)) {
      copyError = copyResult.error.message;
    }
  }

  let executedCommands: string[] = [];

  if (commands && commands.length > 0) {
    console.log("\nRunning post-create commands...");
    const commandsResult = await executePostCreateCommands({
      gitRoot,
      worktreesDirectory,
      worktreeName,
      commands,
    });
    if (isErr(commandsResult)) {
      return err(commandsResult.error);
    }
    executedCommands = commandsResult.value.executedCommands;
  }

  return ok({ copyError, executedCommands });
}

export async function copyFilesToWorktree(
  gitRoot: string,
  worktreesDirectory: string,
  worktreeName: string,
  filesToCopy: string[],
): Promise<Result<void>> {
  const worktreePath = getWorktreePathFromDirectory(
    worktreesDirectory,
    worktreeName,
  );
  const copyResult = await copyFiles(gitRoot, worktreePath, filesToCopy);

  if (isErr(copyResult)) {
    return err(copyResult.error);
  }

  return ok(undefined);
}
