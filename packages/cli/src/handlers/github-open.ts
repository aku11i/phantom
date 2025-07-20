import { parseArgs } from "node:util";
import { createContext, getWorktreeInfo } from "@aku11i/phantom-core";
import { getCurrentWorktree, getGitRoot } from "@aku11i/phantom-git";
import {
  fetchIssue,
  getGitHubRepoInfo,
  isPullRequest,
} from "@aku11i/phantom-github";
import { spawnProcess } from "@aku11i/phantom-process";
import { isErr } from "@aku11i/phantom-shared";
import { exitCodes, exitWithError } from "../errors.ts";
import { output } from "../output.ts";

export const gitHubOpenHandler = async (args: string[]) => {
  const { positionals } = parseArgs({
    args,
    options: {},
    allowPositionals: true,
  });

  const { owner, repo } = await getGitHubRepoInfo();

  const specifiedNumber = positionals[0];

  if (specifiedNumber === undefined) {
    // If no number specified, try to detect from worktree or open repo page
    try {
      const gitRoot = await getGitRoot();
      const currentWorktree = await getCurrentWorktree(gitRoot);

      if (currentWorktree) {
        // We're in a worktree, get the full worktree info
        const context = await createContext(gitRoot);
        const worktreeInfo = await getWorktreeInfo(
          gitRoot,
          context.worktreesDirectory,
          currentWorktree,
        );

        // Extract worktree name from path (last segment)
        const pathSegments = worktreeInfo.path.split("/");
        const worktreeName = pathSegments[pathSegments.length - 1];

        // Try to extract number from worktree name patterns like "pulls/123" or "issues/456"
        const pullMatch = worktreeName.match(/^pulls\/(\d+)$/);
        const issueMatch = worktreeName.match(/^issues\/(\d+)$/);

        if (pullMatch) {
          const prNumber = pullMatch[1];
          const result = await spawnProcess({
            command: "gh",
            args: ["pr", "view", prNumber, "--web"],
          });

          if (isErr(result)) {
            exitWithError(result.error.message, exitCodes.generalError);
          }

          output.log(
            `Opening PR #${prNumber} (from worktree: ${worktreeName}) in browser...`,
          );
          return;
        }
        if (issueMatch) {
          const issueNumber = issueMatch[1];
          const result = await spawnProcess({
            command: "gh",
            args: ["issue", "view", issueNumber, "--web"],
          });

          if (isErr(result)) {
            exitWithError(result.error.message, exitCodes.generalError);
          }

          output.log(
            `Opening issue #${issueNumber} (from worktree: ${worktreeName}) in browser...`,
          );
          return;
        }
      }
    } catch (_error) {
      // If we can't get git root or worktree info, just ignore and open repo page
    }

    // Open repository page
    const result = await spawnProcess({
      command: "gh",
      args: ["browse"],
    });

    if (isErr(result)) {
      exitWithError(result.error.message, exitCodes.generalError);
    }

    output.log(`Opening repository ${owner}/${repo} in browser...`);
  } else {
    // A number was specified, fetch from /issues/:number endpoint first
    const issue = await fetchIssue(owner, repo, specifiedNumber);

    if (!issue) {
      exitWithError(
        `GitHub issue or pull request #${specifiedNumber} not found or you don't have permission to access it.`,
        exitCodes.generalError,
      );
    }

    // Check if it's a pull request
    if (isPullRequest(issue)) {
      const result = await spawnProcess({
        command: "gh",
        args: ["pr", "view", specifiedNumber, "--web"],
      });

      if (isErr(result)) {
        exitWithError(result.error.message, exitCodes.generalError);
      }

      output.log(`Opening PR #${specifiedNumber} in browser...`);
    } else {
      const result = await spawnProcess({
        command: "gh",
        args: ["issue", "view", specifiedNumber, "--web"],
      });

      if (isErr(result)) {
        exitWithError(result.error.message, exitCodes.generalError);
      }

      output.log(`Opening issue #${specifiedNumber} in browser...`);
    }
  }
};
