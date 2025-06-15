import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { createGitHubClient } from "./client.ts";

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
    url: string | null;
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
    const octokit = await createGitHubClient();
    const { data } = await octokit.pulls.get({
      owner,
      repo,
      pull_number: Number.parseInt(number, 10),
    });
    return {
      number: data.number,
      head: {
        ref: data.head.ref,
      },
    };
  } catch (error) {
    if (error instanceof Error && "status" in error && error.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function fetchIssue(
  owner: string,
  repo: string,
  number: string,
): Promise<GitHubIssue | null> {
  try {
    const octokit = await createGitHubClient();
    const { data } = await octokit.issues.get({
      owner,
      repo,
      issue_number: Number.parseInt(number, 10),
    });
    return {
      number: data.number,
      pull_request: data.pull_request
        ? {
            url: data.pull_request.url,
          }
        : undefined,
    };
  } catch (error) {
    if (error instanceof Error && "status" in error && error.status === 404) {
      return null;
    }
    throw error;
  }
}
