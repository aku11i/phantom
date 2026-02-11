import { spawnSync } from "node:child_process";
import type { Context } from "@aku11i/phantom-core";
import { output } from "../output.ts";
import { initLayout } from "./init.ts";
import type { LayoutSource } from "./resolve-layout.ts";

export interface PromptSetupOptions {
  gitRoot: string;
  context: Context;
}

export interface PromptSetupResult {
  action: "builtin" | "project" | "global" | "skip";
  layoutPath?: string;
  source?: LayoutSource;
}

/**
 * Prompt user for Zellij setup when no configuration exists
 */
export async function promptZellijSetup(
  options: PromptSetupOptions,
): Promise<PromptSetupResult> {
  const { gitRoot } = options;

  output.log(
    "\nZellij layout not configured. How would you like to proceed?\n",
  );
  output.log("  1) Use built-in default (no setup needed)");
  output.log("  2) Create project layout (.zellij/default.kdl)");
  output.log(
    "  3) Create/use global layout (~/.config/zellij/layouts/phantom.kdl)",
  );
  output.log(
    "  4) Skip for now (use built-in, don't ask again this session)\n",
  );

  const choice = promptChoice("Enter choice [1-4]: ", ["1", "2", "3", "4"]);

  switch (choice) {
    case "1": {
      output.log("\nUsing built-in default layout.\n");
      return { action: "builtin" };
    }

    case "2": {
      output.log("\nCreating project layout...\n");
      const result = await initLayout({ gitRoot, global: false });
      return {
        action: "project",
        layoutPath: result.layoutPath,
        source: "project-default",
      };
    }

    case "3": {
      output.log("\nCreating/using global layout...\n");
      const result = await initLayout({ gitRoot, global: true });
      return {
        action: "global",
        layoutPath: result.layoutPath,
        source: "global-default",
      };
    }

    case "4":
    default: {
      output.log("\nSkipping for now. Using built-in default.\n");
      return { action: "skip" };
    }
  }
}

/**
 * Prompt for a single choice from a list of valid options.
 * Uses a subprocess to avoid polluting the main process's stdin,
 * which is needed for subsequent spawnSync calls (like Zellij).
 */
function promptChoice(prompt: string, validChoices: string[]): string {
  const validChoicesStr = validChoices.join(", ");

  // Use bash read command in a subprocess to get user input
  // This keeps the main process's stdin clean for later use
  while (true) {
    const result = spawnSync(
      "bash",
      ["-c", `read -p "${prompt}" answer && echo "$answer"`],
      {
        stdio: ["inherit", "pipe", "inherit"],
        encoding: "utf-8",
      },
    );

    if (result.error || result.status !== 0) {
      // Default to option 1 if there's an error reading input
      return validChoices[0];
    }

    const answer = (result.stdout || "").trim();
    if (validChoices.includes(answer)) {
      return answer;
    }

    output.log(`Invalid choice. Please enter one of: ${validChoicesStr}`);
  }
}
