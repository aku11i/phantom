import { isAbsolute, join } from "node:path";

export function getWorktreeDirectory(
  gitRoot: string,
  basePath: string | undefined,
): string {
  if (basePath) {
    // If basePath is absolute, use it as-is. If relative, resolve from gitRoot
    return isAbsolute(basePath) ? basePath : join(gitRoot, basePath);
  }
  return join(gitRoot, ".git", "phantom", "worktrees");
}

export function getWorktreePath(
  gitRoot: string,
  name: string,
  basePath: string | undefined,
): string {
  return join(getWorktreeDirectory(gitRoot, basePath), name);
}

// New simplified version that takes worktreeDirectory directly
export function getWorktreePathFromDirectory(
  worktreeDirectory: string,
  name: string,
): string {
  return join(worktreeDirectory, name);
}
