import { parseArgs } from "node:util";
import { getGitRoot } from "../../core/git/libs/get-git-root.ts";
import { isErr } from "../../core/types/result.ts";
import { selectWorktreeWithFzf } from "../../core/worktree/select.ts";
import { whereWorktree as whereWorktreeCore } from "../../core/worktree/where.ts";
import { exitCodes, exitWithError, exitWithSuccess } from "../errors.ts";
import { output } from "../output.ts";

export async function whereHandler(args: string[]): Promise<void> {
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
      "Usage: phantom where <worktree-name> or phantom where --fzf",
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
  let gitRoot: string;

  try {
    gitRoot = await getGitRoot();
  } catch (error) {
    exitWithError(
      error instanceof Error ? error.message : String(error),
      exitCodes.generalError,
    );
  }

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

  const result = await whereWorktreeCore(gitRoot, worktreeName);

  if (isErr(result)) {
    exitWithError(result.error.message, exitCodes.notFound);
  }

  output.log(result.value.path);
  exitWithSuccess();
}
