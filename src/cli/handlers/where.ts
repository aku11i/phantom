import { whereWorktree as whereWorktreeCore } from "../../commands/where.ts";
import { exitCodes, exitWithError, exitWithSuccess } from "../errors.ts";
import { output } from "../output.ts";

export async function whereHandler(args: string[]): Promise<void> {
  if (args.length === 0) {
    exitWithError("Please provide a worktree name", exitCodes.validationError);
  }

  const worktreeName = args[0];

  try {
    const result = await whereWorktreeCore(worktreeName);

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
