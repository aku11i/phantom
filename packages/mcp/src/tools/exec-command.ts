import { execInWorktree } from "@aku11i/phantom-core";
import { getGitRoot } from "@aku11i/phantom-git";
import { isOk } from "@aku11i/phantom-shared";
import { z } from "zod";
import type { Tool } from "./types.js";

const schema = z.object({
  name: z.string().describe("Name of the worktree to execute command in"),
  command: z.string().describe("Command to execute"),
  args: z.array(z.string()).optional().describe("Command arguments"),
});

export const execCommandTool: Tool<typeof schema> = {
  name: "phantom_exec_in_worktree",
  description: "Execute a command in a specific worktree",
  inputSchema: schema,
  handler: async ({ name, command, args }) => {
    const gitRoot = await getGitRoot();
    const result = await execInWorktree(
      gitRoot,
      name,
      [command, ...(args || [])],
      { interactive: false },
    );

    if (!isOk(result)) {
      throw new Error(result.error.message);
    }

    return {
      success: true,
      exitCode: result.value.exitCode,
    };
  },
};
