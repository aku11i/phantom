import { listWorktrees } from "@aku11i/phantom-core";
import { getGitRoot } from "@aku11i/phantom-git";
import { isOk } from "@aku11i/phantom-shared";
import { z } from "zod";
import type { Tool } from "./types.ts";

const schema = z.object({});

export const listWorktreesTool: Tool<typeof schema> = {
  name: "phantom_list_worktrees",
  description: "List all Git worktrees (phantoms)",
  inputSchema: schema,
  handler: async () => {
    const gitRoot = await getGitRoot();
    const result = await listWorktrees(gitRoot);

    if (!isOk(result)) {
      throw new Error("Failed to list worktrees");
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              worktrees: result.value.worktrees.map((wt) => ({
                name: wt.name,
                path: wt.path,
                branch: wt.branch,
                isClean: wt.isClean,
              })),
              note: `You can switch to a worktree using 'cd <path>'`,
            },
            null,
            2,
          ),
        },
      ],
    };
  },
};
