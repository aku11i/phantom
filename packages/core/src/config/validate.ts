import { type Result, err, ok } from "@aku11i/phantom-shared";
import { z } from "zod";
import type { PhantomConfig } from "./loader.ts";

export class ConfigValidationError extends Error {
  constructor(message: string) {
    super(`Invalid phantom.config.json: ${message}`);
    this.name = this.constructor.name;
  }
}

const phantomConfigSchema = z
  .object({
    postCreate: z
      .object({
        copyFiles: z.array(z.string()).optional(),
        commands: z.array(z.string()).optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

export function validateConfig(
  config: unknown,
): Result<PhantomConfig, ConfigValidationError> {
  const result = phantomConfigSchema.safeParse(config);

  if (!result.success) {
    const errors = result.error.errors;
    const firstError = errors[0];
    let message: string;

    if (firstError.path.length === 0) {
      message = "Configuration must be an object";
    } else if (
      firstError.path[0] === "postCreate" &&
      firstError.path.length === 1
    ) {
      message = "postCreate must be an object";
    } else if (
      firstError.path[0] === "postCreate" &&
      firstError.path[1] === "copyFiles"
    ) {
      if (
        firstError.code === "invalid_type" &&
        firstError.expected === "array"
      ) {
        message = "postCreate.copyFiles must be an array";
      } else {
        message = "postCreate.copyFiles must contain only strings";
      }
    } else if (
      firstError.path[0] === "postCreate" &&
      firstError.path[1] === "commands"
    ) {
      if (
        firstError.code === "invalid_type" &&
        firstError.expected === "array"
      ) {
        message = "postCreate.commands must be an array";
      } else {
        message = "postCreate.commands must contain only strings";
      }
    } else {
      message = firstError.message;
    }

    return err(new ConfigValidationError(message));
  }

  return ok(result.data as PhantomConfig);
}
