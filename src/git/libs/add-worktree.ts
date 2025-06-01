import { execSync, type ExecSyncOptions } from 'node:child_process';

export interface AddWorktreeOptions {
  path: string;
  branch: string;
  commitish?: string;
}

export function addWorktree(options: AddWorktreeOptions): void {
  const { path, branch, commitish = 'HEAD' } = options;
  const execOptions: ExecSyncOptions = { stdio: 'inherit' };
  
  execSync(
    `git worktree add "${path}" -b "${branch}" ${commitish}`,
    execOptions
  );
}