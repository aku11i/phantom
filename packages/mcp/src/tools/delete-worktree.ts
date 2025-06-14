import { deleteWorktree } from "@aku11i/phantom-core";
import { getGitRoot } from "@aku11i/phantom-git";
import { isOk } from "@aku11i/phantom-shared";
import { z } from "zod";
import type { Tool } from "./types.ts";

const schema = z.object({
  name: z.string().describe("Name of the worktree to delete"),
  force: z
    .boolean()
    .optional()
    .describe("Force deletion even if there are uncommitted changes"),
});

export const deleteWorktreeTool: Tool<typeof schema> = {
  name: "phantom_delete_worktree",
  description: "Delete a Git worktree (phantom)",
  inputSchema: schema,
  handler: async ({ name, force }) => {
    const gitRoot = await getGitRoot();
    const result = await deleteWorktree(gitRoot, name, { force });

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
              message: `Worktree '${name}' deleted successfully`,
            },
            null,
            2,
          ),
        },
      ],
    };
  },
};
