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
