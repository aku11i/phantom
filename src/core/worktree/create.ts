import fs from "node:fs/promises";
import { addWorktree } from "../git/libs/add-worktree.ts";
import { getPhantomDirectory, getWorktreePath } from "../paths.ts";
import { type Result, err, isErr, ok } from "../types/result.ts";
import { GitOperationError, WorktreeAlreadyExistsError } from "./errors.ts";
import {
  validateWorktreeDoesNotExist,
  validateWorktreeName,
} from "./validate.ts";

export interface CreateWorktreeOptions {
  branch?: string;
  commitish?: string;
}

export interface CreateWorktreeSuccess {
  message: string;
  path: string;
}

export async function createWorktree(
  gitRoot: string,
  name: string,
  options: CreateWorktreeOptions = {},
): Promise<
  Result<CreateWorktreeSuccess, WorktreeAlreadyExistsError | GitOperationError>
> {
  const nameValidation = validateWorktreeName(name);
  if (isErr(nameValidation)) {
    return nameValidation;
  }

  const { branch = name, commitish = "HEAD" } = options;

  const worktreesPath = getPhantomDirectory(gitRoot);
  const worktreePath = getWorktreePath(gitRoot, name);

  try {
    await fs.access(worktreesPath);
  } catch {
    await fs.mkdir(worktreesPath, { recursive: true });
  }

  const validation = await validateWorktreeDoesNotExist(gitRoot, name);
  if (validation.exists) {
    return err(new WorktreeAlreadyExistsError(name));
  }

  try {
    await addWorktree({
      path: worktreePath,
      branch,
      commitish,
    });

    return ok({
      message: `Created worktree '${name}' at ${worktreePath}`,
      path: worktreePath,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return err(new GitOperationError("worktree add", errorMessage));
  }
}
