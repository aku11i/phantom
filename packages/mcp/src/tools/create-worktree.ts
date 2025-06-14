import { createWorktree } from "@aku11i/phantom-core";
import { getGitRoot } from "@aku11i/phantom-git";
import { isOk } from "@aku11i/phantom-shared";
import type { Tool } from "./types.js";

export const createWorktreeTool: Tool = {
  name: "phantom_create_worktree",
  description: "Create a new Git worktree (phantom)",
  inputSchema: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "Name for the worktree (also used as the branch name)",
      },
      baseBranch: {
        type: "string",
        description: "Base branch to create from (optional)",
      },
    },
    required: ["name"],
  },
  handler: async (args) => {
    const name = args.name as string;
    const baseBranch = args.baseBranch as string | undefined;

    const gitRoot = await getGitRoot();
    const result = await createWorktree(gitRoot, name, {
      branch: name,
      commitish: baseBranch,
    });

    if (!isOk(result)) {
      throw new Error(result.error.message);
    }

    return {
      success: true,
      message: result.value.message,
      path: result.value.path,
      copiedFiles: result.value.copiedFiles,
      skippedFiles: result.value.skippedFiles,
      copyError: result.value.copyError,
    };
  },
};
