import fs from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";
import { type Result, err, ok } from "@aku11i/phantom-shared";
import type { z } from "zod";
import {
  type PreferencesValidationError,
  type phantomPreferencesSchema,
  validatePreferences,
} from "./validate.ts";

export type PhantomPreferences = z.infer<typeof phantomPreferencesSchema>;

export class PreferencesNotFoundError extends Error {
  constructor() {
    super("phantom.json not found");
    this.name = this.constructor.name;
  }
}

export class PreferencesParseError extends Error {
  constructor(message: string) {
    super(`Failed to parse phantom.json: ${message}`);
    this.name = this.constructor.name;
  }
}

function getPreferencesPath(): string {
  const configHome =
    process.env.XDG_CONFIG_HOME || path.join(homedir(), ".config");
  return path.join(configHome, "phantom", "phantom.json");
}

export async function loadPreferences(): Promise<
  Result<
    PhantomPreferences,
    | PreferencesNotFoundError
    | PreferencesParseError
    | PreferencesValidationError
  >
> {
  const preferencesPath = getPreferencesPath();

  try {
    const content = await fs.readFile(preferencesPath, "utf-8");
    try {
      const parsed = JSON.parse(content);
      const validationResult = validatePreferences(parsed);

      if (!validationResult.ok) {
        return err(validationResult.error);
      }

      return ok(validationResult.value);
    } catch (error) {
      return err(
        new PreferencesParseError(
          error instanceof Error ? error.message : String(error),
        ),
      );
    }
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return err(new PreferencesNotFoundError());
    }
    throw error;
  }
}
