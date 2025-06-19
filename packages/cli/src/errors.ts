import { exitCodes } from "@aku11i/phantom-shared";

export { exitCodes };

export function handleError(
  error: unknown,
  exitCode: number = exitCodes.generalError,
): never {
  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error(String(error));
  }
  process.exit(exitCode);
}

export function exitWithSuccess(): never {
  process.exit(exitCodes.success);
}

export function exitWithError(
  message: string,
  exitCode: number = exitCodes.generalError,
): never {
  console.error(message);
  process.exit(exitCode);
}
