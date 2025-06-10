import { parseArgs } from "node:util";
import { getVersion } from "../../core/version.ts";
import { exitWithSuccess } from "../errors.ts";
import { output } from "../output.ts";

export function versionHandler(args: string[] = []): void {
  parseArgs({
    args,
    options: {},
    strict: true,
    allowPositionals: false,
  });
  const version = getVersion();
  output.log(`Phantom v${version}`);
  exitWithSuccess();
}
