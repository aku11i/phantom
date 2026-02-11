import { basename } from "node:path";
import { parseArgs } from "node:util";
import {
  attachWorktreeCore,
  createContext,
  createWorktree,
  validateWorktreeExists,
} from "@aku11i/phantom-core";
import { branchExists, getGitRoot } from "@aku11i/phantom-git";
import {
  addZellijTab,
  createZellijSession,
  deleteZellijSession,
  getPhantomEnv,
  getZellijSessionStatus,
  isInsideZellij,
  spawnTerminalWindow,
} from "@aku11i/phantom-process";
import { isErr, isOk } from "@aku11i/phantom-shared";
import { exitCodes, exitWithError, exitWithSuccess } from "../errors.ts";
import {
  cleanupTemporaryLayout,
  createTemporaryLayout,
} from "../layouts/index.ts";
import { output } from "../output.ts";
import { promptZellijSetup } from "../zellij/prompt-setup.ts";
import { resolveLayout } from "../zellij/resolve-layout.ts";

/**
 * Check if connected via SSH by looking for SSH environment variables
 */
function isSSHConnection(): boolean {
  return !!(
    process.env.SSH_CONNECTION ||
    process.env.SSH_CLIENT ||
    process.env.SSH_TTY
  );
}

export async function launchHandler(args: string[]): Promise<void> {
  const { values, positionals } = parseArgs({
    args,
    options: {
      base: {
        type: "string",
      },
      layout: {
        type: "string",
        short: "l",
      },
      "no-agent": {
        type: "boolean",
      },
      "copy-file": {
        type: "string",
        multiple: true,
      },
      detach: {
        type: "boolean",
        short: "d",
      },
    },
    strict: true,
    allowPositionals: true,
  });

  if (positionals.length === 0) {
    exitWithError(
      "Please provide a name for the worktree/session",
      exitCodes.validationError,
    );
  }

  const worktreeName = positionals[0];
  const layoutOption = values.layout;
  const noAgent = values["no-agent"] ?? false;
  const copyFileOptions = values["copy-file"];
  const baseOption = values.base;
  const detach = values.detach ?? false;

  // Check if connected via SSH - --detach won't work without a local display
  if (detach && isSSHConnection()) {
    exitWithError(
      "The --detach option cannot be used over SSH connections (no local display available)",
      exitCodes.validationError,
    );
  }

  try {
    const gitRoot = await getGitRoot();
    const context = await createContext(gitRoot);

    // Determine AI agent command from config or defaults
    const zellijConfig = context.config?.zellij;
    const agentCommand = zellijConfig?.agent?.command ?? "claude";
    const agentArgs = zellijConfig?.agent?.args ?? [];

    // Smart worktree resolution: existing worktree → attach branch → create new
    let worktreePath: string;

    const existingWorktree = await validateWorktreeExists(
      context.gitRoot,
      context.worktreesDirectory,
      worktreeName,
    );

    if (isOk(existingWorktree)) {
      // Worktree already exists, use it
      worktreePath = existingWorktree.value.path;
      output.log(`Using existing worktree '${worktreeName}'`);
    } else {
      // Check if branch exists (for attach) or create new
      const branchCheck = await branchExists(gitRoot, worktreeName);

      if (isOk(branchCheck) && branchCheck.value) {
        // Branch exists, attach to it
        let filesToCopy: string[] = context.config?.postCreate?.copyFiles ?? [];
        if (copyFileOptions && copyFileOptions.length > 0) {
          const cliFiles = Array.isArray(copyFileOptions)
            ? copyFileOptions
            : [copyFileOptions];
          filesToCopy = [...new Set([...filesToCopy, ...cliFiles])];
        }

        const attachResult = await attachWorktreeCore(
          context.gitRoot,
          context.worktreesDirectory,
          worktreeName,
          filesToCopy.length > 0 ? filesToCopy : undefined,
          context.config?.postCreate?.commands,
        );

        if (isErr(attachResult)) {
          exitWithError(attachResult.error.message, exitCodes.generalError);
        }

        worktreePath = attachResult.value;
        output.log(`Attached to existing branch '${worktreeName}'`);
      } else {
        // Create new worktree
        let filesToCopy: string[] = context.config?.postCreate?.copyFiles ?? [];
        if (copyFileOptions && copyFileOptions.length > 0) {
          const cliFiles = Array.isArray(copyFileOptions)
            ? copyFileOptions
            : [copyFileOptions];
          filesToCopy = [...new Set([...filesToCopy, ...cliFiles])];
        }

        const createResult = await createWorktree(
          context.gitRoot,
          context.worktreesDirectory,
          worktreeName,
          {
            copyFiles: filesToCopy.length > 0 ? filesToCopy : undefined,
            base: baseOption,
          },
          filesToCopy.length > 0 ? filesToCopy : undefined,
          context.config?.postCreate?.commands,
        );

        if (isErr(createResult)) {
          exitWithError(createResult.error.message, exitCodes.generalError);
        }

        worktreePath = createResult.value.path;
        output.log(createResult.value.message);

        if (createResult.value.copyError) {
          output.error(
            `\nWarning: Failed to copy some files: ${createResult.value.copyError}`,
          );
        }
      }
    }

    // Resolve layout using the resolution order:
    // 1. CLI flag, 2. Project config, 3. Project default (.zellij/),
    // 4. Global config, 5. Global default, 6. Built-in
    const layoutResolution = await resolveLayout({
      cliLayoutPath: layoutOption,
      projectConfig: zellijConfig,
      gitRoot,
    });

    // If no zellij config exists, prompt user for setup
    if (layoutResolution.source === "prompt-needed") {
      const setupResult = await promptZellijSetup({ gitRoot, context });
      if (setupResult.action === "skip" || setupResult.action === "builtin") {
        // User chose to skip or use built-in
        layoutResolution.source = "builtin";
      } else if (setupResult.layoutPath && setupResult.source) {
        layoutResolution.path = setupResult.layoutPath;
        layoutResolution.source = setupResult.source;
      }
    }

    // Determine final layout path
    let layoutPath: string;
    let isTemporaryLayout = false;

    if (layoutResolution.path) {
      layoutPath = layoutResolution.path;
    } else {
      // Use built-in: generate temporary layout
      layoutPath = await createTemporaryLayout({
        worktreePath,
        worktreeName,
        agentCommand: noAgent ? undefined : agentCommand,
        agentArgs: noAgent ? undefined : agentArgs,
        noAgent,
      });
      isTemporaryLayout = true;
    }

    const projectName = basename(gitRoot);
    const sessionName = `${projectName}-${worktreeName.replaceAll("/", "-")}`;
    const insideZellij = await isInsideZellij();

    // Check for and clean up dead Zellij sessions before creating new ones
    // (only relevant for detach mode and when outside Zellij)
    if (detach || !insideZellij) {
      const sessionStatus = await getZellijSessionStatus(sessionName);
      if (sessionStatus === "dead") {
        output.log(`Cleaning up dead Zellij session '${sessionName}'...`);
        await deleteZellijSession(sessionName);
      } else if (sessionStatus === "active") {
        exitWithError(
          `Zellij session '${sessionName}' is already running. Attach to it or choose a different name.`,
          exitCodes.validationError,
        );
      }
    }

    // Mode 1: --detach - spawn new terminal window with Zellij
    if (detach) {
      output.log(
        `\nLaunching Zellij session '${sessionName}' in new terminal window...`,
      );

      const terminalResult = await spawnTerminalWindow({
        command: "zellij",
        args: [
          "--session",
          sessionName,
          "--new-session-with-layout",
          layoutPath,
        ],
        cwd: worktreePath,
        env: getPhantomEnv(worktreeName, worktreePath),
        terminalPreference: context.preferences.terminal,
      });

      // Cleanup temporary layout if we created one
      if (isTemporaryLayout) {
        await cleanupTemporaryLayout(layoutPath);
      }

      if (isErr(terminalResult)) {
        exitWithError(terminalResult.error.message, exitCodes.generalError);
      }

      output.log(`Opened in ${terminalResult.value.terminal}`);
      exitWithSuccess();
    }

    // Mode 2: Inside Zellij - add new tab with layout
    if (insideZellij) {
      output.log(`\nAdding Zellij tab '${sessionName}'...`);

      const tabResult = await addZellijTab({
        layout: layoutPath,
        tabName: sessionName,
        cwd: worktreePath,
      });

      // Cleanup temporary layout if we created one
      if (isTemporaryLayout) {
        await cleanupTemporaryLayout(layoutPath);
      }

      if (isErr(tabResult)) {
        output.error(tabResult.error.message);
        const exitCode =
          "exitCode" in tabResult.error
            ? (tabResult.error.exitCode ?? exitCodes.generalError)
            : exitCodes.generalError;
        exitWithError("", exitCode);
      }

      exitWithSuccess();
    }

    // Mode 3: Outside Zellij - create new session
    output.log(`\nLaunching Zellij session '${sessionName}'...`);

    const zellijResult = await createZellijSession({
      sessionName,
      layout: layoutPath,
      cwd: worktreePath,
      env: getPhantomEnv(worktreeName, worktreePath),
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

    exitWithSuccess();
  } catch (error) {
    exitWithError(
      error instanceof Error ? error.message : String(error),
      exitCodes.generalError,
    );
  }
}
