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

  const result = await createWorktreeCore(gitRoot, worktreeName, {
    branch: pullRequest.head.ref,
    base: `origin/${pullRequest.head.ref}`,
  });

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
