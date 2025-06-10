import { executeGitCommand } from "../executor.ts";

export interface AddWorktreeOptions {
  path: string;
  branch: string;
  base?: string;
}

export async function addWorktree(options: AddWorktreeOptions): Promise<void> {
  const { path, branch, base = "HEAD" } = options;

  await executeGitCommand(["worktree", "add", path, "-b", branch, base]);
}
