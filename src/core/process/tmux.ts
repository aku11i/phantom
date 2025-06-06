import type { Result } from "../types/result.ts";
import type { ProcessError } from "./errors.ts";
import { type SpawnSuccess, spawnProcess } from "./spawn.ts";

export type TmuxSplitDirection = "new" | "vertical" | "horizontal" | "v" | "h";

export interface TmuxOptions {
  direction: TmuxSplitDirection;
  command: string;
  cwd?: string;
}

export type TmuxSuccess = SpawnSuccess;

export async function isInsideTmux(): Promise<boolean> {
  return process.env.TMUX !== undefined;
}

export async function executeTmuxCommand(
  options: TmuxOptions,
): Promise<Result<TmuxSuccess, ProcessError>> {
  const { direction, command, cwd } = options;

  const tmuxArgs: string[] = [];

  switch (direction) {
    case "new":
      tmuxArgs.push("new-window");
      break;
    case "vertical":
    case "v":
      tmuxArgs.push("split-window", "-v");
      break;
    case "horizontal":
    case "h":
      tmuxArgs.push("split-window", "-h");
      break;
    default:
      tmuxArgs.push("new-window");
  }

  if (cwd) {
    tmuxArgs.push("-c", cwd);
  }

  tmuxArgs.push(command);

  const result = await spawnProcess({
    command: "tmux",
    args: tmuxArgs,
  });

  return result;
}

export function parseTmuxDirection(
  value: string | boolean,
): TmuxSplitDirection {
  if (value === true || value === "") {
    return "new";
  }

  const normalized = typeof value === "string" ? value.toLowerCase() : "new";

  if (["new", "vertical", "horizontal", "v", "h"].includes(normalized)) {
    return normalized as TmuxSplitDirection;
  }

  return "new";
}
