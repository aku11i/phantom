import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { z } from "zod";
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
  pullRequest?: GitHubPullRequest;
}

export function isPullRequest(
  issue: GitHubIssue,
): issue is GitHubIssue & { pullRequest: GitHubPullRequest } {
  return issue.pullRequest !== undefined;
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

const numberSchema = z.coerce.number().int().positive();

export async function fetchPullRequest(
  owner: string,
  repo: string,
  number: string,
): Promise<GitHubPullRequest | null> {
  try {
    const pullNumber = numberSchema.parse(number);
    const octokit = await createGitHubClient();
    const { data } = await octokit.pulls.get({
      owner,
      repo,
      pull_number: pullNumber,
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
    const issueNumber = numberSchema.parse(number);
    const octokit = await createGitHubClient();
    const { data } = await octokit.issues.get({
      owner,
      repo,
      issue_number: issueNumber,
    });

    let pullRequest: GitHubPullRequest | undefined;
    if (data.pull_request) {
      const pr = await fetchPullRequest(owner, repo, number);
      if (pr) {
        pullRequest = pr;
      }
    }

    return {
      number: data.number,
      pullRequest,
    };
  } catch (error) {
    if (error instanceof Error && "status" in error && error.status === 404) {
      return null;
    }
    throw error;
  }
}
