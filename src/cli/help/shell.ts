import type { CommandHelp } from "../help.ts";

export const shellHelp: CommandHelp = {
  name: "shell",
  description: "Open an interactive shell in a worktree directory",
  usage: "phantom shell <worktree-name> [options]",
  options: [
    {
      name: "--fzf",
      type: "boolean",
      description: "Use fzf for interactive selection",
    },
  ],
  examples: [
    {
      description: "Open a shell in a worktree",
      command: "phantom shell feature-auth",
    },
    {
      description: "Open a shell with interactive fzf selection",
      command: "phantom shell --fzf",
    },
  ],
  notes: [
    "Uses your default shell from the SHELL environment variable",
    "The shell starts with the worktree directory as the working directory",
    "Type 'exit' to return to your original directory",
    "With --fzf, you can interactively select the worktree to enter",
  ],
};
