import { dirname, resolve } from "node:path";
import { executeGitCommand } from "../executor.ts";

export async function getGitRoot(): Promise<string> {
  const { stdout } = await executeGitCommand(["rev-parse", "--git-common-dir"]);

  if (stdout.endsWith("/.git") || stdout === ".git") {
    return resolve(process.cwd(), dirname(stdout));
  }

  const { stdout: toplevel } = await executeGitCommand([
    "rev-parse",
    "--show-toplevel",
  ]);
  return toplevel;
}
