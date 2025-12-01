import { parseArgs } from "node:util";
import { createContext, validateWorktreeExists } from "@aku11i/phantom-core";
import { getGitRoot } from "@aku11i/phantom-git";
import { getPhantomEnv, spawnShell } from "@aku11i/phantom-process";
import { isErr } from "@aku11i/phantom-shared";
import { exitCodes, exitWithError } from "../errors.ts";
import { output } from "../output.ts";

export async function editHandler(args: string[]): Promise<void> {
  const { positionals } = parseArgs({
    args,
    options: {},
    strict: true,
    allowPositionals: true,
  });

  if (positionals.length === 0 || positionals.length > 2) {
    exitWithError(
      "Usage: phantom edit <worktree-name> [path]",
      exitCodes.validationError,
    );
  }

  const worktreeName = positionals[0];
  const target = positionals[1] ?? ".";

  try {
    const gitRoot = await getGitRoot();
    const context = await createContext(gitRoot);
    const editor = context.preferences.editor ?? process.env.EDITOR;

    if (!editor) {
      exitWithError(
        "Editor is not configured. Run 'phantom preferences set editor <command>' or set the EDITOR env var.",
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

    output.log(`Opening editor in worktree '${worktreeName}'...`);

    const exitCode = await spawnShell(editor, [target], validation.value.path, {
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
