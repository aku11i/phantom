import { parseArgs } from "node:util";
import { githubCheckout } from "@aku11i/phantom-github";
import { DefaultLogger, isErr } from "@aku11i/phantom-shared";
import { exitCodes, exitWithError } from "../errors.ts";

export async function githubCheckoutHandler(args: string[]): Promise<void> {
  const logger = new DefaultLogger();
  const { positionals, values } = parseArgs({
    args,
    options: {
      base: {
        type: "string",
      },
    },
    allowPositionals: true,
  });

  const [number] = positionals;

  if (!number) {
    exitWithError(
      "Please specify a PR or issue number",
      exitCodes.validationError,
    );
  }

  const result = await githubCheckout({ number, base: values.base }, logger);

  if (isErr(result)) {
    exitWithError(result.error.message, exitCodes.generalError);
  }

  // Output the success message
  logger.log(result.value.message);
}
