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

// New simplified version that takes worktreeDirectory directly
export function getWorktreePathFromDirectory(
  worktreeDirectory: string,
  name: string,
): string {
  return join(worktreeDirectory, name);
}
