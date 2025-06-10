import { selectWithFzf } from "@aku11i/phantom-process";
import { type Result, isErr } from "@aku11i/phantom-shared";
import { listWorktrees } from "./list.ts";

export interface SelectWorktreeResult {
  name: string;
  branch: string | null;
  isClean: boolean;
}

export async function selectWorktreeWithFzf(
  gitRoot: string,
): Promise<Result<SelectWorktreeResult | null, Error>> {
  const listResult = await listWorktrees(gitRoot);

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

  const list = worktrees.map((wt) => {
    const branchInfo = wt.branch ? `(${wt.branch})` : "";
    const status = !wt.isClean ? " [dirty]" : "";
    return `${wt.name} ${branchInfo}${status}`;
  });

  const fzfResult = await selectWithFzf(list, {
    prompt: "Select worktree> ",
    header: "Git Worktrees",
  });

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
    value: {
      name: selectedWorktree.name,
      branch: selectedWorktree.branch,
      isClean: selectedWorktree.isClean,
    },
  };
}
