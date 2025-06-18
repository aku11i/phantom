import fs from "node:fs/promises";
import { addWorktree } from "@aku11i/phantom-git";
import { type Result, err, isErr, isOk, ok } from "@aku11i/phantom-shared";
import { type PhantomConfig } from "../config/loader.ts";
import { getWorktreePathFromDirectory } from "../paths.ts";
import { type WorktreeAlreadyExistsError, WorktreeError } from "./errors.ts";
import { copyFiles } from "./file-copier.ts";
import {
  copyFilesToWorktree,
  executePostCreateCommands,
} from "./post-create.ts";
import {
  validateWorktreeDoesNotExist,
  validateWorktreeName,
} from "./validate.ts";

export interface CreateWorktreeOptions {
  branch?: string;
  base?: string;
  copyFiles?: string[];
}

export interface CreateWorktreeSuccess {
  message: string;
  path: string;
  copiedFiles?: string[];
  skippedFiles?: string[];
  copyError?: string;
}

export async function createWorktree(
  gitRoot: string,
  worktreeDirectory: string,
  name: string,
  options: CreateWorktreeOptions,
  config: PhantomConfig | null,
): Promise<
  Result<CreateWorktreeSuccess, WorktreeAlreadyExistsError | WorktreeError>
> {
  const nameValidation = validateWorktreeName(name);
  if (isErr(nameValidation)) {
    return nameValidation;
  }

  const { branch = name, base = "HEAD" } = options;

  const worktreePath = getWorktreePathFromDirectory(worktreeDirectory, name);

  try {
    await fs.access(worktreeDirectory);
  } catch {
    await fs.mkdir(worktreeDirectory, { recursive: true });
  }

  const validation = await validateWorktreeDoesNotExist(
    gitRoot,
    worktreeDirectory,
    name,
  );
  if (isErr(validation)) {
    return err(validation.error);
  }

  try {
    await addWorktree({
      path: worktreePath,
      branch,
      base,
    });

    let copiedFiles: string[] | undefined;
    let skippedFiles: string[] | undefined;
    let copyError: string | undefined;

    if (options.copyFiles && options.copyFiles.length > 0) {
      const copyResult = await copyFiles(
        gitRoot,
        worktreePath,
        options.copyFiles,
      );

      if (isOk(copyResult)) {
        copiedFiles = copyResult.value.copiedFiles;
        skippedFiles = copyResult.value.skippedFiles;
      } else {
        copyError = copyResult.error.message;
      }
    }

    // Execute postCreate hooks from config
    if (config?.postCreate) {
      // Copy files from config
      if (
        config.postCreate.copyFiles &&
        config.postCreate.copyFiles.length > 0
      ) {
        const copyConfigResult = await copyFilesToWorktree(
          gitRoot,
          worktreeDirectory,
          name,
          config.postCreate.copyFiles,
        );
        if (isErr(copyConfigResult)) {
          // Don't fail worktree creation, just warn
          if (!copyError) {
            copyError = copyConfigResult.error.message;
          }
        }
      }

      // Execute commands from config
      if (config.postCreate.commands && config.postCreate.commands.length > 0) {
        console.log("\nRunning post-create commands...");
        const commandsResult = await executePostCreateCommands({
          gitRoot,
          worktreesDirectory: worktreeDirectory,
          worktreeName: name,
          commands: config.postCreate.commands,
        });
        if (isErr(commandsResult)) {
          return err(new WorktreeError(commandsResult.error.message));
        }
      }
    }

    return ok({
      message: `Created worktree '${name}' at ${worktreePath}`,
      path: worktreePath,
      copiedFiles,
      skippedFiles,
      copyError,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return err(new WorktreeError(`worktree add failed: ${errorMessage}`));
  }
}
