import { parseArgs } from "node:util";
import { DefaultLogger } from "@aku11i/phantom-shared";
import { exitWithSuccess } from "../errors.ts";
import { getVersion } from "../version.ts";

export function versionHandler(args: string[] = []): void {
  const logger = new DefaultLogger();
  parseArgs({
    args,
    options: {},
    strict: true,
    allowPositionals: false,
  });
  const version = getVersion();
  logger.log(`Phantom v${version}`);
  exitWithSuccess();
}
