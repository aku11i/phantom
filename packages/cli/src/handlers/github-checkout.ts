import { parseArgs } from "node:util";
import {
  ConfigNotFoundError,
  ConfigParseError,
  ConfigValidationError,
  copyFilesToWorktree,
  createContext,
  executePostCreateCommands,
  loadConfig,
} from "@aku11i/phantom-core";
import { getGitRoot } from "@aku11i/phantom-git";
import { githubCheckout } from "@aku11i/phantom-github";
import { isErr, isOk } from "@aku11i/phantom-shared";
import { exitCodes, exitWithError } from "../errors.ts";
import { output } from "../output.ts";

export async function githubCheckoutHandler(args: string[]): Promise<void> {
  const { positionals, values } = parseArgs({
    args,
    options: {
      base: {
        type: "string",
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

  const result = await githubCheckout({ number, base: values.base });

  if (isErr(result)) {
    exitWithError(result.error.message, exitCodes.generalError);
  }

  // Output the success message
  output.log(result.value.message);

  // Don't run postCreate if the worktree already existed
  if (result.value.alreadyExists) {
    return;
  }

  // Get git root and context for postCreate execution
  const gitRoot = await getGitRoot();
  const context = await createContext(gitRoot);

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
      result.value.worktree,
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
      worktreeName: result.value.worktree,
      commands,
    });

    if (isErr(postCreateResult)) {
      exitWithError(postCreateResult.error.message, exitCodes.generalError);
    }
  }
}
