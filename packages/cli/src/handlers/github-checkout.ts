import { parseArgs } from "node:util";
import { createContext } from "@aku11i/phantom-core";
import { getGitRoot } from "@aku11i/phantom-git";
import { githubCheckout } from "@aku11i/phantom-github";
import {
  createZellijSession,
  executeTmuxCommand,
  executeZellijCommand,
  getPhantomEnv,
  isInsideTmux,
  isInsideZellij,
} from "@aku11i/phantom-process";
import { isErr } from "@aku11i/phantom-shared";
import { exitCodes, exitWithError } from "../errors.ts";
import {
  cleanupTemporaryLayout,
  createTemporaryLayout,
} from "../layouts/index.ts";
import { output } from "../output.ts";

export async function githubCheckoutHandler(args: string[]): Promise<void> {
  const { positionals, values } = parseArgs({
    args,
    options: {
      base: {
        type: "string",
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
      "no-agent": {
        type: "boolean",
      },
    },
    allowPositionals: true,
  });

  const [number] = positionals;

  if (!number) {
    exitWithError(
      "Please specify a PR or issue number",
      exitCodes.validationError,
    );
  }

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

  if (tmuxOption && !(await isInsideTmux())) {
    exitWithError(
      "The --tmux option can only be used inside a tmux session",
      exitCodes.validationError,
    );
  }

  const result = await githubCheckout({ number, base: values.base });

  if (isErr(result)) {
    exitWithError(result.error.message, exitCodes.generalError);
  }

  // Output the success message
  output.log(result.value.message);

  if (tmuxDirection) {
    output.log(
      `\nOpening worktree '${result.value.worktree}' in tmux ${
        tmuxDirection === "new" ? "window" : "pane"
      }...`,
    );

    const shell = process.env.SHELL || "/bin/sh";

    const tmuxResult = await executeTmuxCommand({
      direction: tmuxDirection,
      command: shell,
      cwd: result.value.path,
      env: getPhantomEnv(result.value.worktree, result.value.path),
      windowName: tmuxDirection === "new" ? result.value.worktree : undefined,
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

    const shell = process.env.SHELL || "/bin/sh";

    if (insideZellij) {
      output.log(
        `\nOpening worktree '${result.value.worktree}' in Zellij ${
          zellijDirection === "new" ? "tab" : "pane"
        }...`,
      );

      const zellijResult = await executeZellijCommand({
        direction: zellijDirection,
        command: shell,
        cwd: result.value.path,
        env: getPhantomEnv(result.value.worktree, result.value.path),
        tabName: zellijDirection === "new" ? result.value.worktree : undefined,
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
      // github-checkout --zellij launches without agent by default (use 'phantom launch' for AI sessions)
      const gitRoot = await getGitRoot();
      const context = await createContext(gitRoot);
      const zellijConfig = context.config?.zellij;

      // Determine layout path
      let layoutPath: string;
      let isTemporaryLayout = false;

      if (zellijConfig?.layout) {
        // Config-specified layout
        layoutPath = zellijConfig.layout;
      } else {
        // Generate temporary layout WITHOUT agent
        layoutPath = await createTemporaryLayout({
          worktreePath: result.value.path,
          worktreeName: result.value.worktree,
          noAgent: true,
        });
        isTemporaryLayout = true;
      }

      output.log(`\nLaunching Zellij session '${result.value.worktree}'...`);

      const zellijResult = await createZellijSession({
        sessionName: result.value.worktree.replaceAll("/", "-"),
        layout: layoutPath,
        cwd: result.value.path,
        env: getPhantomEnv(result.value.worktree, result.value.path),
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
  }
}
