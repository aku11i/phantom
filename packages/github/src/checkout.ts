import { fetchIssue, getGitHubRepoInfo, isPullRequest } from "./api.ts";
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

  // Always fetch from /issues/:number endpoint first
  const issue = await fetchIssue(owner, repo, number);

  if (!issue) {
    throw new Error(
      `GitHub issue or pull request #${number} not found or you don't have permission to access it.`,
    );
  }

  // Check if it's a pull request
  if (isPullRequest(issue)) {
    await checkoutPullRequest(issue.pullRequest);
  } else {
    await checkoutIssue(issue, base);
  }
}
