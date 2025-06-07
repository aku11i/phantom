import { parseArgs } from "node:util";
import { getGitRoot } from "../../core/git/libs/get-git-root.ts";
import { execInWorktree as execInWorktreeCore } from "../../core/process/exec.ts";
import { isErr } from "../../core/types/result.ts";
import { WorktreeNotFoundError } from "../../core/worktree/errors.ts";
import { exitCodes, exitWithError } from "../errors.ts";

export async function execHandler(args: string[]): Promise<void> {
  const { positionals } = parseArgs({
    args,
    options: {},
    strict: true,
    allowPositionals: true,
  });

  if (positionals.length < 2) {
    exitWithError(
      "Usage: phantom exec <worktree-name> <command> [args...]",
      exitCodes.validationError,
    );
  }

  const [worktreeName, ...commandArgs] = positionals;

  try {
    const gitRoot = await getGitRoot();
    const result = await execInWorktreeCore(
      gitRoot,
      worktreeName,
      commandArgs,
      { interactive: true },
    );

    if (isErr(result)) {
      const exitCode =
        result.error instanceof WorktreeNotFoundError
          ? exitCodes.notFound
          : result.error.exitCode || exitCodes.generalError;
      exitWithError(result.error.message, exitCode);
    }

    process.exit(result.value.exitCode);
  } catch (error) {
    exitWithError(
      error instanceof Error ? error.message : String(error),
      exitCodes.generalError,
    );
  }
}
