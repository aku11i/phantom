import { parseArgs } from "node:util";
import {
  createContext,
  runPostCreate,
  selectWorktreeWithFzf,
  validateWorktreeExists,
  WorktreeNotFoundError,
} from "@aku11i/phantom-core";
import { getCurrentWorktree, getGitRoot } from "@aku11i/phantom-git";
import { isErr } from "@aku11i/phantom-shared";
import { exitCodes, exitWithError, exitWithSuccess } from "../errors.ts";
import { output } from "../output.ts";

export async function postCreateHandler(args: string[]): Promise<void> {
  const { positionals, values } = parseArgs({
    args,
    options: {
      current: {
        type: "boolean",
      },
      fzf: {
        type: "boolean",
        default: false,
      },
    },
    strict: true,
    allowPositionals: true,
  });

  const useCurrent = values.current ?? false;
  const useFzf = values.fzf ?? false;

  if (positionals.length === 0 && !useCurrent && !useFzf) {
    exitWithError(
      "Please provide a worktree name, use --current to target the current worktree, or use --fzf for interactive selection",
      exitCodes.validationError,
    );
  }

  if ((positionals.length > 0 || useFzf) && useCurrent) {
    exitWithError(
      "Cannot specify --current with a worktree name or --fzf option",
      exitCodes.validationError,
    );
  }

  if (positionals.length > 0 && useFzf) {
    exitWithError(
      "Cannot specify both a worktree name and --fzf option",
      exitCodes.validationError,
    );
  }

  if (positionals.length > 1) {
    exitWithError(
      "Please provide only one worktree name",
      exitCodes.validationError,
    );
  }

  try {
    const gitRoot = await getGitRoot();
    const context = await createContext(gitRoot);

    let worktreeName: string;

    if (useCurrent) {
      const currentWorktree = await getCurrentWorktree(gitRoot);
      if (!currentWorktree) {
        exitWithError(
          "Not in a worktree directory. The --current option can only be used from within a worktree.",
          exitCodes.validationError,
        );
      }
      worktreeName = currentWorktree;
    } else if (useFzf) {
      const selectResult = await selectWorktreeWithFzf(context.gitRoot);
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

    const validation = await validateWorktreeExists(
      context.gitRoot,
      context.worktreesDirectory,
      worktreeName,
    );
    if (isErr(validation)) {
      const exitCode =
        validation.error instanceof WorktreeNotFoundError
          ? exitCodes.notFound
          : exitCodes.generalError;
      exitWithError(validation.error.message, exitCode);
    }

    const postCreateCopyFiles = context.config?.postCreate?.copyFiles;
    const postCreateCommands = context.config?.postCreate?.commands;

    if (!postCreateCopyFiles?.length && !postCreateCommands?.length) {
      output.warn("No post-create actions configured in phantom.config.json.");
      exitWithSuccess();
    }

    const postCreateResult = await runPostCreate({
      gitRoot: context.gitRoot,
      worktreesDirectory: context.worktreesDirectory,
      worktreeName,
      copyFiles: postCreateCopyFiles,
      commands: postCreateCommands,
    });

    if (isErr(postCreateResult)) {
      exitWithError(postCreateResult.error.message, exitCodes.generalError);
    }

    if (postCreateResult.value.copyError) {
      output.warn(
        `Warning: Failed to copy some files: ${postCreateResult.value.copyError}`,
      );
    }

    output.log(`Re-ran post-create actions in '${worktreeName}'.`);
    exitWithSuccess();
  } catch (error) {
    exitWithError(
      error instanceof Error ? error.message : String(error),
      exitCodes.generalError,
    );
  }
}
