import { parseArgs } from "node:util";
import {
  BranchNotFoundError,
  ConfigNotFoundError,
  ConfigParseError,
  ConfigValidationError,
  WorktreeAlreadyExistsError,
  attachWorktreeCore,
  copyFilesToWorktree,
  createContext,
  execInWorktree,
  executePostCreateCommands,
  loadConfig,
  shellInWorktree,
} from "@aku11i/phantom-core";
import { getGitRoot } from "@aku11i/phantom-git";
import { isErr, isOk } from "@aku11i/phantom-shared";
import { exitCodes, exitWithError } from "../errors.ts";
import { output } from "../output.ts";

export async function attachHandler(args: string[]): Promise<void> {
  const { positionals, values } = parseArgs({
    args,
    strict: true,
    allowPositionals: true,
    options: {
      shell: {
        type: "boolean",
        short: "s",
      },
      exec: {
        type: "string",
        short: "x",
      },
    },
  });

  if (positionals.length === 0) {
    exitWithError(
      "Missing required argument: branch name",
      exitCodes.validationError,
    );
  }

  const [branchName] = positionals;

  if (values.shell && values.exec) {
    exitWithError(
      "Cannot use both --shell and --exec options",
      exitCodes.validationError,
    );
  }

  const gitRoot = await getGitRoot();
  const context = await createContext(gitRoot);

  const result = await attachWorktreeCore(
    context.gitRoot,
    context.worktreesDirectory,
    branchName,
  );

  if (isErr(result)) {
    const error = result.error;
    if (error instanceof WorktreeAlreadyExistsError) {
      exitWithError(error.message, exitCodes.validationError);
    }
    if (error instanceof BranchNotFoundError) {
      exitWithError(error.message, exitCodes.notFound);
    }
    exitWithError(error.message, exitCodes.generalError);
  }

  const worktreePath = result.value;
  output.log(`Attached phantom: ${branchName}`);

  // Load config to get postCreate settings
  const configResult = await loadConfig(context.gitRoot);
  if (isErr(configResult)) {
    const error = configResult.error;
    if (!(error instanceof ConfigNotFoundError)) {
      if (error instanceof ConfigParseError) {
        output.error(`Warning: Config parse error: ${error.message}`);
      } else if (error instanceof ConfigValidationError) {
        output.error(`Warning: Config validation error: ${error.message}`);
      } else {
        // biome-ignore lint/suspicious/noExplicitAny: TypeScript can't narrow the error type properly
        const errorMessage = (error as any).message || String(error);
        output.error(`Warning: ${errorMessage}`);
      }
    }
  }

  // Copy files from config
  if (isOk(configResult) && configResult.value.postCreate?.copyFiles) {
    const copyResult = await copyFilesToWorktree(
      context.gitRoot,
      context.worktreesDirectory,
      branchName,
      configResult.value.postCreate.copyFiles,
    );

    if (isErr(copyResult)) {
      const errorMessage =
        copyResult.error instanceof Error
          ? copyResult.error.message
          : String(copyResult.error);
      output.error(`\nWarning: Failed to copy some files: ${errorMessage}`);
    }
  }

  // Execute post-create commands from config
  if (isOk(configResult) && configResult.value.postCreate?.commands) {
    const commands = configResult.value.postCreate.commands;
    output.log("\nRunning post-create commands...");

    for (const command of commands) {
      output.log(`Executing: ${command}`);
    }

    const postCreateResult = await executePostCreateCommands({
      gitRoot: context.gitRoot,
      worktreesDirectory: context.worktreesDirectory,
      worktreeName: branchName,
      commands,
    });

    if (isErr(postCreateResult)) {
      exitWithError(postCreateResult.error.message, exitCodes.generalError);
    }
  }

  if (values.shell) {
    const shellResult = await shellInWorktree(
      context.gitRoot,
      context.worktreesDirectory,
      branchName,
    );
    if (isErr(shellResult)) {
      exitWithError(shellResult.error.message, exitCodes.generalError);
    }
  } else if (values.exec) {
    const shell = process.env.SHELL || "/bin/sh";
    const execResult = await execInWorktree(
      context.gitRoot,
      context.worktreesDirectory,
      branchName,
      [shell, "-c", values.exec],
      { interactive: true },
    );
    if (isErr(execResult)) {
      exitWithError(execResult.error.message, exitCodes.generalError);
    }
  }
}
