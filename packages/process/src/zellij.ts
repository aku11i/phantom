import type { Result } from "@aku11i/phantom-shared";
import type { ProcessError } from "./errors.ts";
import { type SpawnSuccess, spawnProcess } from "./spawn.ts";

export type ZellijSplitDirection = "new" | "vertical" | "horizontal";

export interface ZellijOptions {
  direction: ZellijSplitDirection;
  command: string;
  args?: string[];
  cwd?: string;
  env?: Record<string, string>;
  tabName?: string;
}

export interface ZellijSessionOptions {
  sessionName: string;
  layout?: string;
  cwd?: string;
  env?: Record<string, string>;
}

export interface ZellijTabOptions {
  layout: string;
  tabName?: string;
  cwd?: string;
}

export type ZellijSuccess = SpawnSuccess;

export type ZellijSessionStatus = "active" | "dead" | "not_found";

export async function isInsideZellij(): Promise<boolean> {
  return process.env.ZELLIJ !== undefined;
}

/**
 * Check the status of a Zellij session by name.
 * Returns "active" if the session exists and is running,
 * "dead" if it exists but has exited, or "not_found" if it doesn't exist.
 */
export async function getZellijSessionStatus(
  sessionName: string,
): Promise<ZellijSessionStatus> {
  try {
    const { execSync } = await import("node:child_process");
    const output = execSync("zellij list-sessions --no-formatting", {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });

    for (const line of output.split("\n")) {
      // Each line starts with the session name followed by space and metadata
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      // Extract session name (everything before the first " [")
      const bracketIndex = trimmedLine.indexOf(" [");
      if (bracketIndex === -1) continue;

      const name = trimmedLine.substring(0, bracketIndex);
      if (name === sessionName) {
        // Check if it's dead (contains "EXITED")
        if (trimmedLine.includes("(EXITED")) {
          return "dead";
        }
        return "active";
      }
    }

    return "not_found";
  } catch {
    // If zellij command fails, assume not found
    return "not_found";
  }
}

/**
 * Delete a Zellij session by name.
 */
export async function deleteZellijSession(
  sessionName: string,
): Promise<Result<void, ProcessError>> {
  const result = await spawnProcess({
    command: "zellij",
    args: ["delete-session", sessionName],
  });

  if (result.ok) {
    return { ok: true, value: undefined };
  }
  return result;
}

export async function executeZellijCommand(
  options: ZellijOptions,
): Promise<Result<ZellijSuccess, ProcessError>> {
  const { direction, command, args, cwd, tabName } = options;

  const zellijArgs: string[] = [];

  switch (direction) {
    case "new":
      zellijArgs.push("action", "new-tab");
      if (tabName) {
        zellijArgs.push("--name", tabName);
      }
      break;
    case "vertical":
      zellijArgs.push("action", "new-pane", "--direction", "down");
      break;
    case "horizontal":
      zellijArgs.push("action", "new-pane", "--direction", "right");
      break;
  }

  if (cwd) {
    zellijArgs.push("--cwd", cwd);
  }

  // Add command separator and the command to run
  zellijArgs.push("--", command);
  if (args && args.length > 0) {
    zellijArgs.push(...args);
  }

  // Note: Zellij inherits environment from parent process
  // Unlike tmux, there's no direct env flag support
  const result = await spawnProcess({
    command: "zellij",
    args: zellijArgs,
  });

  return result;
}

export async function createZellijSession(
  options: ZellijSessionOptions,
): Promise<Result<ZellijSuccess, ProcessError>> {
  const { sessionName, layout, cwd, env } = options;

  const zellijArgs: string[] = ["--session", sessionName];

  if (layout) {
    // Use --new-session-with-layout to ALWAYS create a new session
    // (--layout with --session tries to attach and add tabs to existing session)
    zellijArgs.push("--new-session-with-layout", layout);
  }

  const spawnOptions: { cwd?: string; env?: NodeJS.ProcessEnv } = {};

  if (cwd) {
    spawnOptions.cwd = cwd;
  }

  if (env) {
    spawnOptions.env = { ...process.env, ...env };
  }

  const result = await spawnProcess({
    command: "zellij",
    args: zellijArgs,
    options: Object.keys(spawnOptions).length > 0 ? spawnOptions : undefined,
  });

  return result;
}

/**
 * Add a new tab with a layout to the current Zellij session.
 * Must be called from inside a Zellij session.
 */
export async function addZellijTab(
  options: ZellijTabOptions,
): Promise<Result<ZellijSuccess, ProcessError>> {
  const { layout, tabName, cwd } = options;

  const zellijArgs: string[] = ["action", "new-tab", "--layout", layout];

  if (tabName) {
    zellijArgs.push("--name", tabName);
  }

  if (cwd) {
    zellijArgs.push("--cwd", cwd);
  }

  const result = await spawnProcess({
    command: "zellij",
    args: zellijArgs,
  });

  return result;
}
