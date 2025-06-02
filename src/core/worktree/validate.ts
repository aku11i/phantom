import fs from "node:fs/promises";
import { getPhantomDirectory, getWorktreePath } from "../paths.ts";

export interface ValidationResult {
  exists: boolean;
  path?: string;
  message?: string;
}

export async function validateWorktreeExists(
  gitRoot: string,
  name: string,
): Promise<ValidationResult> {
  const worktreePath = getWorktreePath(gitRoot, name);

  try {
    await fs.access(worktreePath);
    return {
      exists: true,
      path: worktreePath,
    };
  } catch {
    return {
      exists: false,
      message: `Worktree '${name}' does not exist`,
    };
  }
}

export async function validateWorktreeDoesNotExist(
  gitRoot: string,
  name: string,
): Promise<ValidationResult> {
  const worktreePath = getWorktreePath(gitRoot, name);

  try {
    await fs.access(worktreePath);
    return {
      exists: true,
      message: `Worktree '${name}' already exists`,
    };
  } catch {
    return {
      exists: false,
      path: worktreePath,
    };
  }
}

export async function validatePhantomDirectoryExists(
  gitRoot: string,
): Promise<boolean> {
  const phantomDir = getPhantomDirectory(gitRoot);

  try {
    await fs.access(phantomDir);
    return true;
  } catch {
    return false;
  }
}

export async function listValidWorktrees(gitRoot: string): Promise<string[]> {
  const phantomDir = getPhantomDirectory(gitRoot);

  if (!(await validatePhantomDirectoryExists(gitRoot))) {
    return [];
  }

  try {
    const entries = await fs.readdir(phantomDir);
    const validWorktrees: string[] = [];

    for (const entry of entries) {
      const result = await validateWorktreeExists(gitRoot, entry);
      if (result.exists) {
        validWorktrees.push(entry);
      }
    }

    return validWorktrees;
  } catch {
    return [];
  }
}
