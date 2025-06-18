import { existsSync } from "node:fs";
import { attachWorktree, branchExists } from "@aku11i/phantom-git";
import { type Result, err, isErr, ok } from "@aku11i/phantom-shared";
import { getWorktreePathFromDirectory } from "../paths.ts";
import {
  BranchNotFoundError,
  WorktreeAlreadyExistsError,
  WorktreeError,
} from "./errors.ts";
import {
  copyFilesToWorktree,
  executePostCreateCommands,
} from "./post-create.ts";
import { validateWorktreeName } from "./validate.ts";

export async function attachWorktreeCore(
  gitRoot: string,
  worktreeDirectory: string,
  name: string,
  config?: {
    postCreate?: { copyFiles?: string[]; commands?: string[] };
  } | null,
): Promise<Result<string, Error>> {
  const validation = validateWorktreeName(name);
  if (isErr(validation)) {
    return validation;
  }

  const worktreePath = getWorktreePathFromDirectory(worktreeDirectory, name);
  if (existsSync(worktreePath)) {
    return err(new WorktreeAlreadyExistsError(name));
  }

  const branchCheckResult = await branchExists(gitRoot, name);
  if (isErr(branchCheckResult)) {
    return err(branchCheckResult.error);
  }

  if (!branchCheckResult.value) {
    return err(new BranchNotFoundError(name));
  }

  const attachResult = await attachWorktree(gitRoot, worktreePath, name);
  if (isErr(attachResult)) {
    return err(attachResult.error);
  }

  // Execute postCreate hooks from config
  if (config?.postCreate) {
    // Copy files from config
    if (config.postCreate.copyFiles && config.postCreate.copyFiles.length > 0) {
      const copyResult = await copyFilesToWorktree(
        gitRoot,
        worktreeDirectory,
        name,
        config.postCreate.copyFiles,
      );
      if (isErr(copyResult)) {
        // Don't fail attach, just warn
        console.warn(
          `Warning: Failed to copy some files: ${copyResult.error.message}`,
        );
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

  return ok(worktreePath);
}
