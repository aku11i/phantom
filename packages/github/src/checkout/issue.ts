import {
  WorktreeAlreadyExistsError,
  createWorktree as createWorktreeCore,
} from "@aku11i/phantom-core";
import { getGitRoot } from "@aku11i/phantom-git";
import { isErr } from "@aku11i/phantom-shared";
import { type GitHubIssue, isPullRequest } from "../api.ts";

export async function checkoutIssue(
  issue: GitHubIssue,
  base?: string,
): Promise<void> {
  if (isPullRequest(issue)) {
    throw new Error(
      `#${issue.number} is already linked to a pull request. Use the PR number instead.`,
    );
  }

  const gitRoot = await getGitRoot();
  const worktreeName = `issue-${issue.number}`;
  const branchName = `issue-${issue.number}`;

  const result = await createWorktreeCore(gitRoot, worktreeName, {
    branch: branchName,
    base,
  });

  if (isErr(result)) {
    if (result.error instanceof WorktreeAlreadyExistsError) {
      console.log(`Worktree for issue #${issue.number} is already checked out`);
      return;
    }
    throw result.error;
  }

  console.log(result.value.message);
}
