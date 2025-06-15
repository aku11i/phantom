import {
  WorktreeAlreadyExistsError,
  attachWorktreeCore,
} from "@aku11i/phantom-core";
import {
  fetch,
  getGitRoot,
  setUpstreamBranch,
} from "@aku11i/phantom-git";
import { type Result, err, isErr, ok } from "@aku11i/phantom-shared";
import type { GitHubPullRequest } from "../api/index.ts";

export interface CheckoutResult {
  message: string;
  alreadyExists?: boolean;
}

export async function checkoutPullRequest(
  pullRequest: GitHubPullRequest,
): Promise<Result<CheckoutResult>> {
  const gitRoot = await getGitRoot();
  const worktreeName = `pr-${pullRequest.number}`;
  const localBranch = `pr-${pullRequest.number}`;

  // For both fork and same-repo PRs, we fetch the PR ref to a local branch
  // This provides a consistent approach and ensures we always have the latest PR state
  const refspec = `pull/${pullRequest.number}/head:${localBranch}`;

  // Fetch the PR to a local branch
  const fetchResult = await fetch({ refspec });
  if (isErr(fetchResult)) {
    return err(
      new Error(
        `Failed to fetch PR #${pullRequest.number}: ${fetchResult.error.message}`,
      ),
    );
  }

  // Attach the worktree to the fetched branch
  const attachResult = await attachWorktreeCore(gitRoot, worktreeName);

  if (isErr(attachResult)) {
    if (attachResult.error instanceof WorktreeAlreadyExistsError) {
      return ok({
        message: `Worktree for PR #${pullRequest.number} is already checked out`,
        alreadyExists: true,
      });
    }
    return err(attachResult.error);
  }

  // Set upstream tracking branch
  // Since fetch was successful, we know the remote ref exists
  const upstream = pullRequest.isFromFork
    ? `origin/pull/${pullRequest.number}/head`
    : `origin/${pullRequest.head.ref}`;

  const upstreamResult = await setUpstreamBranch(
    gitRoot,
    localBranch,
    upstream,
  );
  if (isErr(upstreamResult)) {
    // Log the error but don't fail the checkout
    console.warn(
      `Warning: Could not set upstream branch: ${upstreamResult.error.message}`,
    );
  }

  const message = pullRequest.isFromFork
    ? `Checked out PR #${pullRequest.number} from fork ${pullRequest.head.repo.full_name}`
    : `Checked out PR #${pullRequest.number} from branch ${pullRequest.head.ref}`;

  return ok({
    message,
  });
}
