import { parseArgs } from "node:util";
import { exitWithSuccess } from "../errors.ts";
import { output } from "../output.ts";
import { getVersion } from "../version.ts";

export function versionHandler(args: string[] = []): void {
  parseArgs({
    args,
    options: {},
    strict: true,
    allowPositionals: false,
  });
  // TODO: Use getCliVersion when available
  const version = getVersion();
  output.log(`Phantom v${version}`);
  exitWithSuccess();
}
