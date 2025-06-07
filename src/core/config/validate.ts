import { type Result, err, ok } from "../types/result.ts";
import type { PhantomConfig } from "./loader.ts";

export class ConfigValidationError extends Error {
  constructor(message: string) {
    super(`Invalid phantom.config.json: ${message}`);
    this.name = "ConfigValidationError";
  }
}

export function validateConfig(
  config: unknown,
): Result<PhantomConfig, ConfigValidationError> {
  if (typeof config !== "object" || config === null || Array.isArray(config)) {
    return err(new ConfigValidationError("Configuration must be an object"));
  }

  const cfg = config as Record<string, unknown>;

  if (cfg.postCreate !== undefined) {
    if (
      typeof cfg.postCreate !== "object" ||
      cfg.postCreate === null ||
      Array.isArray(cfg.postCreate)
    ) {
      return err(new ConfigValidationError("postCreate must be an object"));
    }

    const postCreate = cfg.postCreate as Record<string, unknown>;
    if (postCreate.copyFiles !== undefined) {
      if (!Array.isArray(postCreate.copyFiles)) {
        return err(
          new ConfigValidationError("postCreate.copyFiles must be an array"),
        );
      }

      if (!postCreate.copyFiles.every((f: unknown) => typeof f === "string")) {
        return err(
          new ConfigValidationError(
            "postCreate.copyFiles must contain only strings",
          ),
        );
      }
    }
  }

  return ok(config as PhantomConfig);
}
