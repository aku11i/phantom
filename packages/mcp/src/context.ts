import { loadConfig } from "@aku11i/phantom-core/src/config/loader.ts";
import { getWorktreeDirectory } from "@aku11i/phantom-core/src/paths.ts";
import { isOk } from "@aku11i/phantom-shared";

export interface Context {
  gitRoot: string;
  worktreeDirectory: string;
}

export async function createContext(gitRoot: string): Promise<Context> {
  const configResult = await loadConfig(gitRoot);
  const worktreeBaseDirectory = isOk(configResult) ? configResult.value.worktreeBaseDirectory : undefined;

  return {
    gitRoot,
    worktreeDirectory: getWorktreeDirectory(gitRoot, worktreeBaseDirectory),
  };
}
