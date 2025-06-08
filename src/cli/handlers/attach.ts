import { parseArgs } from "node:util";
import { getGitRoot } from "../../core/git/libs/get-git-root.ts";
import { execInWorktree } from "../../core/process/exec.ts";
import { shellInWorktree } from "../../core/process/shell.ts";
import { isErr } from "../../core/types/result.ts";
import { attachWorktreeCore } from "../../core/worktree/attach.ts";
import {
  BranchNotFoundError,
  WorktreeAlreadyExistsError,
} from "../../core/worktree/errors.ts";
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
        short: "e",
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
  const result = await attachWorktreeCore(gitRoot, branchName);

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
    const shellResult = await shellInWorktree(gitRoot, branchName);
    if (isErr(shellResult)) {
      exitWithError(shellResult.error.message, exitCodes.generalError);
    }
  } else if (values.exec) {
    const shell = process.env.SHELL || "/bin/sh";
    const execResult = await execInWorktree(
      gitRoot,
      branchName,
      [shell, "-c", values.exec],
      { interactive: true },
    );
    if (isErr(execResult)) {
      exitWithError(execResult.error.message, exitCodes.generalError);
    }
  }
}
