import fs from "node:fs/promises";
import path from "node:path";
import { BaseError, type Result, err, ok } from "@aku11i/phantom-shared";
import { type ConfigValidationError, validateConfig } from "./validate.ts";

export interface PhantomConfig {
  postCreate?: {
    copyFiles?: string[];
    commands?: string[];
  };
}

export class ConfigNotFoundError extends BaseError {
  constructor() {
    super("phantom.config.json not found");
  }
}

export class ConfigParseError extends BaseError {
  constructor(message: string) {
    super(`Failed to parse phantom.config.json: ${message}`);
  }
}

export async function loadConfig(
  gitRoot: string,
): Promise<
  Result<
    PhantomConfig,
    ConfigNotFoundError | ConfigParseError | ConfigValidationError
  >
> {
  const configPath = path.join(gitRoot, "phantom.config.json");

  try {
    const content = await fs.readFile(configPath, "utf-8");
    try {
      const parsed = JSON.parse(content);
      const validationResult = validateConfig(parsed);

      if (!validationResult.ok) {
        return err(validationResult.error);
      }

      return ok(validationResult.value);
    } catch (error) {
      return err(
        new ConfigParseError(
          error instanceof Error ? error.message : String(error),
        ),
      );
    }
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return err(new ConfigNotFoundError());
    }
    throw error;
  }
}
