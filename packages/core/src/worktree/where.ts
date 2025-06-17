import { type Result, err, isErr, ok } from "@aku11i/phantom-shared";
import type { WorktreeNotFoundError } from "./errors.ts";
import { validateWorktreeExists } from "./validate.ts";

export interface WhereWorktreeSuccess {
  path: string;
}

export async function whereWorktree(
  gitRoot: string,
  name: string,
  basePath: string | undefined,
): Promise<Result<WhereWorktreeSuccess, WorktreeNotFoundError>> {
  const validation = await validateWorktreeExists(gitRoot, name, basePath);

  if (isErr(validation)) {
    return err(validation.error);
  }

  return ok({
    path: validation.value.path,
  });
}
