import { execFile } from "node:child_process";
import { promisify } from "node:util";
import {
  WorktreeAlreadyExistsError,
  createWorktree as createWorktreeCore,
} from "@aku11i/phantom-core";
import { getGitRoot } from "@aku11i/phantom-git";
import { isErr } from "@aku11i/phantom-shared";

const execFileAsync = promisify(execFile);

export interface GitHubCheckoutOptions {
  number: string;
  base?: string;
}

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

async function getGitHubRepoInfo(): Promise<{ owner: string; repo: string }> {
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

async function fetchPullRequest(
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

async function fetchIssue(
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

export async function githubCheckout(
  options: GitHubCheckoutOptions,
): Promise<void> {
  const { number, base } = options;

  const gitRoot = await getGitRoot();
  const { owner, repo } = await getGitHubRepoInfo();

  const pullRequest = await fetchPullRequest(owner, repo, number);

  if (pullRequest) {
    const worktreeName = `pr-${number}`;
    const result = await createWorktreeCore(gitRoot, worktreeName, {
      branch: pullRequest.head.ref,
      base: `origin/${pullRequest.head.ref}`,
    });

    if (isErr(result)) {
      if (result.error instanceof WorktreeAlreadyExistsError) {
        console.log(`Worktree for PR #${number} is already checked out`);
        return;
      }
      throw result.error;
    }

    console.log(result.value.message);
    return;
  }

  const issue = await fetchIssue(owner, repo, number);

  if (issue) {
    if (issue.pull_request) {
      throw new Error(
        `#${number} is already linked to a pull request. Use the PR number instead.`,
      );
    }

    const worktreeName = `issue-${number}`;
    const branchName = `issue-${number}`;
    const result = await createWorktreeCore(gitRoot, worktreeName, {
      branch: branchName,
      base,
    });

    if (isErr(result)) {
      if (result.error instanceof WorktreeAlreadyExistsError) {
        console.log(`Worktree for issue #${number} is already checked out`);
        return;
      }
      throw result.error;
    }

    console.log(result.value.message);
    return;
  }

  throw new Error(
    `GitHub issue or pull request #${number} not found or you don't have permission to access it.`,
  );
}
