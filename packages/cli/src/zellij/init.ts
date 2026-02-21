import fs from "node:fs/promises";
import path from "node:path";
import { output } from "../output.ts";
import {
  GLOBAL_ZELLIJ_LAYOUTS_DIR,
  PROJECT_ZELLIJ_DIR,
} from "./resolve-layout.ts";
import { DEFAULT_LAYOUT_TEMPLATE } from "./template.ts";

export interface InitLayoutOptions {
  gitRoot: string;
  global: boolean;
  name?: string;
  force?: boolean;
}

export interface InitLayoutResult {
  layoutPath: string;
  created: boolean;
  alreadyExists: boolean;
}

/**
 * Initialize a Zellij layout file
 *
 * @param options.gitRoot - Git repository root (for project layouts)
 * @param options.global - Create in global location (~/.config/zellij/layouts/)
 * @param options.name - Custom layout name (default: "default" for project, "phantom" for global)
 * @param options.force - Overwrite existing file
 */
export async function initLayout(
  options: InitLayoutOptions,
): Promise<InitLayoutResult> {
  const { gitRoot, global: isGlobal, name, force = false } = options;

  const defaultName = isGlobal ? "phantom" : "default";
  const layoutName = name ?? defaultName;
  const layoutFileName = layoutName.endsWith(".kdl")
    ? layoutName
    : `${layoutName}.kdl`;

  const layoutDir = isGlobal
    ? GLOBAL_ZELLIJ_LAYOUTS_DIR
    : path.join(gitRoot, PROJECT_ZELLIJ_DIR);

  const layoutPath = path.join(layoutDir, layoutFileName);

  // Check if file already exists
  const exists = await fileExists(layoutPath);
  if (exists && !force) {
    output.log(`Layout file already exists: ${layoutPath}`);
    output.log(`Use --force to overwrite.\n`);
    return { layoutPath, created: false, alreadyExists: true };
  }

  // Create directory if needed
  await fs.mkdir(layoutDir, { recursive: true });

  // Write the template
  await fs.writeFile(layoutPath, DEFAULT_LAYOUT_TEMPLATE, "utf-8");

  const locationDesc = isGlobal ? "global" : "project";
  output.log(`Created ${locationDesc} layout: ${layoutPath}\n`);

  // Provide next steps hint
  if (!isGlobal) {
    output.log(`To use this layout, add to phantom.config.json:`);
    output.log(`  "zellij": { "layout": ".zellij/${layoutFileName}" }\n`);
    output.log(`Or it will be auto-detected as the project default.\n`);
  } else {
    output.log(
      `This layout will be used as the global default for all projects`,
    );
    output.log(`that don't have their own layout configured.\n`);
  }

  return { layoutPath, created: true, alreadyExists: false };
}

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
