import { deleteWorktree } from "@aku11i/phantom-core";
import { getGitRoot } from "@aku11i/phantom-git";
import { isOk } from "@aku11i/phantom-shared";
import type { Tool } from "./types.js";

export const deleteWorktreeTool: Tool = {
  name: "phantom_delete",
  description: "Delete a Git worktree (phantom)",
  inputSchema: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "Name of the worktree to delete",
      },
      force: {
        type: "boolean",
        description: "Force deletion even if there are uncommitted changes",
      },
    },
    required: ["name"],
  },
  handler: async (args) => {
    const name = args.name as string;
    const force = args.force as boolean | undefined;

    const gitRoot = await getGitRoot();
    const result = await deleteWorktree(gitRoot, name, { force });

    if (!isOk(result)) {
      throw new Error(result.error.message);
    }

    return {
      success: true,
      message: `Worktree '${name}' deleted successfully`,
    };
  },
};
