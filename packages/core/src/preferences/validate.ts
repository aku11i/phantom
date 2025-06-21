import { type Result, err, ok } from "@aku11i/phantom-shared";
import { z } from "zod";
import type { PhantomPreferences } from "./loader.ts";

export class PreferencesValidationError extends Error {
  constructor(message: string) {
    super(`Invalid phantom.json: ${message}`);
    this.name = this.constructor.name;
  }
}

export const phantomPreferencesSchema = z
  .object({
    worktreesDirectory: z.string().optional(),
  })
  .passthrough();

export function validatePreferences(
  preferences: unknown,
): Result<PhantomPreferences, PreferencesValidationError> {
  const result = phantomPreferencesSchema.safeParse(preferences);

  if (!result.success) {
    const error = result.error;

    // Get the first error message from Zod's formatted output
    const firstError = error.errors[0];
    const path = firstError.path.join(".");
    const message = path
      ? `${path}: ${firstError.message}`
      : firstError.message;

    return err(new PreferencesValidationError(message));
  }

  return ok(result.data as PhantomPreferences);
}
