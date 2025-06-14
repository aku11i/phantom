import { createWorktree } from "@aku11i/phantom-core";
import { getGitRoot } from "@aku11i/phantom-git";
import { isOk } from "@aku11i/phantom-shared";
import { z } from "zod";
import type { Tool } from "./types.js";

const schema = z.object({
  name: z
    .string()
    .describe("Name for the worktree (also used as the branch name)"),
  baseBranch: z
    .string()
    .optional()
    .describe("Base branch to create from (optional)"),
});

export const createWorktreeTool: Tool<typeof schema> = {
  name: "phantom_create_worktree",
  description: "Create a new Git worktree (phantom)",
  inputSchema: schema,
  handler: async ({ name, baseBranch }) => {
    const gitRoot = await getGitRoot();
    const result = await createWorktree(gitRoot, name, {
      branch: name,
      commitish: baseBranch,
    });

    if (!isOk(result)) {
      throw new Error(result.error.message);
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              success: true,
              message: result.value.message,
              path: result.value.path,
              copiedFiles: result.value.copiedFiles,
              skippedFiles: result.value.skippedFiles,
              copyError: result.value.copyError,
            },
            null,
            2,
          ),
        },
      ],
    };
  },
};
