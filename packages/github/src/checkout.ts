import { type Result, err, ok } from "@aku11i/phantom-shared";
import { fetchIssue, getGitHubRepoInfo, isPullRequest } from "./api/index.ts";
import { checkoutIssue } from "./checkout/issue.ts";
import { checkoutPullRequest } from "./checkout/pr.ts";

export interface GitHubCheckoutOptions {
  number: string;
  base?: string;
}

export async function githubCheckout(
  options: GitHubCheckoutOptions,
): Promise<Result<void>> {
  const { number, base } = options;
  const { owner, repo } = await getGitHubRepoInfo();

  // Always fetch from /issues/:number endpoint first
  const issue = await fetchIssue(owner, repo, number);

  if (!issue) {
    return err(
      new Error(
        `GitHub issue or pull request #${number} not found or you don't have permission to access it.`,
      ),
    );
  }

  // Check if it's a pull request
  if (isPullRequest(issue)) {
    if (base) {
      return err(
        new Error(
          `The --base option cannot be used with pull requests. Pull request #${number} already has a branch '${issue.pullRequest.head.ref}'.`,
        ),
      );
    }
    await checkoutPullRequest(issue.pullRequest);
  } else {
    await checkoutIssue(issue, base);
  }

  return ok(undefined);
}
