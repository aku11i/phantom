import { isAbsolute, join } from "node:path";

export function getWorktreesDirectory(
  gitRoot: string,
  worktreesDirectory: string | undefined,
): string {
  if (worktreesDirectory) {
    // If worktreesDirectory is absolute, use it as-is. If relative, resolve from gitRoot
    return isAbsolute(worktreesDirectory)
      ? worktreesDirectory
      : join(gitRoot, worktreesDirectory);
  }
  return join(gitRoot, ".git", "phantom", "worktrees");
}

export function getWorktreePath(
  gitRoot: string,
  name: string,
  worktreesDirectory: string | undefined,
): string {
  return join(getWorktreesDirectory(gitRoot, worktreesDirectory), name);
}

// New simplified version that takes worktreeDirectory directly
export function getWorktreePathFromDirectory(
  worktreeDirectory: string,
  name: string,
): string {
  return join(worktreeDirectory, name);
}
