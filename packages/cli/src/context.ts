import {
  type PhantomConfig,
  getWorktreeDirectory,
  loadConfig,
} from "@aku11i/phantom-core";
import { isOk } from "@aku11i/phantom-shared";

export interface Context {
  gitRoot: string;
  worktreeDirectory: string;
}

export async function createContext(gitRoot: string): Promise<Context> {
  const configResult = await loadConfig(gitRoot);
  const basePath = isOk(configResult) ? configResult.value.basePath : undefined;

  return {
    gitRoot,
    worktreeDirectory: getWorktreeDirectory(gitRoot, basePath),
  };
}
