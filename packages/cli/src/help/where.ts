import type { CommandHelp } from "../help.ts";

export const whereHelp: CommandHelp = {
  name: "where",
  description: "Output the filesystem path of a specific worktree",
  usage: "phantom where <worktree-name> [options]",
  options: [
    {
      name: "--fzf",
      type: "boolean",
      description: "Use fzf for interactive selection",
    },
  ],
  examples: [
    {
      description: "Get the path of a worktree",
      command: "phantom where feature-auth",
    },
    {
      description: "Change directory to a worktree",
      command: "cd $(phantom where staging)",
    },
    {
      description: "Get path with interactive fzf selection",
      command: "phantom where --fzf",
    },
    {
      description: "Change directory using fzf selection",
      command: "cd $(phantom where --fzf)",
    },
  ],
  notes: [
    "Outputs only the path, making it suitable for use in scripts",
    "Exits with an error code if the worktree doesn't exist",
    "With --fzf, you can interactively select the worktree",
  ],
};
