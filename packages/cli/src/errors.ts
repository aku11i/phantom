import { exitCodes } from "@aku11i/phantom-shared";
import { output } from "./output.ts";

export { exitCodes };

export function exitWithSuccess(): never {
  process.exit(exitCodes.success);
}

export function exitWithError(
  message: string,
  exitCode: number = exitCodes.generalError,
): never {
  output.error(message);
  process.exit(exitCode);
}
