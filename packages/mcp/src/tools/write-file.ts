import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { getWorktreePath } from "@aku11i/phantom-core";
import { getGitRoot } from "@aku11i/phantom-git";
import type { Tool } from "./types.js";

export const writeFileTool: Tool = {
  name: "phantom_write_file_to_worktree",
  description: "Write a file to a specific worktree",
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
      content: {
        type: "string",
        description: "Content to write to the file",
      },
    },
    required: ["name", "path", "content"],
  },
  handler: async (args) => {
    const name = args.name as string;
    const path = args.path as string;
    const content = args.content as string;

    const gitRoot = await getGitRoot();
    const worktreePath = getWorktreePath(gitRoot, name);
    const filePath = join(worktreePath, path);

    try {
      await mkdir(dirname(filePath), { recursive: true });
      await writeFile(filePath, content, "utf-8");
      return {
        success: true,
        message: `File written successfully to ${path}`,
      };
    } catch (error) {
      throw new Error(
        `Failed to write file: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  },
};
