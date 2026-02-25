import { branchExists } from "@aku11i/phantom-git";
import { err, isOk, ok, type Result } from "@aku11i/phantom-shared";
import { humanId } from "human-id";
import { getWorktreePathFromDirectory } from "../paths.ts";
import { validateWorktreeDirectoryExists } from "./validate.ts";

const MAX_RETRIES = 10;

function generate(): string {
  return humanId({ separator: "-", capitalize: false });
}

export async function generateUniqueName(
  gitRoot: string,
  worktreesDirectory: string,
): Promise<Result<string, Error>> {
  for (let i = 0; i < MAX_RETRIES; i++) {
    const name = generate();

    const worktreePath = getWorktreePathFromDirectory(worktreesDirectory, name);
    if (await validateWorktreeDirectoryExists(worktreePath)) {
      continue;
    }

    const result = await branchExists(gitRoot, name);
    if (isOk(result) && result.value) {
      continue;
    }

    return ok(name);
  }

  return err(
    new Error(
      "Failed to generate a unique worktree name after maximum retries",
    ),
  );
}
