import fs from "node:fs/promises";
import { addWorktree } from "../../git/libs/add-worktree.ts";
import { getPhantomDirectory, getWorktreePath } from "../paths.ts";
import { validateWorktreeDoesNotExist } from "./validate.ts";

export interface CreateWorktreeOptions {
  branch?: string;
  commitish?: string;
}

export interface CreateWorktreeResult {
  success: boolean;
  message: string;
  path?: string;
}

export async function createWorktree(
  gitRoot: string,
  name: string,
  options: CreateWorktreeOptions = {},
): Promise<CreateWorktreeResult> {
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
    return {
      success: false,
      message: validation.message || `Worktree '${name}' already exists`,
    };
  }

  try {
    await addWorktree({
      path: worktreePath,
      branch,
      commitish,
    });

    return {
      success: true,
      message: `Created worktree '${name}' at ${worktreePath}`,
      path: worktreePath,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to create worktree: ${errorMessage}`);
  }
}
