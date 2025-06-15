import { join } from "node:path";
import { getGitRoot } from "@aku11i/phantom-git";
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
  description:
    "Checkout a GitHub issue or pull request by number into a new worktree",
  inputSchema: schema,
  handler: async ({ number, base }) => {
    const result = await githubCheckout({ number, base });

    if (!isOk(result)) {
      throw new Error(result.error.message);
    }

    const gitRoot = await getGitRoot();
    const worktreeName = number.startsWith("pr-") ? number : `issue-${number}`;
    const worktrePath = join(
      gitRoot,
      ".git",
      "phantom",
      "worktrees",
      worktreeName,
    );

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              success: true,
              message: result.value.message,
              worktree: worktreeName,
              path: worktrePath,
              note: result.value.alreadyExists
                ? "Worktree already exists"
                : `You can now switch to the worktree using 'cd ${worktrePath}'`,
            },
            null,
            2,
          ),
        },
      ],
    };
  },
};
