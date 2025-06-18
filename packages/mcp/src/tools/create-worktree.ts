import {
  createWorktree,
  getWorktreesDirectory,
  loadConfig,
} from "@aku11i/phantom-core";
import { getGitRoot } from "@aku11i/phantom-git";
import { isOk } from "@aku11i/phantom-shared";
import { z } from "zod";
import type { Tool } from "./types.ts";

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
    const configResult = await loadConfig(gitRoot);
    const worktreesDirectory = isOk(configResult)
      ? configResult.value.worktreesDirectory
      : undefined;
    const worktreesPath = getWorktreesDirectory(gitRoot, worktreesDirectory);
    const result = await createWorktree(gitRoot, worktreesPath, name, {
      branch: name,
      base: baseBranch,
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
              message: `Worktree '${name}' created successfully.`,
              path: result.value.path,
              note: `You can now switch to the worktree using 'cd ${result.value.path}'`,
            },
            null,
            2,
          ),
        },
      ],
    };
  },
};
