import { isOk } from "@aku11i/phantom-shared";
import { type PhantomConfig, loadConfig } from "./config/loader.ts";
import { getWorktreesDirectory } from "./paths.ts";
import {
  type PhantomPreferences,
  loadPreferences,
} from "./preferences/loader.ts";

export interface Context {
  gitRoot: string;
  worktreesDirectory: string;
  config: PhantomConfig | null;
  preferences: PhantomPreferences | null;
}

export async function createContext(gitRoot: string): Promise<Context> {
  const configResult = await loadConfig(gitRoot);
  const config = isOk(configResult) ? configResult.value : null;

  const preferencesResult = await loadPreferences();
  const preferences = isOk(preferencesResult) ? preferencesResult.value : null;

  // Priority: preferences > config > default
  let worktreesDirectory = preferences?.worktreesDirectory;

  // Check if config has worktreesDirectory and warn if it does
  if (config?.worktreesDirectory) {
    if (!worktreesDirectory) {
      // Use config value if preferences doesn't have it
      worktreesDirectory = config.worktreesDirectory;
    }
    // Log deprecation warning
    console.warn(
      "Warning: 'worktreesDirectory' in phantom.config.json is deprecated and will be removed in a future update.\n" +
        "Please move this setting to ~/.config/phantom/phantom.json",
    );
  }

  return {
    gitRoot,
    worktreesDirectory: getWorktreesDirectory(gitRoot, worktreesDirectory),
    config,
    preferences,
  };
}
