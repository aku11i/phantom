import {
  WorktreeAlreadyExistsError,
  createWorktree as createWorktreeCore,
} from "@aku11i/phantom-core";
import { getGitRoot } from "@aku11i/phantom-git";
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

  // Check if PR is from a fork
  const isFromFork = !pullRequest.head.repo || 
    pullRequest.head.repo.full_name !== pullRequest.base.repo.full_name;

  let createOptions;
  if (isFromFork) {
    // For forked PRs, we need to fetch from the special GitHub ref
    // and create a local branch
    createOptions = {
      branch: `pr-${pullRequest.number}`,
      base: `origin/pull/${pullRequest.number}/head`,
    };
  } else {
    // For same-repo PRs, we can directly use the head branch
    createOptions = {
      branch: pullRequest.head.ref,
      base: `origin/${pullRequest.head.ref}`,
    };
  }

  const result = await createWorktreeCore(gitRoot, worktreeName, createOptions);

  if (isErr(result)) {
    if (result.error instanceof WorktreeAlreadyExistsError) {
      return ok({
        message: `Worktree for PR #${pullRequest.number} is already checked out`,
        alreadyExists: true,
      });
    }
    return err(result.error);
  }

  return ok({
    message: result.value.message,
  });
}
