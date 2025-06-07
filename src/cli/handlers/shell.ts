import { parseArgs } from "node:util";
import { getGitRoot } from "../../core/git/libs/get-git-root.ts";
import { shellInWorktree as shellInWorktreeCore } from "../../core/process/shell.ts";
import { isErr } from "../../core/types/result.ts";
import { WorktreeNotFoundError } from "../../core/worktree/errors.ts";
import { selectWorktreeWithFzf } from "../../core/worktree/select.ts";
import { validateWorktreeExists } from "../../core/worktree/validate.ts";
import { exitCodes, exitWithError, exitWithSuccess } from "../errors.ts";
import { output } from "../output.ts";

export async function shellHandler(args: string[]): Promise<void> {
  const { positionals, values } = parseArgs({
    args,
    options: {
      fzf: {
        type: "boolean",
        default: false,
      },
    },
    strict: true,
    allowPositionals: true,
  });

  const useFzf = values.fzf ?? false;

  if (positionals.length === 0 && !useFzf) {
    exitWithError(
      "Usage: phantom shell <worktree-name> or phantom shell --fzf",
      exitCodes.validationError,
    );
  }

  if (positionals.length > 0 && useFzf) {
    exitWithError(
      "Cannot specify both a worktree name and --fzf option",
      exitCodes.validationError,
    );
  }

  let worktreeName: string;

  try {
    const gitRoot = await getGitRoot();

    if (useFzf) {
      const selectResult = await selectWorktreeWithFzf(gitRoot);
      if (isErr(selectResult)) {
        exitWithError(selectResult.error.message, exitCodes.generalError);
      }
      if (!selectResult.value) {
        exitWithSuccess();
      }
      worktreeName = selectResult.value.name;
    } else {
      worktreeName = positionals[0];
    }

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

    if (isErr(result)) {
      const exitCode =
        result.error instanceof WorktreeNotFoundError
          ? exitCodes.notFound
          : result.error.exitCode || exitCodes.generalError;
      exitWithError(result.error.message, exitCode);
    }

    process.exit(result.value.exitCode);
  } catch (error) {
    exitWithError(
      error instanceof Error ? error.message : String(error),
      exitCodes.generalError,
    );
  }
}
