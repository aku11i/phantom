import {
  WorktreeAlreadyExistsError,
  createWorktree as createWorktreeCore,
} from "@aku11i/phantom-core";
import { getGitRoot } from "@aku11i/phantom-git";
import { isErr } from "@aku11i/phantom-shared";
import type { GitHubPullRequest } from "../api/index.ts";

export async function checkoutPullRequest(
  pullRequest: GitHubPullRequest,
): Promise<void> {
  const gitRoot = await getGitRoot();
  const worktreeName = `pr-${pullRequest.number}`;

  const result = await createWorktreeCore(gitRoot, worktreeName, {
    branch: pullRequest.head.ref,
    base: `origin/${pullRequest.head.ref}`,
  });

  if (isErr(result)) {
    if (result.error instanceof WorktreeAlreadyExistsError) {
      console.log(
        `Worktree for PR #${pullRequest.number} is already checked out`,
      );
      return;
    }
    throw result.error;
  }

  console.log(result.value.message);
}
