import { isOk } from "@aku11i/phantom-shared";
import { loadConfig, type PhantomConfig } from "./config/loader.ts";
import { getWorktreesDirectory } from "./paths.ts";
import { loadPreferences, type Preferences } from "./preferences/loader.ts";

export interface Context {
  gitRoot: string;
  worktreesDirectory: string;
  config: PhantomConfig | null;
  preferences: Preferences;
}

export async function createContext(gitRoot: string): Promise<Context> {
  const configResult = await loadConfig(gitRoot);
  const config = isOk(configResult) ? configResult.value : null;
  const worktreesDirectory = config?.worktreesDirectory;
  const preferences = await loadPreferences();

  return {
    gitRoot,
    worktreesDirectory: getWorktreesDirectory(gitRoot, worktreesDirectory),
    config,
    preferences,
  };
}
