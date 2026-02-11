import fs from "node:fs/promises";
import path from "node:path";
import { output } from "../output.ts";
import {
  GLOBAL_ZELLIJ_LAYOUTS_DIR,
  PROJECT_ZELLIJ_DIR,
} from "./resolve-layout.ts";

export interface ListLayoutsOptions {
  gitRoot: string;
}

interface LayoutInfo {
  name: string;
  path: string;
}

/**
 * List all .kdl files in a directory
 */
async function listKdlFiles(dir: string): Promise<LayoutInfo[]> {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".kdl"))
      .map((entry) => ({
        name: entry.name,
        path: path.join(dir, entry.name),
      }));
  } catch {
    return [];
  }
}

/**
 * List available Zellij layouts
 */
export async function listLayouts(options: ListLayoutsOptions): Promise<void> {
  const { gitRoot } = options;

  const projectDir = path.join(gitRoot, PROJECT_ZELLIJ_DIR);
  const globalDir = GLOBAL_ZELLIJ_LAYOUTS_DIR;

  const projectLayouts = await listKdlFiles(projectDir);
  const globalLayouts = await listKdlFiles(globalDir);

  output.log("Available Zellij layouts:\n");

  // Project layouts
  output.log(`Project layouts (${PROJECT_ZELLIJ_DIR}/):`);
  if (projectLayouts.length === 0) {
    output.log("  (none)");
  } else {
    for (const layout of projectLayouts) {
      const isDefault = layout.name === "default.kdl";
      output.log(`  - ${layout.name}${isDefault ? " (auto-detected)" : ""}`);
    }
  }

  output.log("");

  // Global layouts
  output.log(`Global layouts (~/.config/zellij/layouts/):`);
  if (globalLayouts.length === 0) {
    output.log("  (none)");
  } else {
    for (const layout of globalLayouts) {
      const isPhantomDefault = layout.name === "phantom.kdl";
      output.log(
        `  - ${layout.name}${isPhantomDefault ? " (phantom default)" : ""}`,
      );
    }
  }

  output.log("");

  // Built-in
  output.log("Built-in:");
  output.log("  - (default) - always available, no file needed");

  output.log("");
}
