import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export interface GitHubPullRequest {
  number: number;
  head: {
    ref: string;
  };
}

export interface GitHubIssue {
  number: number;
  pull_request?: {
    url: string;
  };
}

export async function getGitHubRepoInfo(): Promise<{
  owner: string;
  repo: string;
}> {
  try {
    const { stdout } = await execFileAsync("gh", [
      "repo",
      "view",
      "--json",
      "owner,name",
    ]);
    const data = JSON.parse(stdout);
    return { owner: data.owner.login, repo: data.name };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to get repository info: ${errorMessage}`);
  }
}

export async function fetchPullRequest(
  owner: string,
  repo: string,
  number: string,
): Promise<GitHubPullRequest | null> {
  try {
    const { stdout } = await execFileAsync("gh", [
      "api",
      `repos/${owner}/${repo}/pulls/${number}`,
    ]);
    return JSON.parse(stdout);
  } catch {
    return null;
  }
}

export async function fetchIssue(
  owner: string,
  repo: string,
  number: string,
): Promise<GitHubIssue | null> {
  try {
    const { stdout } = await execFileAsync("gh", [
      "api",
      `repos/${owner}/${repo}/issues/${number}`,
    ]);
    return JSON.parse(stdout);
  } catch {
    return null;
  }
}
