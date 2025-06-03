import { executeGitCommand } from "../executor.ts";

export interface AddWorktreeOptions {
  path: string;
  branch: string;
  commitish?: string;
}

export async function addWorktree(options: AddWorktreeOptions): Promise<void> {
  const { path, branch, commitish = "HEAD" } = options;

  await executeGitCommand(["worktree", "add", path, "-b", branch, commitish]);
}
