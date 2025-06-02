import { shellInWorktree } from "../../commands/shell.js";
import { createWorktree as createWorktreeCore } from "../../core/worktree/create.js";
import { getGitRoot } from "../../git/libs/get-git-root.js";
import { exitCodes, exitWithError, exitWithSuccess } from "../errors.js";
import { output } from "../output.js";

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
    const result = await createWorktreeCore(worktreeName, gitRoot);

    if (!result.success) {
      exitWithError(result.message, exitCodes.generalError);
    }

    output.log(result.message);

    if (openShell) {
      output.log("Opening shell in new worktree...");
      await shellInWorktree(worktreeName);
    }

    exitWithSuccess();
  } catch (error) {
    exitWithError(
      error instanceof Error ? error.message : String(error),
      exitCodes.generalError,
    );
  }
}
