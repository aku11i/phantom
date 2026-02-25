import { isErr } from "@aku11i/phantom-shared";
import { humanId } from "human-id";
import { listWorktrees } from "./list.ts";

const MAX_RETRIES = 10;

function generate(): string {
  return humanId({ separator: "-", capitalize: false });
}

export async function generateUniqueName(gitRoot: string): Promise<string> {
  const worktreesResult = await listWorktrees(gitRoot);

  const existingNames = new Set<string>();
  if (!isErr(worktreesResult)) {
    for (const wt of worktreesResult.value.worktrees) {
      existingNames.add(wt.name);
    }
  }

  for (let i = 0; i < MAX_RETRIES; i++) {
    const name = generate();
    if (!existingNames.has(name)) {
      return name;
    }
  }

  throw new Error(
    "Failed to generate a unique worktree name after maximum retries",
  );
}
