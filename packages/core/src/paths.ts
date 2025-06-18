import { isAbsolute, join } from "node:path";

export function getWorktreeDirectory(
  gitRoot: string,
  worktreeBaseDirectory: string | undefined,
): string {
  if (worktreeBaseDirectory) {
    // If worktreeBaseDirectory is absolute, use it as-is. If relative, resolve from gitRoot
    return isAbsolute(worktreeBaseDirectory) ? worktreeBaseDirectory : join(gitRoot, worktreeBaseDirectory);
  }
  return join(gitRoot, ".git", "phantom", "worktrees");
}

export function getWorktreePath(
  gitRoot: string,
  name: string,
  worktreeBaseDirectory: string | undefined,
): string {
  return join(getWorktreeDirectory(gitRoot, worktreeBaseDirectory), name);
}

// New simplified version that takes worktreeDirectory directly
export function getWorktreePathFromDirectory(
  worktreeDirectory: string,
  name: string,
): string {
  return join(worktreeDirectory, name);
}
