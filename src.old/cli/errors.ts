import { output } from "./output.ts";

export const exitCodes = {
  success: 0,
  generalError: 1,
  notFound: 2,
  validationError: 3,
} as const;

export function handleError(
  error: unknown,
  exitCode: number = exitCodes.generalError,
): never {
  if (error instanceof Error) {
    output.error(error.message);
  } else {
    output.error(String(error));
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
  output.error(message);
  process.exit(exitCode);
}
