import { join } from "node:path";

export function getPhantomDirectory(gitRoot: string): string {
  return join(gitRoot, ".git", "phantom", "worktrees");
}

export function getWorktreePath(gitRoot: string, name: string): string {
  return join(getPhantomDirectory(gitRoot), name);
}
