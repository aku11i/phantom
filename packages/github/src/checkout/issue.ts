import {
  WorktreeAlreadyExistsError,
  createWorktree as createWorktreeCore,
} from "@aku11i/phantom-core";
import { getWorktreePath } from "@aku11i/phantom-core/src/paths.ts";
import { getGitRoot } from "@aku11i/phantom-git";
import { type Result, err, isErr, ok } from "@aku11i/phantom-shared";
import { type GitHubIssue, isPullRequest } from "../api/index.ts";
import type { CheckoutResult } from "./pr.ts";

export async function checkoutIssue(
  issue: GitHubIssue,
  base?: string,
): Promise<Result<CheckoutResult>> {
  if (isPullRequest(issue)) {
    return err(
      new Error(
        `#${issue.number} is a pull request, not an issue. Cannot checkout as an issue.`,
      ),
    );
  }

  const gitRoot = await getGitRoot();
  const worktreeName = `issue-${issue.number}`;
  const branchName = `issue-${issue.number}`;
  const worktreePath = getWorktreePath(gitRoot, worktreeName);

  const result = await createWorktreeCore(gitRoot, worktreeName, {
    branch: branchName,
    base,
  });

  if (isErr(result)) {
    if (result.error instanceof WorktreeAlreadyExistsError) {
      return ok({
        message: `Worktree for issue #${issue.number} is already checked out`,
        worktree: worktreeName,
        path: worktreePath,
        alreadyExists: true,
      });
    }
    return err(result.error);
  }

  return ok({
    message: result.value.message,
    worktree: worktreeName,
    path: worktreePath,
  });
}
