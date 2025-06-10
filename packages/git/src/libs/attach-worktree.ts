import { type Result, err, ok } from "@aku11i/phantom-shared";
import { executeGitCommand } from "../executor.ts";

export async function attachWorktree(
  gitRoot: string,
  worktreePath: string,
  branchName: string,
): Promise<Result<void, Error>> {
  try {
    await executeGitCommand(["worktree", "add", worktreePath, branchName], {
      cwd: gitRoot,
    });
    return ok(undefined);
  } catch (error) {
    return err(
      error instanceof Error
        ? error
        : new Error(`Failed to attach worktree: ${String(error)}`),
    );
  }
}
