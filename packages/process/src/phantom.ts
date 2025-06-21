import { spawn } from "node:child_process";

/**
 * Spawn a phantom command
 */
export function spawnPhantomCommand(
  args: string[],
  options: { stdio?: "inherit" | "pipe" } = {},
): void {
  spawn("phantom", args, {
    stdio: options.stdio || "inherit",
  });
}
