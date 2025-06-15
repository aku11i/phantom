import { parseArgs } from "node:util";
import { githubCheckout } from "@aku11i/phantom-github";

export async function githubCheckoutHandler(args: string[]): Promise<void> {
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
    throw new Error("Please specify a PR or issue number");
  }

  await githubCheckout({ number, base: values.base });
}
