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

function getPreferencesPath(): string | null {
  // XDG_CONFIG_HOME is preferred over HOME
  if (process.env.XDG_CONFIG_HOME) {
    return path.join(process.env.XDG_CONFIG_HOME, "phantom", "phantom.json");
  }

  // Fall back to HOME directory only if XDG_CONFIG_HOME is not set
  try {
    const home = homedir();
    if (!home) {
      return null;
    }
    return path.join(home, ".config", "phantom", "phantom.json");
  } catch {
    // homedir() may throw if HOME is not set
    return null;
  }
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

  if (!preferencesPath) {
    return err(new PreferencesNotFoundError());
  }

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
