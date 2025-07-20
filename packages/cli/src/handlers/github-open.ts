import { parseArgs } from "node:util";
import { getCurrentWorktree, getGitRoot } from "@aku11i/phantom-git";
import { getGitHubRepoInfo } from "@aku11i/phantom-github";
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

  let owner: string;
  let repo: string;

  try {
    const repoInfo = await getGitHubRepoInfo();
    owner = repoInfo.owner;
    repo = repoInfo.repo;
  } catch (error) {
    exitWithError(
      error instanceof Error ? error.message : "Failed to get repository info",
      exitCodes.generalError,
    );
  }

  const specifiedNumber = positionals[0];

  if (specifiedNumber === undefined) {
    // If no number specified, try to detect from worktree or open repo page
    try {
      const gitRoot = await getGitRoot();
      const currentWorktree = await getCurrentWorktree(gitRoot);

      if (currentWorktree) {
        // We're in a worktree, try to extract PR/issue number from worktree name
        const name = currentWorktree;

        // Try to extract number from worktree name patterns like "pulls/123" or "issues/456"
        const pullMatch = name.match(/^pulls\/(\d+)$/);
        const issueMatch = name.match(/^issues\/(\d+)$/);

        if (pullMatch) {
          const prNumber = pullMatch[1];
          const result = await spawnProcess({
            command: "gh",
            args: ["pr", "view", prNumber, "--web"],
          });

          if (isErr(result)) {
            exitWithError(result.error.message, exitCodes.generalError);
          }

          output.log(`Opening PR #${prNumber} in browser...`);
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

          output.log(`Opening issue #${issueNumber} in browser...`);
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
    // A number was specified, determine if it's a PR or issue
    // First try as PR, if that fails, try as issue
    const prResult = await spawnProcess({
      command: "gh",
      args: ["pr", "view", specifiedNumber, "--web"],
    });

    if (!isErr(prResult)) {
      output.log(`Opening PR #${specifiedNumber} in browser...`);
      return;
    }

    // Try as issue
    const issueResult = await spawnProcess({
      command: "gh",
      args: ["issue", "view", specifiedNumber, "--web"],
    });

    if (isErr(issueResult)) {
      exitWithError(
        `Failed to open #${specifiedNumber}: Not found as PR or issue`,
        exitCodes.generalError,
      );
    }

    output.log(`Opening issue #${specifiedNumber} in browser...`);
  }
};
