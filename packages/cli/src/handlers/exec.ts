import { parseArgs } from "node:util";
import {
  WorktreeNotFoundError,
  execInWorktree as execInWorktreeCore,
  selectWorktreeWithFzf,
  validateWorktreeExists,
} from "@aku11i/phantom-core";
import { getGitRoot } from "@aku11i/phantom-git";
import {
  executeTmuxCommand,
  getPhantomEnv,
  isInsideTmux,
} from "@aku11i/phantom-process";
import { isErr } from "@aku11i/phantom-shared";
import { exitCodes, exitWithError, exitWithSuccess } from "../errors.ts";
import { output } from "../output.ts";

export async function execHandler(args: string[]): Promise<void> {
  const { positionals, values } = parseArgs({
    args,
    options: {
      fzf: {
        type: "boolean",
        default: false,
      },
      tmux: {
        type: "boolean",
        short: "t",
      },
      "tmux-vertical": {
        type: "boolean",
      },
      "tmux-v": {
        type: "boolean",
      },
      "tmux-horizontal": {
        type: "boolean",
      },
      "tmux-h": {
        type: "boolean",
      },
    },
    strict: true,
    allowPositionals: true,
  });

  const useFzf = values.fzf ?? false;

  // Determine tmux option
  const tmuxOption =
    values.tmux ||
    values["tmux-vertical"] ||
    values["tmux-v"] ||
    values["tmux-horizontal"] ||
    values["tmux-h"];

  let tmuxDirection: "new" | "vertical" | "horizontal" | undefined;
  if (values.tmux) {
    tmuxDirection = "new";
  } else if (values["tmux-vertical"] || values["tmux-v"]) {
    tmuxDirection = "vertical";
  } else if (values["tmux-horizontal"] || values["tmux-h"]) {
    tmuxDirection = "horizontal";
  }

  let commandArgs: string[];

  if (useFzf) {
    if (positionals.length < 1) {
      exitWithError(
        "Usage: phantom exec --fzf <command> [args...]",
        exitCodes.validationError,
      );
    }
    commandArgs = positionals;
  } else {
    if (positionals.length < 2) {
      exitWithError(
        "Usage: phantom exec <worktree-name> <command> [args...]",
        exitCodes.validationError,
      );
    }
    commandArgs = positionals.slice(1);
  }

  try {
    const gitRoot = await getGitRoot();

    if (tmuxOption && !(await isInsideTmux())) {
      exitWithError(
        "The --tmux option can only be used inside a tmux session",
        exitCodes.validationError,
      );
    }

    let worktreeName: string;

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

    // Validate worktree exists
    const validation = await validateWorktreeExists(gitRoot, worktreeName);
    if (isErr(validation)) {
      exitWithError(
        validation.error instanceof Error
          ? validation.error.message
          : String(validation.error),
        exitCodes.generalError,
      );
    }

    if (tmuxDirection) {
      output.log(
        `Executing command in worktree '${worktreeName}' in tmux ${
          tmuxDirection === "new" ? "window" : "pane"
        }...`,
      );

      const [command, ...args] = commandArgs;

      const tmuxResult = await executeTmuxCommand({
        direction: tmuxDirection,
        command,
        args,
        cwd: validation.value.path,
        env: getPhantomEnv(worktreeName, validation.value.path),
        windowName: tmuxDirection === "new" ? worktreeName : undefined,
      });

      if (isErr(tmuxResult)) {
        output.error(
          tmuxResult.error instanceof Error
            ? tmuxResult.error.message
            : String(tmuxResult.error),
        );
        const exitCode =
          "exitCode" in tmuxResult.error
            ? (tmuxResult.error.exitCode ?? exitCodes.generalError)
            : exitCodes.generalError;
        exitWithError("", exitCode);
      }

      exitWithSuccess();
    }

    const result = await execInWorktreeCore(
      gitRoot,
      worktreeName,
      commandArgs,
      { interactive: true },
    );

    if (isErr(result)) {
      const exitCode =
        result.error instanceof WorktreeNotFoundError
          ? exitCodes.notFound
          : result.error.exitCode || exitCodes.generalError;
      exitWithError(
        result.error instanceof Error
          ? result.error.message
          : String(result.error),
        exitCode,
      );
    }

    process.exit(result.value.exitCode);
  } catch (error) {
    exitWithError(
      error instanceof Error ? error.message : String(error),
      exitCodes.generalError,
    );
  }
}
