import { getVersion } from "../../commands/version.js";
import { exitWithSuccess } from "../errors.js";
import { output } from "../output.js";

export function versionHandler(): void {
  const version = getVersion();
  output.log(`Phantom v${version}`);
  exitWithSuccess();
}
