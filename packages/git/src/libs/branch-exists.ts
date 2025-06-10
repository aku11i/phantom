import { type Result, err, isErr, ok } from "@aku11i/phantom-shared";
import { executeGitCommand } from "../executor.ts";

export async function branchExists(
  gitRoot: string,
  branchName: string,
): Promise<Result<boolean, Error>> {
  try {
    await executeGitCommand(
      ["show-ref", "--verify", "--quiet", `refs/heads/${branchName}`],
      { cwd: gitRoot },
    );
    return ok(true);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error) {
      const execError = error as { code?: number; message?: string };
      if (execError.code === 1) {
        return ok(false);
      }
    }
    return err(
      new Error(
        `Failed to check branch existence: ${
          error instanceof Error ? error.message : String(error)
        }`,
      ),
    );
  }
}
