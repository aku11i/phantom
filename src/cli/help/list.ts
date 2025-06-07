import type { CommandHelp } from "../help.ts";

export const listHelp: CommandHelp = {
  name: "list",
  description: "List all Git worktrees (phantoms)",
  usage: "phantom list [options]",
  options: [
    {
      name: "--fzf",
      type: "boolean",
      description: "Use fzf for interactive selection",
    },
    {
      name: "--format",
      description: "Output format (default, simple, names, json)",
      type: "string",
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
      command: "phantom list --format=names",
    },
    {
      description: "Output as JSON",
      command: "phantom list --format=json",
    },
  ],
  notes: [
    "Shows all worktrees with their paths and associated branches",
    "The main worktree is marked as '(bare)' if using a bare repository",
    "With --fzf, outputs only the selected worktree name",
    "Use --format=names for shell completion scripts",
  ],
};
