import { isOk } from "@aku11i/phantom-shared";
import { loadConfig } from "./config/loader.ts";
import { getWorktreesDirectory } from "./paths.ts";

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
