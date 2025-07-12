import {
  WorktreeAlreadyExistsError,
  attachWorktreeCore,
  createContext,
  getWorktreePathFromDirectory,
  validateWorktreeExists,
} from "@aku11i/phantom-core";
import { fetch, getGitRoot, setUpstreamBranch } from "@aku11i/phantom-git";
import {
  type Logger,
  type Result,
  err,
  isErr,
  noopLogger,
  ok,
} from "@aku11i/phantom-shared";
import type { GitHubPullRequest } from "../api/index.ts";

export interface CheckoutResult {
  message: string;
  worktree: string;
  path: string;
  alreadyExists?: boolean;
}

export async function checkoutPullRequest(
  pullRequest: GitHubPullRequest,
  logger: Logger = noopLogger,
): Promise<Result<CheckoutResult>> {
  const gitRoot = await getGitRoot();
  const context = await createContext(gitRoot);
  const worktreeName = `pulls/${pullRequest.number}`;
  const localBranch = `pulls/${pullRequest.number}`;

  // Check if worktree already exists before attempting to fetch
  const existsResult = await validateWorktreeExists(
    context.gitRoot,
    context.worktreesDirectory,
    worktreeName,
  );

  if (!isErr(existsResult)) {
    // Worktree already exists, return its path
    return ok({
      message: `PR #${pullRequest.number} is already checked out`,
      worktree: worktreeName,
      path: existsResult.value.path,
      alreadyExists: true,
    });
  }

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
    logger.warn(
      `Warning: Could not set upstream branch: ${setUpstreamResult.error.message}`,
    );
  }

  // Attach the worktree to the fetched branch
  const attachResult = await attachWorktreeCore(
    context.gitRoot,
    context.worktreesDirectory,
    worktreeName,
    context.config?.postCreate?.copyFiles,
    context.config?.postCreate?.commands,
    logger,
  );

  if (isErr(attachResult)) {
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
