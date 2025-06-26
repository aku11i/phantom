import { type Result, err, ok } from "@aku11i/phantom-shared";
import { listWorktrees } from "./list.ts";
import { WorktreeNotFoundError } from "./errors.ts";
import { getWorktreePathFromDirectory } from "../paths.ts";
import fs from "node:fs/promises";

export interface ResolveWorktreeSuccess {
  name: string;
  path: string;
  branch: string;
  isClean: boolean;
  type: "phantom" | "native";
}

export async function resolveWorktreeNameOrBranch(
  gitRoot: string,
  worktreeDirectory: string,
  nameOrBranch: string,
): Promise<Result<ResolveWorktreeSuccess, WorktreeNotFoundError>> {
  const listResult = await listWorktrees(gitRoot, worktreeDirectory);
  if (listResult.isErr) {
    return err(new WorktreeNotFoundError(nameOrBranch));
  }

  let worktree = listResult.value.worktrees.find(
    (wt) => wt.name === nameOrBranch,
  );

  if (worktree) {
    return ok(worktree);
  }

  worktree = listResult.value.worktrees.find(
    (wt) => wt.branch === nameOrBranch,
  );

  if (worktree) {
    return ok(worktree);
  }

  return err(new WorktreeNotFoundError(nameOrBranch));
}