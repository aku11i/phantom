import { parseArgs } from "node:util";
import {
  BranchNotFoundError,
  WorktreeAlreadyExistsError,
  attachWorktreeCore,
  createContext,
  execInWorktree,
  shellInWorktree,
} from "@aku11i/phantom-core";
import { getGitRoot } from "@aku11i/phantom-git";
import { DefaultLogger, isErr } from "@aku11i/phantom-shared";
import { exitCodes, exitWithError } from "../errors.ts";

export async function attachHandler(args: string[]): Promise<void> {
  const logger = new DefaultLogger();
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
    context.config?.postCreate?.copyFiles,
    context.config?.postCreate?.commands,
    logger,
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

  logger.log(`Attached phantom: ${branchName}`);

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
