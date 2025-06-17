import { isAbsolute, join } from "node:path";

export function getPhantomDirectory(
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
  return join(getPhantomDirectory(gitRoot, basePath), name);
}
