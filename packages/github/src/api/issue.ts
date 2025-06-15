import { z } from "zod";
import { createGitHubClient } from "../client.ts";
import { fetchPullRequest } from "./pull-request.ts";
import type { GitHubIssue, GitHubPullRequest } from "./types.ts";

const numberSchema = z.coerce.number().int().positive();

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
