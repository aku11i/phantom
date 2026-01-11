import type { CommandHelp } from "../help.ts";

export const listHelp: CommandHelp = {
  name: "list",
  description: "List all Git worktrees",
  usage: "phantom list [options]",
  options: [
    {
      name: "--fzf",
      type: "boolean",
      description: "Use fzf for interactive selection",
    },
    {
      name: "--no-default",
      type: "boolean",
      description: "Exclude the default worktree from the list",
    },
    {
      name: "--names",
      type: "boolean",
      description: "Output only worktree names (for scripts and completion)",
    },
  ],
  examples: [
    {
      description: "List all worktrees",
      command: "phantom list",
    },
    {
      description: "List worktrees with interactive fzf selection",
      command: "phantom list --fzf",
    },
    {
      description: "List only worktree names",
      command: "phantom list --names",
    },
    {
      description: "List only non-default worktrees",
      command: "phantom list --no-default",
    },
  ],
  notes: [
    "Shows all worktrees with their paths and associated branches",
    "The default worktree is included unless --no-default is set",
    "The main worktree is marked as '(bare)' if using a bare repository",
    "With --fzf, outputs only the selected worktree name",
    "Use --names for shell completion scripts and automation",
  ],
};
