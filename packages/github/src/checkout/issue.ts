import {
  WorktreeAlreadyExistsError,
  createContext,
  createWorktree as createWorktreeCore,
  getWorktreePathFromDirectory,
} from "@aku11i/phantom-core";
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
  const context = await createContext(gitRoot);
  const worktreeName = `issue-${issue.number}`;
  const branchName = `issue-${issue.number}`;

  const result = await createWorktreeCore(
    context.gitRoot,
    context.worktreesDirectory,
    worktreeName,
    {
      branch: branchName,
      base,
    },
    context.config,
  );

  if (isErr(result)) {
    if (result.error instanceof WorktreeAlreadyExistsError) {
      // For already exists case, we need to construct the path
      const worktreePath = getWorktreePathFromDirectory(
        context.worktreesDirectory,
        worktreeName,
      );
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
    path: result.value.path,
  });
}
