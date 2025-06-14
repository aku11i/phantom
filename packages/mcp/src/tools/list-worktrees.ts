import { listWorktrees } from "@aku11i/phantom-core";
import { getGitRoot } from "@aku11i/phantom-git";
import { isOk } from "@aku11i/phantom-shared";
import type { Tool } from "./types.js";

export const listWorktreesTool: Tool = {
  name: "phantom_list",
  description: "List all Git worktrees (phantoms)",
  inputSchema: {
    type: "object",
    properties: {},
  },
  handler: async () => {
    const gitRoot = await getGitRoot();
    const result = await listWorktrees(gitRoot);

    if (!isOk(result)) {
      throw new Error("Failed to list worktrees");
    }

    return {
      worktrees: result.value.worktrees.map((wt) => ({
        name: wt.name,
        path: wt.path,
        branch: wt.branch,
        isClean: wt.isClean,
      })),
    };
  },
};
