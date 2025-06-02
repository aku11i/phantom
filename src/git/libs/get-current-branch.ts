import childProcess from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(childProcess.exec);

export async function getCurrentBranch(): Promise<string> {
  const { stdout } = await execAsync("git branch --show-current");
  return stdout.trim();
}
