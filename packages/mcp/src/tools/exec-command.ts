import { execInWorktree } from "@aku11i/phantom-core";
import { getGitRoot } from "@aku11i/phantom-git";
import { isOk } from "@aku11i/phantom-shared";
import type { Tool } from "./types.js";

export const execCommandTool: Tool = {
  name: "phantom_exec_in_worktree",
  description: "Execute a command in a specific worktree",
  inputSchema: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "Name of the worktree to execute command in",
      },
      command: {
        type: "string",
        description: "Command to execute",
      },
      args: {
        type: "array",
        items: {
          type: "string",
        },
        description: "Command arguments",
      },
    },
    required: ["name", "command"],
  },
  handler: async (args) => {
    const name = args.name as string;
    const command = args.command as string;
    const commandArgs = (args.args as string[]) || [];

    const gitRoot = await getGitRoot();
    const result = await execInWorktree(
      gitRoot,
      name,
      [command, ...commandArgs],
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
