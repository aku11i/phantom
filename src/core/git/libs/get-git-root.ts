import { executeGitCommand } from "../executor.ts";

export async function getGitRoot(): Promise<string> {
  const { stdout } = await executeGitCommand(["rev-parse", "--show-toplevel"]);
  return stdout;
}
