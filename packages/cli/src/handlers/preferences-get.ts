import { parseArgs } from "node:util";
import { loadPreferences } from "@aku11i/phantom-core";
import { exitCodes, exitWithError, exitWithSuccess } from "../errors.ts";
import { output } from "../output.ts";

const supportedKeys = ["editor"] as const;

function normalizeKey(key: string): string {
  return key.startsWith("phantom.") ? key.slice("phantom.".length) : key;
}

export async function preferencesGetHandler(args: string[]): Promise<void> {
  const { positionals } = parseArgs({
    args,
    options: {},
    strict: true,
    allowPositionals: true,
  });

  if (positionals.length !== 1) {
    exitWithError(
      "Usage: phantom preferences get <key>",
      exitCodes.validationError,
    );
  }

  const inputKey = positionals[0];
  const normalizedKey = normalizeKey(inputKey);

  if (!supportedKeys.includes(normalizedKey as (typeof supportedKeys)[number])) {
    exitWithError(
      `Unknown preference '${inputKey}'. Supported keys: ${supportedKeys.join(", ")}`,
      exitCodes.validationError,
    );
  }

  try {
    const preferences = await loadPreferences();
    const value =
      normalizedKey === "editor" ? preferences.editor : undefined;

    if (value === undefined) {
      output.log(
        `Preference '${normalizedKey}' is not set (git config --global phantom.${normalizedKey})`,
      );
    } else {
      output.log(value);
    }

    exitWithSuccess();
  } catch (error) {
    exitWithError(
      error instanceof Error ? error.message : String(error),
      exitCodes.generalError,
    );
  }
}
