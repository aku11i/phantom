import { parseArgs } from "node:util";
import {
  BranchNotFoundError,
  WorktreeAlreadyExistsError,
  attachWorktreeCore,
  execInWorktree,
  shellInWorktree,
  loadConfig,
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
  
  // Load config to get basePath
  let basePath: string | undefined;
  const configResult = await loadConfig(gitRoot);
  if (isOk(configResult)) {
    basePath = configResult.value.basePath;
  }
  
  const result = await attachWorktreeCore(gitRoot, branchName, basePath);

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

  if (values.shell) {
    const shellResult = await shellInWorktree(gitRoot, branchName, basePath);
    if (isErr(shellResult)) {
      exitWithError(shellResult.error.message, exitCodes.generalError);
    }
  } else if (values.exec) {
    const shell = process.env.SHELL || "/bin/sh";
    const execResult = await execInWorktree(
      gitRoot,
      branchName,
      [shell, "-c", values.exec],
      { interactive: true, basePath },
    );
    if (isErr(execResult)) {
      exitWithError(execResult.error.message, exitCodes.generalError);
    }
  }
}
