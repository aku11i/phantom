import { githubCheckout } from "@aku11i/phantom-github";
import { isOk } from "@aku11i/phantom-shared";
import { z } from "zod";
import type { Tool } from "./types.ts";

const schema = z.object({
  number: z.string().describe("Issue or pull request number to checkout"),
  base: z
    .string()
    .optional()
    .describe("Base branch for issues (not applicable for pull requests)"),
});

export const githubCheckoutTool: Tool<typeof schema> = {
  name: "phantom_github_checkout",
  description: "Checkout a GitHub issue or pull request by number",
  inputSchema: schema,
  handler: async ({ number, base }) => {
    const result = await githubCheckout({ number, base });

    if (!isOk(result)) {
      throw new Error(result.error.message);
    }

    return {
      content: [
        {
          type: "text",
          text: result.value.message,
        },
      ],
    };
  },
};
