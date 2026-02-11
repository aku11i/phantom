import { err, ok, type Result } from "@aku11i/phantom-shared";
import { executeGitCommand } from "../executor.ts";

export async function branchExists(
  gitRoot: string,
  branchName: string,
): Promise<Result<boolean, Error>> {
  try {
    // Don't use --quiet because executeGitCommand relies on stderr to detect errors
    const result = await executeGitCommand(
      ["show-ref", "--verify", `refs/heads/${branchName}`],
      { cwd: gitRoot },
    );
    // If we get output, the branch exists
    return ok(result.stdout.length > 0);
  } catch (error) {
    // show-ref returns exit code 1 with error message when ref doesn't exist
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      if (
        message.includes("not a valid ref") ||
        message.includes("does not exist")
      ) {
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
