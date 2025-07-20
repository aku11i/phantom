import { parseArgs } from "node:util";
import { createContext, getWorktreeInfo } from "@aku11i/phantom-core";
import { getCurrentWorktree, getGitRoot } from "@aku11i/phantom-git";
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

  const gitRoot = await getGitRoot();
  const context = await createContext(gitRoot);

  let worktreeName: string;

  // Get worktree name - either from argument or current worktree
  const specifiedWorktree = positionals[0];
  if (specifiedWorktree) {
    worktreeName = specifiedWorktree;
  } else {
    // Try to get current worktree
    const currentWorktree = await getCurrentWorktree(gitRoot);
    if (!currentWorktree) {
      // Not in a worktree, open repository page
      const result = await spawnProcess({
        command: "gh",
        args: ["browse"],
      });

      if (isErr(result)) {
        exitWithError(result.error.message, exitCodes.generalError);
      }

      output.log("Opening repository in browser...");
      return;
    }

    // Get worktree info to extract name from path
    const worktreeInfo = await getWorktreeInfo(
      gitRoot,
      context.worktreesDirectory,
      currentWorktree,
    );

    // Extract worktree name from path (last segment)
    const pathSegments = worktreeInfo.path.split("/");
    worktreeName = pathSegments[pathSegments.length - 1];
  }

  // Check if worktree name matches pulls/<number> or issues/<number>
  const match = worktreeName.match(/^(pulls|issues)\/(\d+)$/);

  if (match) {
    const number = match[2];
    const result = await spawnProcess({
      command: "gh",
      args: ["browse", number],
    });

    if (isErr(result)) {
      exitWithError(result.error.message, exitCodes.generalError);
    }

    output.log(
      `Opening #${number} (from worktree: ${worktreeName}) in browser...`,
    );
  } else {
    // Worktree name doesn't match pattern, open repository page
    const result = await spawnProcess({
      command: "gh",
      args: ["browse"],
    });

    if (isErr(result)) {
      exitWithError(result.error.message, exitCodes.generalError);
    }

    output.log("Opening repository in browser...");
  }
};
