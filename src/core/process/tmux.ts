import type { Result } from "../types/result.ts";
import type { ProcessError } from "./errors.ts";
import { type SpawnSuccess, spawnProcess } from "./spawn.ts";

export type TmuxSplitDirection = "new" | "vertical" | "horizontal";

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
      tmuxArgs.push("split-window", "-v");
      break;
    case "horizontal":
      tmuxArgs.push("split-window", "-h");
      break;
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
