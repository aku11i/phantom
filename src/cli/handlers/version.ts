import { getVersion } from "../../commands/version.ts";
import { exitWithSuccess } from "../errors.ts";
import { output } from "../output.ts";

export function versionHandler(): void {
  const version = getVersion();
  output.log(`Phantom v${version}`);
  exitWithSuccess();
}
