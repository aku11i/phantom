import { existsSync } from "node:fs";
import { attachWorktree, branchExists } from "@aku11i/phantom-git";
import {
  type Logger,
  type Result,
  err,
  isErr,
  ok,
} from "@aku11i/phantom-shared";
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
  postCreateCopyFiles: string[] | undefined,
  postCreateCommands: string[] | undefined,
  logger: Logger,
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

  // Execute postCreate hooks
  if (postCreateCopyFiles && postCreateCopyFiles.length > 0) {
    const copyResult = await copyFilesToWorktree(
      gitRoot,
      worktreeDirectory,
      name,
      postCreateCopyFiles,
    );
    if (isErr(copyResult)) {
      // Don't fail attach, just warn
      logger.warn(
        `Warning: Failed to copy some files: ${copyResult.error.message}`,
      );
    }
  }

  if (postCreateCommands && postCreateCommands.length > 0) {
    logger.log("\nRunning post-create commands...");
    const commandsResult = await executePostCreateCommands({
      gitRoot,
      worktreesDirectory: worktreeDirectory,
      worktreeName: name,
      commands: postCreateCommands,
      logger,
    });
    if (isErr(commandsResult)) {
      return err(new WorktreeError(commandsResult.error.message));
    }
  }

  return ok(worktreePath);
}
