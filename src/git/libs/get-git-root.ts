import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

export async function getGitRoot(): Promise<string> {
  const { stdout } = await execAsync("git rev-parse --show-toplevel");
  return stdout.trim();
}
