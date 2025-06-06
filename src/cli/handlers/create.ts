import { parseArgs } from "node:util";
import { getGitRoot } from "../../core/git/libs/get-git-root.ts";
import { execInWorktree } from "../../core/process/exec.ts";
import { shellInWorktree } from "../../core/process/shell.ts";
import {
  executeTmuxCommand,
  isInsideTmux,
  parseTmuxDirection,
} from "../../core/process/tmux.ts";
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
        type: "string",
        short: "t",
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
  const tmuxOption = values.tmux;

  if (
    [openShell, execCommand !== undefined, tmuxOption !== undefined].filter(
      Boolean,
    ).length > 1
  ) {
    exitWithError(
      "Cannot use --shell, --exec, and --tmux options together",
      exitCodes.validationError,
    );
  }

  if (tmuxOption !== undefined && !(await isInsideTmux())) {
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

    if (tmuxOption !== undefined && isOk(result)) {
      const direction = parseTmuxDirection(
        tmuxOption === "" ? true : tmuxOption,
      );
      const shell = process.env.SHELL || "/bin/sh";

      output.log(
        `\nOpening worktree '${worktreeName}' in tmux ${direction === "new" ? "window" : "pane"}...`,
      );

      const tmuxResult = await executeTmuxCommand({
        direction,
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
