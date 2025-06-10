import { parseArgs } from "node:util";
import {
  selectWorktreeWithFzf,
  whereWorktree as whereWorktreeCore,
} from "@aku11i/phantom-core";
import { getGitRoot } from "@aku11i/phantom-git";
import { isErr } from "@aku11i/phantom-shared";
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
      exitWithError(
        selectResult.error instanceof Error
          ? selectResult.error.message
          : String(selectResult.error),
        exitCodes.generalError,
      );
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
    exitWithError(
      result.error instanceof Error
        ? result.error.message
        : String(result.error),
      exitCodes.notFound,
    );
  }

  output.log(result.value.path);
  exitWithSuccess();
}
