import { execSync } from 'node:child_process';

export function getCurrentBranch(): string {
  return execSync('git branch --show-current', { encoding: 'utf8' }).trim();
}