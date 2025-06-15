import { fetchIssue, fetchPullRequest, getGitHubRepoInfo } from "./api.ts";
import { checkoutIssue } from "./checkout/issue.ts";
import { checkoutPullRequest } from "./checkout/pr.ts";

export interface GitHubCheckoutOptions {
  number: string;
  base?: string;
}

export async function githubCheckout(
  options: GitHubCheckoutOptions,
): Promise<void> {
  const { number, base } = options;
  const { owner, repo } = await getGitHubRepoInfo();

  const pullRequest = await fetchPullRequest(owner, repo, number);
  if (pullRequest) {
    await checkoutPullRequest(pullRequest, number);
    return;
  }

  const issue = await fetchIssue(owner, repo, number);
  if (issue) {
    await checkoutIssue(issue, number, base);
    return;
  }

  throw new Error(
    `GitHub issue or pull request #${number} not found or you don't have permission to access it.`,
  );
}
