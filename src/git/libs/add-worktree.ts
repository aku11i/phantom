import childProcess from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(childProcess.exec);

export interface AddWorktreeOptions {
  path: string;
  branch: string;
  commitish?: string;
}

export async function addWorktree(options: AddWorktreeOptions): Promise<void> {
  const { path, branch, commitish = "HEAD" } = options;

  await execAsync(`git worktree add "${path}" -b "${branch}" ${commitish}`);
}
