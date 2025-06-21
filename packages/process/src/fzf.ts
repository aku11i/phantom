import { type ChildProcess, spawn } from "node:child_process";
import { type Result, err, ok } from "@aku11i/phantom-shared";

export interface FzfOptions {
  prompt?: string;
  header?: string;
  previewCommand?: string;
  bindings?: Array<{
    key: string;
    action: string;
  }>;
  ansi?: boolean;
  layout?: string;
  border?: string;
  borderLabel?: string;
  previewWindow?: string;
}

export async function selectWithFzf(
  items: string[],
  options: FzfOptions = {},
): Promise<Result<string | null, Error>> {
  return new Promise((resolve) => {
    const fzf = spawnFzf(items, { ...options, stdio: "pipe" });

    let result = "";
    let errorOutput = "";

    if (fzf.stdout) {
      fzf.stdout.on("data", (data) => {
        result += data.toString();
      });
    }

    if (fzf.stderr) {
      fzf.stderr.on("data", (data) => {
        errorOutput += data.toString();
      });
    }

    fzf.on("error", (error) => {
      if (error.message.includes("ENOENT")) {
        resolve(
          err(new Error("fzf command not found. Please install fzf first.")),
        );
      } else {
        resolve(err(error));
      }
    });

    fzf.on("close", (code) => {
      if (code === 0) {
        const selected = result.trim();
        resolve(ok(selected || null));
      } else if (code === 1) {
        resolve(ok(null));
      } else if (code === 130) {
        resolve(ok(null));
      } else {
        resolve(err(new Error(`fzf exited with code ${code}: ${errorOutput}`)));
      }
    });
  });
}

export interface SpawnFzfOptions extends FzfOptions {
  stdio?: "pipe" | "inherit";
}

/**
 * Low-level function to spawn fzf with custom options
 * Returns the child process for direct control
 */
export function spawnFzf(
  items: string[],
  options: SpawnFzfOptions = {},
): ChildProcess {
  const args: string[] = [];

  if (options.ansi) {
    args.push("--ansi");
  }

  if (options.layout) {
    args.push("--layout", options.layout);
  }

  if (options.border) {
    args.push("--border", options.border);
  }

  if (options.borderLabel) {
    args.push("--border-label", options.borderLabel);
  }

  if (options.prompt) {
    args.push("--prompt", options.prompt);
  }

  if (options.header) {
    args.push("--header", options.header);
  }

  if (options.previewCommand) {
    args.push("--preview", options.previewCommand);
  }

  if (options.previewWindow) {
    args.push("--preview-window", options.previewWindow);
  }

  if (options.bindings) {
    for (const binding of options.bindings) {
      args.push("--bind", `${binding.key}:${binding.action}`);
    }
  }

  const fzf = spawn("fzf", args, {
    stdio:
      options.stdio === "inherit"
        ? ["pipe", "pipe", "inherit"]
        : ["pipe", "pipe", "pipe"],
  });

  // Write items to stdin
  fzf.stdin?.write(items.join("\n"));
  fzf.stdin?.end();

  return fzf;
}
