import { type Result, err, ok } from "../types/result.ts";
import { WorktreeNotFoundError } from "./errors.ts";
import { validateWorktreeExists } from "./validate.ts";

export interface WhereWorktreeSuccess {
  path: string;
}

export async function whereWorktree(
  gitRoot: string,
  name: string,
): Promise<Result<WhereWorktreeSuccess, WorktreeNotFoundError>> {
  const validation = await validateWorktreeExists(gitRoot, name);

  if (!validation.exists) {
    return err(new WorktreeNotFoundError(name));
  }

  return ok({
    path: validation.path as string,
  });
}
