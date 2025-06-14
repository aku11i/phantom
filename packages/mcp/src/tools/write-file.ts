import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { getWorktreePath } from "@aku11i/phantom-core";
import { getGitRoot } from "@aku11i/phantom-git";
import { z } from "zod";
import type { Tool } from "./types.js";

const schema = z.object({
  name: z.string().describe("Name of the worktree"),
  path: z.string().describe("Relative path to the file within the worktree"),
  content: z.string().describe("Content to write to the file"),
});

export const writeFileTool: Tool<typeof schema> = {
  name: "phantom_write_file_to_worktree",
  description: "Write a file to a specific worktree",
  inputSchema: schema,
  handler: async ({ name, path, content }) => {
    const gitRoot = await getGitRoot();
    const worktreePath = getWorktreePath(gitRoot, name);
    const filePath = join(worktreePath, path);

    try {
      await mkdir(dirname(filePath), { recursive: true });
      await writeFile(filePath, content, "utf-8");
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: true,
                message: `File written successfully to ${path}`,
              },
              null,
              2,
            ),
          },
        ],
      };
    } catch (error) {
      throw new Error(
        `Failed to write file: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  },
};
