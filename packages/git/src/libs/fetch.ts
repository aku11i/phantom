import { type Result, err, ok } from "@aku11i/phantom-shared";
import { executeGitCommand } from "../executor.ts";

export interface FetchOptions {
  remote?: string;
  refspec?: string;
  cwd?: string;
}

export async function fetch(options: FetchOptions = {}): Promise<Result<void>> {
  const { remote = "origin", refspec, cwd } = options;

  const args = ["fetch", remote];
  if (refspec) {
    args.push(refspec);
  }

  const result = await executeGitCommand(args, { cwd });
  if (result.error) {
    return err(new Error(`git fetch failed: ${result.stderr || result.error.message}`));
  }

  return ok(undefined);
}