import { loadConfig } from "@aku11i/phantom-core/src/config/loader.ts";
import { getWorktreesDirectory } from "@aku11i/phantom-core/src/paths.ts";
import { isOk } from "@aku11i/phantom-shared";

export interface Context {
  gitRoot: string;
  worktreesDirectory: string;
}

export async function createContext(gitRoot: string): Promise<Context> {
  const configResult = await loadConfig(gitRoot);
  const worktreesDirectory = isOk(configResult)
    ? configResult.value.worktreesDirectory
    : undefined;

  return {
    gitRoot,
    worktreesDirectory: getWorktreesDirectory(gitRoot, worktreesDirectory),
  };
}
