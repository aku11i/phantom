import { parseArgs } from "node:util";
import { getGitRoot } from "../../core/git/libs/get-git-root.ts";
import { whereWorktree as whereWorktreeCore } from "../../core/worktree/where.ts";
import { exitCodes, exitWithError, exitWithSuccess } from "../errors.ts";
import { output } from "../output.ts";

export async function whereHandler(args: string[]): Promise<void> {
  const { positionals } = parseArgs({
    args,
    options: {},
    strict: true,
    allowPositionals: true,
  });

  if (positionals.length === 0) {
    exitWithError("Please provide a worktree name", exitCodes.validationError);
  }

  const worktreeName = positionals[0];

  try {
    const gitRoot = await getGitRoot();
    const result = await whereWorktreeCore(gitRoot, worktreeName);

    if (!result.success || !result.path) {
      exitWithError(result.message || "Worktree not found", exitCodes.notFound);
    }

    output.log(result.path);
    exitWithSuccess();
  } catch (error) {
    exitWithError(
      error instanceof Error ? error.message : String(error),
      exitCodes.generalError,
    );
  }
}
