import fs from "node:fs/promises";
import { getPhantomDirectory, getWorktreePath } from "../paths.ts";
import { type Result, err, ok } from "../types/result.ts";

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

export function validateWorktreeName(name: string): Result<void, Error> {
  if (!name || name.trim() === "") {
    return err(new Error("Phantom name cannot be empty"));
  }

  if (name.includes("/")) {
    return err(new Error("Phantom name cannot contain slashes"));
  }

  if (name.startsWith(".")) {
    return err(new Error("Phantom name cannot start with a dot"));
  }

  return ok(undefined);
}
