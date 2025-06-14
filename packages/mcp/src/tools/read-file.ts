import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getWorktreePath } from "@aku11i/phantom-core";
import { getGitRoot } from "@aku11i/phantom-git";
import type { Tool } from "./types.js";

export const readFileTool: Tool = {
  name: "phantom_read_file",
  description: "Read a file from a specific worktree",
  inputSchema: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "Name of the worktree",
      },
      path: {
        type: "string",
        description: "Relative path to the file within the worktree",
      },
    },
    required: ["name", "path"],
  },
  handler: async (args) => {
    const name = args.name as string;
    const path = args.path as string;

    const gitRoot = await getGitRoot();
    const worktreePath = getWorktreePath(gitRoot, name);
    const filePath = join(worktreePath, path);

    try {
      const content = await readFile(filePath, "utf-8");
      return {
        success: true,
        content,
      };
    } catch (error) {
      throw new Error(
        `Failed to read file: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  },
};
