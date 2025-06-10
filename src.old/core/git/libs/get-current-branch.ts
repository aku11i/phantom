import { executeGitCommand } from "../executor.ts";

export async function getCurrentBranch(): Promise<string> {
  const { stdout } = await executeGitCommand(["branch", "--show-current"]);
  return stdout;
}
