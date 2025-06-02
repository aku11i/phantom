import { getGitRoot } from "../../core/git/libs/get-git-root.ts";
import { shellInWorktree as shellInWorktreeCore } from "../../core/process/shell.ts";
import { validateWorktreeExists } from "../../core/worktree/validate.ts";
import { exitCodes, exitWithError } from "../errors.ts";
import { output } from "../output.ts";

export async function shellHandler(args: string[]): Promise<void> {
  if (args.length === 0) {
    exitWithError(
      "Usage: phantom shell <worktree-name>",
      exitCodes.validationError,
    );
  }

  const worktreeName = args[0];

  try {
    const gitRoot = await getGitRoot();

    // Get worktree path for display
    const validation = await validateWorktreeExists(gitRoot, worktreeName);
    if (!validation.exists) {
      exitWithError(
        validation.message || `Worktree '${worktreeName}' not found`,
        exitCodes.generalError,
      );
    }

    output.log(`Entering worktree '${worktreeName}' at ${validation.path}`);
    output.log("Type 'exit' to return to your original directory\n");

    const result = await shellInWorktreeCore(gitRoot, worktreeName);

    if (!result.success && result.message) {
      exitWithError(result.message, result.exitCode || exitCodes.generalError);
    }

    process.exit(result.exitCode || 0);
  } catch (error) {
    exitWithError(
      error instanceof Error ? error.message : String(error),
      exitCodes.generalError,
    );
  }
}
