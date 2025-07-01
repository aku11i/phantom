import { parseArgs } from "node:util";
import {
  WorktreeNotFoundError,
  createContext,
  execInWorktree,
  selectWorktreeWithFzf,
  validateWorktreeExists,
} from "@aku11i/phantom-core";
import { getGitRoot } from "@aku11i/phantom-git";
import { isErr } from "@aku11i/phantom-shared";
import { exitCodes, exitWithError, exitWithSuccess } from "../errors.ts";
import { output } from "../output.ts";

export async function reviewHandler(args: string[]): Promise<void> {
  const { positionals, values } = parseArgs({
    args,
    options: {
      fzf: {
        type: "boolean",
        default: false,
      },
      base: {
        type: "string",
      },
    },
    strict: true,
    allowPositionals: true,
  });

  const useFzf = values.fzf ?? false;
  const base = values.base;

  if (useFzf) {
    if (positionals.length > 0) {
      exitWithError(
        "Cannot specify worktree name when using --fzf",
        exitCodes.validationError,
      );
    }
  } else {
    if (positionals.length !== 1) {
      exitWithError(
        "Usage: phantom review <worktree-name> [--base <ref>]",
        exitCodes.validationError,
      );
    }
  }

  try {
    const gitRoot = await getGitRoot();
    const context = await createContext(gitRoot);

    let worktreeName: string;

    if (useFzf) {
      const selectResult = await selectWorktreeWithFzf(
        context.gitRoot,
        context.worktreesDirectory,
      );
      if (isErr(selectResult)) {
        exitWithError(selectResult.error.message, exitCodes.generalError);
      }
      if (!selectResult.value) {
        exitWithSuccess();
      }
      worktreeName = selectResult.value.name;
    } else {
      // We know positionals[0] exists because we validated it above
      worktreeName = positionals[0];
    }

    // Validate worktree exists
    const validation = await validateWorktreeExists(
      context.gitRoot,
      context.worktreesDirectory,
      worktreeName,
    );
    if (isErr(validation)) {
      exitWithError(validation.error.message, exitCodes.generalError);
    }

    // Determine base reference
    const baseRef = base ?? `origin/${context.config?.defaultBranch ?? "main"}`;

    output.log(`Opening review for worktree '${worktreeName}'...`);
    output.log(
      "powered by yoshiko-pg/reviewit (https://github.com/yoshiko-pg/reviewit)",
    );

    // Execute reviewit command
    const command = ["reviewit", "HEAD", baseRef];
    const result = await execInWorktree(
      context.gitRoot,
      context.worktreesDirectory,
      worktreeName,
      command,
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
