import { existsSync } from "node:fs";
import { attachWorktree, branchExists } from "@aku11i/phantom-git";
import { err, isErr, ok, type Result } from "@aku11i/phantom-shared";
import { getWorktreePathFromDirectory } from "../paths.ts";
import {
  BranchNotFoundError,
  WorktreeAlreadyExistsError,
  WorktreeError,
} from "./errors.ts";
import { runPostCreate } from "./post-create.ts";
import { validateWorktreeName } from "./validate.ts";

export async function attachWorktreeCore(
  gitRoot: string,
  worktreeDirectory: string,
  name: string,
  postCreateCopyFiles: string[] | undefined,
  postCreateCommands: string[] | undefined,
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

  const postCreateResult = await runPostCreate({
    gitRoot,
    worktreesDirectory: worktreeDirectory,
    worktreeName: name,
    copyFiles: postCreateCopyFiles,
    commands: postCreateCommands,
  });
  if (isErr(postCreateResult)) {
    return err(new WorktreeError(postCreateResult.error.message));
  }
  if (postCreateResult.value.copyError) {
    console.warn(
      `Warning: Failed to copy some files: ${postCreateResult.value.copyError}`,
    );
  }

  return ok(worktreePath);
}
