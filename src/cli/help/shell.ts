import type { CommandHelp } from "../help.ts";

export const shellHelp: CommandHelp = {
  name: "shell",
  description: "Open an interactive shell in a worktree directory",
  usage: "phantom shell <worktree-name>",
  examples: [
    {
      description: "Open a shell in a worktree",
      command: "phantom shell feature-auth",
    },
  ],
  notes: [
    "Uses your default shell from the SHELL environment variable",
    "The shell starts with the worktree directory as the working directory",
    "Type 'exit' to return to your original directory",
  ],
};
