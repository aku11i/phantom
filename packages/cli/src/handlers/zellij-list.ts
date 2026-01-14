import { getGitRoot } from "@aku11i/phantom-git";
import { exitCodes, exitWithError, exitWithSuccess } from "../errors.ts";
import { listLayouts } from "../zellij/list.ts";

export async function zellijListHandler(_args: string[]): Promise<void> {
  try {
    const gitRoot = await getGitRoot();
    await listLayouts({ gitRoot });
    exitWithSuccess();
  } catch (error) {
    exitWithError(
      error instanceof Error ? error.message : String(error),
      exitCodes.generalError,
    );
  }
}
