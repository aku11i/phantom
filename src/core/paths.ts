import { join } from "node:path";
import { encodeWorktreeName } from "./worktree/validate.ts";

export function getPhantomDirectory(gitRoot: string): string {
  return join(gitRoot, ".git", "phantom", "worktrees");
}

export function getWorktreePath(gitRoot: string, name: string): string {
  const encodedName = encodeWorktreeName(name);
  return join(getPhantomDirectory(gitRoot), encodedName);
}
