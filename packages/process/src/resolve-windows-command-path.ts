import { execFileSync } from "node:child_process";
import path from "node:path";

export function resolveWindowsCommandPath(commandOrPath: string): string {
  if (process.platform !== "win32") {
    throw new Error("resolveWindowsCommandPath is only supported on Windows");
  }

  if (path.dirname(commandOrPath) !== ".") {
    return commandOrPath;
  }

  try {
    const stdout = execFileSync("where.exe", [commandOrPath], {
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });

    const executablePath = stdout.toString().trim();

    if (executablePath) {
      return executablePath;
    }
  } catch {
    // Swallow errors and fall back to the provided command.
  }

  return commandOrPath;
}
