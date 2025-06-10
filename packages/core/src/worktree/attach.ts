import { existsSync } from "node:fs";
import { attachWorktree, branchExists } from "@aku11i/phantom-git";
import { type Result, err, isErr, ok } from "@aku11i/phantom-shared";
import { getWorktreePath } from "../paths.ts";
import { BranchNotFoundError, WorktreeAlreadyExistsError } from "./errors.ts";
import { validateWorktreeName } from "./validate.ts";

export async function attachWorktreeCore(
  gitRoot: string,
  name: string,
): Promise<Result<string, Error>> {
  const validation = validateWorktreeName(name);
  if (isErr(validation)) {
    return validation;
  }

  const worktreePath = getWorktreePath(gitRoot, name);
  if (existsSync(worktreePath)) {
    return err(new WorktreeAlreadyExistsError(name));
  }

  const branchCheckResult = await branchExists(gitRoot, name);
  if (isErr(branchCheckResult)) {
    return err(branchCheckResult.error);
  }

  if (!branchCheckResult.value) {
    return err(new BranchNotFoundError(name));
  }

  const attachResult = await attachWorktree(gitRoot, worktreePath, name);
  if (isErr(attachResult)) {
    return err(attachResult.error);
  }

  return ok(worktreePath);
}
