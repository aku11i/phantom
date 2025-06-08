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

  // Only allow alphanumeric, hyphen, underscore, dot, and slash
  const validNamePattern = /^[a-zA-Z0-9\-_.\/]+$/;
  if (!validNamePattern.test(name)) {
    return err(
      new Error(
        "Phantom name can only contain letters, numbers, hyphens, underscores, dots, and slashes",
      ),
    );
  }

  if (name.includes("..")) {
    return err(new Error("Phantom name cannot contain consecutive dots"));
  }

  return ok(undefined);
}

export function encodeWorktreeName(name: string): string {
  return name.replace(/\//g, "__");
}

export function decodeWorktreeName(encodedName: string): string {
  return encodedName.replace(/__/g, "/");
}
