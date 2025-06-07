import { spawn } from "node:child_process";
import { type Result, err, ok } from "../types/result.ts";
import type { WorktreeInfo } from "../worktree/list.ts";
import { type ProcessError, ProcessExecutionError } from "./errors.ts";
import { spawnProcess } from "./spawn.ts";

export interface FzfSelectionSuccess {
  selected: WorktreeInfo[];
}

export async function checkFzfAvailable(): Promise<boolean> {
  const result = await spawnProcess({
    command: "which",
    args: ["fzf"],
    options: {
      stdio: ["ignore", "ignore", "ignore"],
    },
  });

  return result.ok;
}

export async function selectWorktreeWithFzf(
  worktrees: WorktreeInfo[],
  options?: {
    multiSelect?: boolean;
    prompt?: string;
  },
): Promise<Result<FzfSelectionSuccess, ProcessError>> {
  if (worktrees.length === 0) {
    return ok({ selected: [] });
  }

  const maxNameLength = Math.max(...worktrees.map((wt) => wt.name.length));

  const worktreeLines = worktrees.map((wt) => {
    const paddedName = wt.name.padEnd(maxNameLength + 2);
    const branchInfo = wt.branch ? `(${wt.branch})` : "";
    const status = !wt.isClean ? " [dirty]" : "";
    return `${paddedName} ${branchInfo}${status}`;
  });

  const fzfArgs: string[] = [];

  if (options?.prompt) {
    fzfArgs.push("--prompt", options.prompt);
  } else {
    fzfArgs.push("--prompt", "Select worktree: ");
  }

  if (options?.multiSelect) {
    fzfArgs.push("--multi");
  }

  fzfArgs.push("--height", "40%", "--reverse");

  return new Promise((resolve) => {
    const fzfProcess = spawn("fzf", fzfArgs, {
      stdio: ["pipe", "pipe", "inherit"],
    });

    let stdout = "";

    if (fzfProcess.stdin) {
      fzfProcess.stdin.write(worktreeLines.join("\n"));
      fzfProcess.stdin.end();
    }

    if (fzfProcess.stdout) {
      fzfProcess.stdout.on("data", (chunk) => {
        stdout += chunk.toString();
      });
    }

    fzfProcess.on("error", (error) => {
      resolve(err(new ProcessExecutionError("fzf", 1)));
    });

    fzfProcess.on("exit", (code) => {
      if (code === 130) {
        // User cancelled (Ctrl+C)
        resolve(ok({ selected: [] }));
        return;
      }

      if (code !== 0) {
        resolve(err(new ProcessExecutionError("fzf", code ?? 1)));
        return;
      }

      const selectedLines = stdout
        .trim()
        .split("\n")
        .filter((line: string) => line.length > 0);

      const selected = selectedLines
        .map((line: string) => {
          const name = line.split(" ")[0].trim();
          return worktrees.find((wt) => wt.name === name);
        })
        .filter((wt): wt is WorktreeInfo => wt !== undefined);

      resolve(ok({ selected }));
    });
  });
}
