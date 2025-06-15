import { z } from "zod";
import { createGitHubClient } from "../client.ts";
import type { GitHubPullRequest } from "./types.ts";

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
        repo: {
          full_name: data.head.repo.full_name,
        },
      },
      base: {
        repo: {
          full_name: data.base.repo.full_name,
        },
      },
    };
  } catch (error) {
    if (error instanceof Error && "status" in error && error.status === 404) {
      return null;
    }
    throw error;
  }
}
