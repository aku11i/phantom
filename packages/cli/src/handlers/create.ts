import { parseArgs } from "node:util";
import {
  ConfigNotFoundError,
  ConfigParseError,
  ConfigValidationError,
  WorktreeAlreadyExistsError,
  createWorktree as createWorktreeCore,
  execInWorktree,
  loadConfig,
  shellInWorktree,
} from "@aku11i/phantom-core";
import { getGitRoot } from "@aku11i/phantom-git";
import {
  executeTmuxCommand,
  getPhantomEnv,
  isInsideTmux,
} from "@aku11i/phantom-process";
import { isErr, isOk } from "@aku11i/phantom-shared";
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
      "copy-file": {
        type: "string",
        multiple: true,
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
  const copyFileOptions = values["copy-file"];

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

    let filesToCopy: string[] = [];

    // Load files from config
    const configResult = await loadConfig(gitRoot);
    if (isOk(configResult)) {
      if (configResult.value.postCreate?.copyFiles) {
        filesToCopy = [...configResult.value.postCreate.copyFiles];
      }
    } else {
      // Display warning for validation and parse errors
      if (configResult.error instanceof ConfigValidationError) {
        output.warn(`Configuration warning: ${configResult.error.message}`);
      } else if (configResult.error instanceof ConfigParseError) {
        output.warn(`Configuration warning: ${configResult.error.message}`);
      }
      // ConfigNotFoundError remains silent as the config file is optional
    }

    // Add files from CLI options
    if (copyFileOptions && copyFileOptions.length > 0) {
      const cliFiles = Array.isArray(copyFileOptions)
        ? copyFileOptions
        : [copyFileOptions];
      // Merge with config files, removing duplicates
      filesToCopy = [...new Set([...filesToCopy, ...cliFiles])];
    }

    const result = await createWorktreeCore(gitRoot, worktreeName, {
      copyFiles: filesToCopy.length > 0 ? filesToCopy : undefined,
    });

    if (isErr(result)) {
      const exitCode =
        result.error instanceof WorktreeAlreadyExistsError
          ? exitCodes.validationError
          : exitCodes.generalError;
      exitWithError(result.error.message, exitCode);
    }

    output.log(result.value.message);

    if (result.value.copyError) {
      output.error(
        `\nWarning: Failed to copy some files: ${result.value.copyError}`,
      );
    }

    // Execute post-create commands from config
    if (isOk(configResult) && configResult.value.postCreate?.commands) {
      const commands = configResult.value.postCreate.commands;
      output.log("\nRunning post-create commands...");

      for (const command of commands) {
        output.log(`Executing: ${command}`);
        const shell = process.env.SHELL || "/bin/sh";
        const cmdResult = await execInWorktree(gitRoot, worktreeName, [
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
          exitWithError(`Post-create command failed: ${command}`, exitCode);
        }

        // Check exit code
        if (cmdResult.value.exitCode !== 0) {
          exitWithError(
            `Post-create command failed: ${command}`,
            cmdResult.value.exitCode,
          );
        }
      }
    }

    if (execCommand && isOk(result)) {
      output.log(
        `\nExecuting command in worktree '${worktreeName}': ${execCommand}`,
      );

      const shell = process.env.SHELL || "/bin/sh";
      const execResult = await execInWorktree(
        gitRoot,
        worktreeName,
        [shell, "-c", execCommand],
        { interactive: true },
      );

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
      output.log(
        `\nOpening worktree '${worktreeName}' in tmux ${
          tmuxDirection === "new" ? "window" : "pane"
        }...`,
      );

      const shell = process.env.SHELL || "/bin/sh";

      const tmuxResult = await executeTmuxCommand({
        direction: tmuxDirection,
        command: shell,
        cwd: result.value.path,
        env: getPhantomEnv(worktreeName, result.value.path),
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
    }

    exitWithSuccess();
  } catch (error) {
    exitWithError(
      error instanceof Error ? error.message : String(error),
      exitCodes.generalError,
    );
  }
}
