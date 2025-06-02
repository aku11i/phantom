import { getGitRoot } from "../../core/git/libs/get-git-root.ts";
import { shellInWorktree } from "../../core/process/shell.ts";
import { createWorktree as createWorktreeCore } from "../../core/worktree/create.ts";
import { exitCodes, exitWithError, exitWithSuccess } from "../errors.ts";
import { output } from "../output.ts";

export async function createHandler(args: string[]): Promise<void> {
  const openShell = args.includes("--shell");
  const filteredArgs = args.filter((arg) => arg !== "--shell");

  if (filteredArgs.length === 0) {
    exitWithError(
      "Please provide a name for the new worktree",
      exitCodes.validationError,
    );
  }

  const worktreeName = filteredArgs[0];

  try {
    const gitRoot = await getGitRoot();
    const result = await createWorktreeCore(gitRoot, worktreeName);

    if (!result.success) {
      exitWithError(result.message, exitCodes.generalError);
    }

    output.log(result.message);

    if (openShell && result.path) {
      output.log(`\nEntering worktree '${worktreeName}' at ${result.path}`);
      output.log("Type 'exit' to return to your original directory\n");

      const shellResult = await shellInWorktree(gitRoot, worktreeName);

      if (!shellResult.success) {
        if (shellResult.message) {
          output.error(shellResult.message);
        }
        exitWithError("", shellResult.exitCode ?? exitCodes.generalError);
      }

      process.exit(shellResult.exitCode ?? 0);
    }

    exitWithSuccess();
  } catch (error) {
    exitWithError(
      error instanceof Error ? error.message : String(error),
      exitCodes.generalError,
    );
  }
}
