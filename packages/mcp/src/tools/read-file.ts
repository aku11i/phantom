import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getWorktreePath } from "@aku11i/phantom-core";
import { getGitRoot } from "@aku11i/phantom-git";
import { z } from "zod";
import type { Tool } from "./types.js";

const schema = z.object({
  name: z.string().describe("Name of the worktree"),
  path: z.string().describe("Relative path to the file within the worktree"),
});

export const readFileTool: Tool<typeof schema> = {
  name: "phantom_read_file_from_worktree",
  description: "Read a file from a specific worktree",
  inputSchema: schema,
  handler: async ({ name, path }) => {
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
