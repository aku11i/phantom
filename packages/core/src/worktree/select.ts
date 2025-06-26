import { selectWithFzf } from "@aku11i/phantom-process";
import { type Result, isErr } from "@aku11i/phantom-shared";
import { type WorktreeInfo, listWorktrees } from "./list.ts";

export type SelectWorktreeResult = WorktreeInfo;

export async function selectWorktreeWithFzf(
  gitRoot: string,
  worktreeDirectory: string,
): Promise<Result<SelectWorktreeResult | null, Error>> {
  const listResult = await listWorktrees(gitRoot, worktreeDirectory);

  if (isErr(listResult)) {
    return listResult;
  }

  const { worktrees } = listResult.value;

  if (worktrees.length === 0) {
    return {
      ok: true,
      value: null,
    };
  }

  const fzfResult = await selectWithFzf(
    worktrees.map(
      (wt) =>
        `${wt.name} (${wt.type}) ${wt.branch} ${wt.isClean ? "" : "[dirty]"}`,
    ),
    {
      prompt: "Select worktree> ",
      header: "Git Worktrees",
    },
  );

  if (isErr(fzfResult)) {
    return fzfResult;
  }

  if (!fzfResult.value) {
    return {
      ok: true,
      value: null,
    };
  }

  const selectedName = fzfResult.value.split(" ")[0];
  const selectedWorktree = worktrees.find((wt) => wt.name === selectedName);

  if (!selectedWorktree) {
    return {
      ok: false,
      error: new Error("Selected worktree not found"),
    };
  }

  return {
    ok: true,
    value: selectedWorktree,
  };
}
