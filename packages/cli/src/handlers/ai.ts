import { spawn } from "node:child_process";
import { parseArgs } from "node:util";
import { createContext, validateWorktreeExists } from "@aku11i/phantom-core";
import { getGitRoot } from "@aku11i/phantom-git";
import {
  createZellijSession,
  executeTmuxCommand,
  executeZellijCommand,
  getPhantomEnv,
  isInsideTmux,
  isInsideZellij,
} from "@aku11i/phantom-process";
import { isErr } from "@aku11i/phantom-shared";
import { exitCodes, exitWithError, exitWithSuccess } from "../errors.ts";
import {
  cleanupTemporaryLayout,
  createTemporaryLayout,
} from "../layouts/index.ts";
import { output } from "../output.ts";

export async function launchAiAssistant(
  aiCommand: string,
  worktreeName: string,
  worktreePath: string,
): Promise<number> {
  return new Promise((resolve, reject) => {
    const child = spawn(aiCommand, [], {
      cwd: worktreePath,
      env: {
        ...process.env,
        ...getPhantomEnv(worktreeName, worktreePath),
      },
      stdio: "inherit",
      shell: true,
    });

    child.on("error", (error) => {
      reject(error);
    });

    child.on("exit", (code, signal) => {
      if (signal) {
        reject(new Error(`Command exited with signal ${signal}`));
        return;
      }

      resolve(code ?? 0);
    });
  });
}

export async function aiHandler(args: string[]): Promise<void> {
  const { positionals, values } = parseArgs({
    args,
    options: {
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

  if (positionals.length !== 1) {
    exitWithError(
      "Usage: phantom ai <worktree-name>",
      exitCodes.validationError,
    );
  }

  const worktreeName = positionals[0];

  try {
    const gitRoot = await getGitRoot();
    const context = await createContext(gitRoot);
    const aiCommand = context.preferences.ai;

    if (!aiCommand) {
      exitWithError(
        "AI assistant is not configured. Run 'phantom preferences set ai <command>' first.",
        exitCodes.validationError,
      );
    }

    if (tmuxOption && !(await isInsideTmux())) {
      exitWithError(
        "The --tmux option can only be used inside a tmux session",
        exitCodes.validationError,
      );
    }

    const validation = await validateWorktreeExists(
      context.gitRoot,
      context.worktreesDirectory,
      worktreeName,
    );

    if (isErr(validation)) {
      exitWithError(validation.error.message, exitCodes.notFound);
    }

    if (tmuxDirection) {
      output.log(
        `Launching AI assistant in worktree '${worktreeName}' in tmux ${
          tmuxDirection === "new" ? "window" : "pane"
        }...`,
      );

      const tmuxResult = await executeTmuxCommand({
        direction: tmuxDirection,
        command: aiCommand,
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
      const insideZellij = await isInsideZellij();

      // Pane options require being inside Zellij
      if (
        (zellijDirection === "vertical" || zellijDirection === "horizontal") &&
        !insideZellij
      ) {
        exitWithError(
          "The --zellij-vertical and --zellij-horizontal options can only be used inside a Zellij session. Use --zellij to launch a new session.",
          exitCodes.validationError,
        );
      }

      if (insideZellij) {
        output.log(
          `Launching AI assistant in worktree '${worktreeName}' in Zellij ${
            zellijDirection === "new" ? "tab" : "pane"
          }...`,
        );

        const zellijResult = await executeZellijCommand({
          direction: zellijDirection,
          command: aiCommand,
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
      } else {
        // Launch new Zellij session with AI agent
        const zellijConfig = context.config?.zellij;

        // Parse AI command to get command and args
        const aiCommandParts = aiCommand.split(/\s+/);
        const agentCommand = aiCommandParts[0];
        const agentArgs = aiCommandParts.slice(1);

        // Determine layout path
        let layoutPath: string;
        let isTemporaryLayout = false;

        if (zellijConfig?.layout) {
          // Config-specified layout
          layoutPath = zellijConfig.layout;
        } else {
          // Generate temporary layout WITH agent
          layoutPath = await createTemporaryLayout({
            worktreePath: validation.value.path,
            worktreeName,
            agentCommand,
            agentArgs,
            noAgent: false,
          });
          isTemporaryLayout = true;
        }

        output.log(
          `Launching Zellij session '${worktreeName}' with AI assistant...`,
        );

        const zellijResult = await createZellijSession({
          sessionName: worktreeName.replaceAll("/", "-"),
          layout: layoutPath,
          cwd: validation.value.path,
          env: getPhantomEnv(worktreeName, validation.value.path),
        });

        // Cleanup temporary layout if we created one
        if (isTemporaryLayout) {
          await cleanupTemporaryLayout(layoutPath);
        }

        if (isErr(zellijResult)) {
          output.error(zellijResult.error.message);
          const exitCode =
            "exitCode" in zellijResult.error
              ? (zellijResult.error.exitCode ?? exitCodes.generalError)
              : exitCodes.generalError;
          exitWithError("", exitCode);
        }
      }

      exitWithSuccess();
    }

    output.log(`Launching AI assistant in worktree '${worktreeName}'...`);

    const exitCode = await launchAiAssistant(
      aiCommand,
      worktreeName,
      validation.value.path,
    );

    process.exit(exitCode);
  } catch (error) {
    exitWithError(
      error instanceof Error ? error.message : String(error),
      exitCodes.generalError,
    );
  }
}
