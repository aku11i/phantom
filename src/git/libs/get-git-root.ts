import { execSync } from "node:child_process";

export function getGitRoot(): string {
  return execSync("git rev-parse --show-toplevel", { encoding: "utf8" }).trim();
}
