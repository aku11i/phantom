import { parseArgs } from "node:util";
import {
  ConfigNotFoundError,
  ConfigParseError,
  loadConfig,
} from "../../core/config/loader.ts";
import { ConfigValidationError } from "../../core/config/validate.ts";
import { getCurrentWorktree } from "../../core/git/libs/get-current-worktree.ts";
import { getGitRoot } from "../../core/git/libs/get-git-root.ts";
import { execInWorktree } from "../../core/process/exec.ts";
import { isErr, isOk } from "../../core/types/result.ts";
import { deleteWorktree as deleteWorktreeCore } from "../../core/worktree/delete.ts";
import {
  WorktreeError,
  WorktreeNotFoundError,
} from "../../core/worktree/errors.ts";
import { selectWorktreeWithFzf } from "../../core/worktree/select.ts";
import { exitCodes, exitWithError, exitWithSuccess } from "../errors.ts";
import { output } from "../output.ts";

export async function deleteHandler(args: string[]): Promise<void> {
  const { values, positionals } = parseArgs({
    args,
    options: {
      force: {
        type: "boolean",
        short: "f",
      },
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

  const deleteCurrent = values.current ?? false;
  const useFzf = values.fzf ?? false;

  if (positionals.length === 0 && !deleteCurrent && !useFzf) {
    exitWithError(
      "Please provide a worktree name to delete, use --current to delete the current worktree, or use --fzf for interactive selection",
      exitCodes.validationError,
    );
  }

  if ((positionals.length > 0 || useFzf) && deleteCurrent) {
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

  const forceDelete = values.force ?? false;

  try {
    const gitRoot = await getGitRoot();

    // Load config to check for post-delete commands
    const configResult = await loadConfig(gitRoot);
    if (isErr(configResult)) {
      // Display warning for validation and parse errors
      if (configResult.error instanceof ConfigValidationError) {
        output.warn(`Configuration warning: ${configResult.error.message}`);
      } else if (configResult.error instanceof ConfigParseError) {
        output.warn(`Configuration warning: ${configResult.error.message}`);
      }
      // ConfigNotFoundError remains silent as the config file is optional
    }

    let worktreeName: string;
    if (deleteCurrent) {
      const currentWorktree = await getCurrentWorktree(gitRoot);
      if (!currentWorktree) {
        exitWithError(
          "Not in a worktree directory. The --current option can only be used from within a worktree.",
          exitCodes.validationError,
        );
      }
      worktreeName = currentWorktree;
    } else if (useFzf) {
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

    const result = await deleteWorktreeCore(gitRoot, worktreeName, {
      force: forceDelete,
    });

    if (isErr(result)) {
      const exitCode =
        result.error instanceof WorktreeNotFoundError
          ? exitCodes.validationError
          : result.error instanceof WorktreeError &&
              result.error.message.includes("uncommitted changes")
            ? exitCodes.validationError
            : exitCodes.generalError;
      exitWithError(result.error.message, exitCode);
    }

    output.log(result.value.message);

    // Execute post-delete commands from config
    if (isOk(configResult) && configResult.value.postDelete?.commands) {
      const commands = configResult.value.postDelete.commands;
      output.log("\nRunning post-delete commands...");

      for (const command of commands) {
        output.log(`Executing: ${command}`);
        const shell = process.env.SHELL || "/bin/sh";
        const cmdResult = await execInWorktree(gitRoot, ".", [
          shell,
          "-c",
          command,
        ]);

        if (isErr(cmdResult)) {
          output.error(`Failed to execute command: ${cmdResult.error.message}`);
          const exitCode =
            "exitCode" in cmdResult.error
              ? (cmdResult.error.exitCode ?? exitCodes.generalError)
              : exitCodes.generalError;
          exitWithError(`Post-delete command failed: ${command}`, exitCode);
        }

        // Check exit code
        if (cmdResult.value.exitCode !== 0) {
          exitWithError(
            `Post-delete command failed: ${command}`,
            cmdResult.value.exitCode,
          );
        }
      }
    }

    exitWithSuccess();
  } catch (error) {
    exitWithError(
      error instanceof Error ? error.message : String(error),
      exitCodes.generalError,
    );
  }
}
