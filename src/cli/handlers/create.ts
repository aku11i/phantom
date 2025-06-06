import { parseArgs } from "node:util";
import { getGitRoot } from "../../core/git/libs/get-git-root.ts";
import { execInWorktree } from "../../core/process/exec.ts";
import { shellInWorktree } from "../../core/process/shell.ts";
import { executeTmuxCommand, isInsideTmux } from "../../core/process/tmux.ts";
import { isErr, isOk } from "../../core/types/result.ts";
import { createWorktree as createWorktreeCore } from "../../core/worktree/create.ts";
import { WorktreeAlreadyExistsError } from "../../core/worktree/errors.ts";
import { exitCodes, exitWithError, exitWithSuccess } from "../errors.ts";
import { output } from "../output.ts";

export async function createHandler(args: string[]): Promise<void> {
  const { values, positionals } = parseArgs({
    args,
    options: {
      shell: {
        type: "boolean",
        short: "s",
      },
      exec: {
        type: "string",
        short: "x",
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

  if (positionals.length === 0) {
    exitWithError(
      "Please provide a name for the new worktree",
      exitCodes.validationError,
    );
  }

  const worktreeName = positionals[0];
  const openShell = values.shell ?? false;
  const execCommand = values.exec;

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

  if (
    [openShell, execCommand !== undefined, tmuxOption].filter(Boolean).length >
    1
  ) {
    exitWithError(
      "Cannot use --shell, --exec, and --tmux options together",
      exitCodes.validationError,
    );
  }

  if (tmuxOption && !(await isInsideTmux())) {
    exitWithError(
      "The --tmux option can only be used inside a tmux session",
      exitCodes.validationError,
    );
  }

  try {
    const gitRoot = await getGitRoot();
    const result = await createWorktreeCore(gitRoot, worktreeName);

    if (isErr(result)) {
      const exitCode =
        result.error instanceof WorktreeAlreadyExistsError
          ? exitCodes.validationError
          : exitCodes.generalError;
      exitWithError(result.error.message, exitCode);
    }

    output.log(result.value.message);

    if (execCommand && isOk(result)) {
      output.log(
        `\nExecuting command in worktree '${worktreeName}': ${execCommand}`,
      );

      const shell = process.env.SHELL || "/bin/sh";
      const execResult = await execInWorktree(gitRoot, worktreeName, [
        shell,
        "-c",
        execCommand,
      ]);

      if (isErr(execResult)) {
        output.error(execResult.error.message);
        const exitCode =
          "exitCode" in execResult.error
            ? (execResult.error.exitCode ?? exitCodes.generalError)
            : exitCodes.generalError;
        exitWithError("", exitCode);
      }

      process.exit(execResult.value.exitCode ?? 0);
    }

    if (openShell && isOk(result)) {
      output.log(
        `\nEntering worktree '${worktreeName}' at ${result.value.path}`,
      );
      output.log("Type 'exit' to return to your original directory\n");

      const shellResult = await shellInWorktree(gitRoot, worktreeName);

      if (isErr(shellResult)) {
        output.error(shellResult.error.message);
        const exitCode =
          "exitCode" in shellResult.error
            ? (shellResult.error.exitCode ?? exitCodes.generalError)
            : exitCodes.generalError;
        exitWithError("", exitCode);
      }

      process.exit(shellResult.value.exitCode ?? 0);
    }

    if (tmuxDirection && isOk(result)) {
      const shell = process.env.SHELL || "/bin/sh";

      output.log(
        `\nOpening worktree '${worktreeName}' in tmux ${tmuxDirection === "new" ? "window" : "pane"}...`,
      );

      const tmuxResult = await executeTmuxCommand({
        direction: tmuxDirection,
        command: `${shell} -c 'cd ${result.value.path} && PHANTOM=1 PHANTOM_NAME=${worktreeName} PHANTOM_PATH=${result.value.path} exec ${shell}'`,
        cwd: result.value.path,
      });

      if (isErr(tmuxResult)) {
        output.error(tmuxResult.error.message);
        const exitCode =
          "exitCode" in tmuxResult.error
            ? (tmuxResult.error.exitCode ?? exitCodes.generalError)
            : exitCodes.generalError;
        exitWithError("", exitCode);
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
