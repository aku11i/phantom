import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

export type LayoutSource =
  | "cli"
  | "project-config"
  | "project-default"
  | "global-config"
  | "global-default"
  | "builtin"
  | "prompt-needed";

export interface LayoutResolutionResult {
  path: string | null;
  source: LayoutSource;
}

export interface ResolveLayoutOptions {
  cliLayoutPath?: string;
  projectConfig?: {
    layout?: string;
  };
  gitRoot: string;
}

const PROJECT_ZELLIJ_DIR = ".zellij";
const PROJECT_DEFAULT_LAYOUT = "default.kdl";
const GLOBAL_ZELLIJ_LAYOUTS_DIR = path.join(
  os.homedir(),
  ".config",
  "zellij",
  "layouts",
);
const GLOBAL_PHANTOM_LAYOUT = "phantom.kdl";
const GLOBAL_PHANTOM_CONFIG_DIR = path.join(os.homedir(), ".config", "phantom");
const GLOBAL_PHANTOM_CONFIG_FILE = "config.json";

/**
 * Check if a file exists
 */
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Load global Phantom config from ~/.config/phantom/config.json
 */
async function loadGlobalConfig(): Promise<{
  zellij?: { layout?: string };
} | null> {
  const configPath = path.join(
    GLOBAL_PHANTOM_CONFIG_DIR,
    GLOBAL_PHANTOM_CONFIG_FILE,
  );
  try {
    const content = await fs.readFile(configPath, "utf-8");
    return JSON.parse(content);
  } catch {
    return null;
  }
}

/**
 * Resolve the layout path using the following resolution order:
 * 1. CLI flag (--layout)
 * 2. Project config (phantom.config.json -> zellij.layout)
 * 3. Project default (.zellij/default.kdl)
 * 4. Global config (~/.config/phantom/config.json -> zellij.layout)
 * 5. Global default (~/.config/zellij/layouts/phantom.kdl)
 * 6. Built-in default (returns null, caller uses temporary layout)
 *
 * Special config values:
 * - "builtin": Use built-in default
 * - "global": Use global default layout
 */
export async function resolveLayout(
  options: ResolveLayoutOptions,
): Promise<LayoutResolutionResult> {
  const { cliLayoutPath, projectConfig, gitRoot } = options;

  // 1. CLI flag takes highest priority
  if (cliLayoutPath) {
    const resolvedPath = path.isAbsolute(cliLayoutPath)
      ? cliLayoutPath
      : path.resolve(process.cwd(), cliLayoutPath);

    if (!(await fileExists(resolvedPath))) {
      throw new Error(`Layout file not found: ${cliLayoutPath}`);
    }

    return { path: resolvedPath, source: "cli" };
  }

  // 2. Project config
  if (projectConfig?.layout) {
    const layoutValue = projectConfig.layout;

    // Special value: use built-in
    if (layoutValue === "builtin") {
      return { path: null, source: "builtin" };
    }

    // Special value: use global default
    if (layoutValue === "global") {
      const globalDefaultPath = path.join(
        GLOBAL_ZELLIJ_LAYOUTS_DIR,
        GLOBAL_PHANTOM_LAYOUT,
      );
      if (await fileExists(globalDefaultPath)) {
        return { path: globalDefaultPath, source: "global-default" };
      }
      // Global doesn't exist, fall through to built-in
      return { path: null, source: "builtin" };
    }

    // Regular path
    const resolvedPath = path.isAbsolute(layoutValue)
      ? layoutValue
      : path.resolve(gitRoot, layoutValue);

    if (!(await fileExists(resolvedPath))) {
      throw new Error(
        `Layout file not found: ${layoutValue}\n` +
          `Run 'phantom zellij init' to create a layout, or remove the layout setting from phantom.config.json.`,
      );
    }

    return { path: resolvedPath, source: "project-config" };
  }

  // 3. Project default (.zellij/default.kdl)
  const projectDefaultPath = path.join(
    gitRoot,
    PROJECT_ZELLIJ_DIR,
    PROJECT_DEFAULT_LAYOUT,
  );
  if (await fileExists(projectDefaultPath)) {
    return { path: projectDefaultPath, source: "project-default" };
  }

  // 4. Global config
  const globalConfig = await loadGlobalConfig();
  if (globalConfig?.zellij?.layout) {
    const layoutValue = globalConfig.zellij.layout;

    // Special value: use built-in
    if (layoutValue === "builtin") {
      return { path: null, source: "builtin" };
    }

    // Expand ~ in path
    const expandedPath = layoutValue.startsWith("~/")
      ? path.join(os.homedir(), layoutValue.slice(2))
      : layoutValue;

    const resolvedPath = path.isAbsolute(expandedPath)
      ? expandedPath
      : path.resolve(GLOBAL_PHANTOM_CONFIG_DIR, expandedPath);

    if (await fileExists(resolvedPath)) {
      return { path: resolvedPath, source: "global-config" };
    }
    // Global config layout doesn't exist, continue to next step
  }

  // 5. Global default (~/.config/zellij/layouts/phantom.kdl)
  const globalDefaultPath = path.join(
    GLOBAL_ZELLIJ_LAYOUTS_DIR,
    GLOBAL_PHANTOM_LAYOUT,
  );
  if (await fileExists(globalDefaultPath)) {
    return { path: globalDefaultPath, source: "global-default" };
  }

  // 6. No layout configured - check if we should prompt
  // If there's a phantom.config.json but no zellij section, or no config at all,
  // we should prompt the user
  if (!projectConfig) {
    return { path: null, source: "prompt-needed" };
  }

  // Project has zellij config but no layout specified - use built-in
  return { path: null, source: "builtin" };
}

/**
 * Get paths for listing available layouts
 */
export function getLayoutPaths(gitRoot: string): {
  projectDir: string;
  globalDir: string;
} {
  return {
    projectDir: path.join(gitRoot, PROJECT_ZELLIJ_DIR),
    globalDir: GLOBAL_ZELLIJ_LAYOUTS_DIR,
  };
}

export {
  GLOBAL_ZELLIJ_LAYOUTS_DIR,
  GLOBAL_PHANTOM_CONFIG_DIR,
  PROJECT_ZELLIJ_DIR,
};
