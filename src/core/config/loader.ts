import fs from "node:fs/promises";
import path from "node:path";
import { type Result, err, ok } from "../types/result.ts";
import { type ConfigValidationError, validateConfig } from "./validate.ts";

export interface PhantomConfig {
  postCreate?: {
    copyFiles?: string[];
    commands?: string[];
  };
  postDelete?: {
    commands?: string[];
  };
}

export class ConfigNotFoundError extends Error {
  constructor() {
    super("phantom.config.json not found");
    this.name = "ConfigNotFoundError";
  }
}

export class ConfigParseError extends Error {
  constructor(message: string) {
    super(`Failed to parse phantom.config.json: ${message}`);
    this.name = "ConfigParseError";
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
