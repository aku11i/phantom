import {
  WorktreeAlreadyExistsError,
  attachWorktreeCore,
  createContext,
  getWorktreePathFromDirectory,
} from "@aku11i/phantom-core";
import { fetch, getGitRoot, setUpstreamBranch } from "@aku11i/phantom-git";
import { type Result, err, isErr, ok } from "@aku11i/phantom-shared";
import type { GitHubPullRequest } from "../api/index.ts";

export interface CheckoutResult {
  message: string;
  worktree: string;
  path: string;
  alreadyExists?: boolean;
}

export async function checkoutPullRequest(
  pullRequest: GitHubPullRequest,
): Promise<Result<CheckoutResult>> {
  const gitRoot = await getGitRoot();
  const context = await createContext(gitRoot);
  const worktreeName = `pr-${pullRequest.number}`;
  const localBranch = `pr-${pullRequest.number}`;

  // Determine the upstream branch for tracking
  const upstream = pullRequest.isFromFork
    ? `origin/pull/${pullRequest.number}/head`
    : `origin/${pullRequest.head.ref}`;

  // For both fork and same-repo PRs, we fetch the PR ref to a local branch
  // This provides a consistent approach and ensures we always have the latest PR state
  const refspec = `${upstream.replace("origin/", "")}:${localBranch}`;

  // Fetch the PR to a local branch
  const fetchResult = await fetch({ refspec });
  if (isErr(fetchResult)) {
    return err(
      new Error(
        `Failed to fetch PR #${pullRequest.number}: ${fetchResult.error.message}`,
      ),
    );
  }

  // Set upstream tracking branch immediately after successful fetch
  // Since fetch was successful, we know the remote ref exists

  const setUpstreamResult = await setUpstreamBranch(
    gitRoot,
    localBranch,
    upstream,
  );
  if (isErr(setUpstreamResult)) {
    // Log the error but don't fail the checkout
    console.warn(
      `Warning: Could not set upstream branch: ${setUpstreamResult.error.message}`,
    );
  }

  // Attach the worktree to the fetched branch
  const attachResult = await attachWorktreeCore(
    context.gitRoot,
    context.worktreesDirectory,
    worktreeName,
    context.config,
  );

  if (isErr(attachResult)) {
    if (attachResult.error instanceof WorktreeAlreadyExistsError) {
      // For already exists case, we need to construct the path
      const worktreePath = getWorktreePathFromDirectory(
        context.worktreesDirectory,
        worktreeName,
      );
      return ok({
        message: `Worktree for PR #${pullRequest.number} is already checked out`,
        worktree: worktreeName,
        path: worktreePath,
        alreadyExists: true,
      });
    }
    return err(attachResult.error);
  }

  const message = pullRequest.isFromFork
    ? `Checked out PR #${pullRequest.number} from fork ${pullRequest.head.repo.full_name}`
    : `Checked out PR #${pullRequest.number} from branch ${pullRequest.head.ref}`;

  return ok({
    message,
    worktree: worktreeName,
    path: attachResult.value,
  });
}
