import { parseArgs } from "node:util";
import {
  createContext,
  execInWorktree as execInWorktreeCore,
  selectWorktreeWithFzf,
  validateWorktreeExists,
  WorktreeNotFoundError,
} from "@aku11i/phantom-core";
import { getGitRoot } from "@aku11i/phantom-git";
import {
  executeTmuxCommand,
  executeZellijCommand,
  getPhantomEnv,
  isInsideTmux,
  isInsideZellij,
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
      zellij: {
        type: "boolean",
        short: "z",
      },
      "zellij-vertical": {
        type: "boolean",
      },
      "zellij-v": {
        type: "boolean",
      },
      "zellij-horizontal": {
        type: "boolean",
      },
      "zellij-h": {
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

  // Determine zellij option
  const zellijOption =
    values.zellij ||
    values["zellij-vertical"] ||
    values["zellij-v"] ||
    values["zellij-horizontal"] ||
    values["zellij-h"];

  let zellijDirection: "new" | "vertical" | "horizontal" | undefined;
  if (values.zellij) {
    zellijDirection = "new";
  } else if (values["zellij-vertical"] || values["zellij-v"]) {
    zellijDirection = "vertical";
  } else if (values["zellij-horizontal"] || values["zellij-h"]) {
    zellijDirection = "horizontal";
  }

  if (tmuxOption && zellijOption) {
    exitWithError(
      "Cannot use --tmux and --zellij options together",
      exitCodes.validationError,
    );
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
    const context = await createContext(gitRoot);

    if (tmuxOption && !(await isInsideTmux())) {
      exitWithError(
        "The --tmux option can only be used inside a tmux session",
        exitCodes.validationError,
      );
    }

    if (zellijOption && !(await isInsideZellij())) {
      exitWithError(
        "The --zellij option can only be used inside a Zellij session",
        exitCodes.validationError,
      );
    }

    let worktreeName: string;

    if (useFzf) {
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

    // Validate worktree exists
    const validation = await validateWorktreeExists(
      context.gitRoot,
      context.worktreesDirectory,
      worktreeName,
    );
    if (isErr(validation)) {
      exitWithError(validation.error.message, exitCodes.generalError);
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
        output.error(tmuxResult.error.message);
        const exitCode =
          "exitCode" in tmuxResult.error
            ? (tmuxResult.error.exitCode ?? exitCodes.generalError)
            : exitCodes.generalError;
        exitWithError("", exitCode);
      }

      exitWithSuccess();
    }

    if (zellijDirection) {
      output.log(
        `Executing command in worktree '${worktreeName}' in Zellij ${
          zellijDirection === "new" ? "tab" : "pane"
        }...`,
      );

      const [command, ...args] = commandArgs;

      const zellijResult = await executeZellijCommand({
        direction: zellijDirection,
        command,
        args,
        cwd: validation.value.path,
        env: getPhantomEnv(worktreeName, validation.value.path),
        tabName: zellijDirection === "new" ? worktreeName : undefined,
      });

      if (isErr(zellijResult)) {
        output.error(zellijResult.error.message);
        const exitCode =
          "exitCode" in zellijResult.error
            ? (zellijResult.error.exitCode ?? exitCodes.generalError)
            : exitCodes.generalError;
        exitWithError("", exitCode);
      }

      exitWithSuccess();
    }

    const result = await execInWorktreeCore(
      context.gitRoot,
      context.worktreesDirectory,
      worktreeName,
      commandArgs,
      { interactive: true },
    );

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
