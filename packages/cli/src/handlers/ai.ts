import { parseArgs } from "node:util";
import { createContext, validateWorktreeExists } from "@aku11i/phantom-core";
import { getGitRoot } from "@aku11i/phantom-git";
import { getPhantomEnv } from "@aku11i/phantom-process";
import { isErr } from "@aku11i/phantom-shared";
import { exitCodes, exitWithError } from "../errors.ts";
import { output } from "../output.ts";
import { openEditor } from "../utils/open-tool.ts";

export async function aiHandler(args: string[]): Promise<void> {
  const { positionals } = parseArgs({
    args,
    options: {},
    strict: true,
    allowPositionals: true,
  });

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

    const validation = await validateWorktreeExists(
      context.gitRoot,
      context.worktreesDirectory,
      worktreeName,
    );

    if (isErr(validation)) {
      exitWithError(validation.error.message, exitCodes.notFound);
    }

    output.log(`Launching AI assistant in worktree '${worktreeName}'...`);

    const exitCode = await openEditor(aiCommand, [], validation.value.path, {
      ...process.env,
      ...getPhantomEnv(worktreeName, validation.value.path),
    });

    process.exit(exitCode);
  } catch (error) {
    exitWithError(
      error instanceof Error ? error.message : String(error),
      exitCodes.generalError,
    );
  }
}
