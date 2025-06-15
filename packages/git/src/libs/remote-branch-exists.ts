import { type Result, err, ok } from "@aku11i/phantom-shared";
import { executeGitCommand } from "../executor.ts";

export async function remoteBranchExists(
  gitRoot: string,
  remote: string,
  branch: string,
): Promise<Result<boolean, Error>> {
  try {
    await executeGitCommand(
      ["show-ref", "--verify", "--quiet", `refs/remotes/${remote}/${branch}`],
      {
        cwd: gitRoot,
      },
    );
    return ok(true);
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("exit code 1")) {
      return ok(false);
    }
    return err(
      error instanceof Error
        ? error
        : new Error(`Failed to check remote branch: ${String(error)}`),
    );
  }
}
