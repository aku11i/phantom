import type { CommandHelp } from "../help.ts";

export const deleteHelp: CommandHelp = {
  name: "delete",
  description: "Delete a Git worktree",
  usage: "phantom delete <name> [options]",
  options: [
    {
      name: "force",
      short: "f",
      type: "boolean",
      description:
        "Force deletion even if the worktree has uncommitted or unpushed changes",
    },
    {
      name: "--current",
      type: "boolean",
      description: "Delete the current worktree",
    },
    {
      name: "--fzf",
      type: "boolean",
      description: "Use fzf for interactive selection",
    },
  ],
  examples: [
    {
      description: "Delete a worktree",
      command: "phantom delete feature-auth",
    },
    {
      description: "Force delete a worktree with uncommitted changes",
      command: "phantom delete experimental --force",
    },
    {
      description: "Delete the current worktree",
      command: "phantom delete --current",
    },
    {
      description: "Delete a worktree with interactive fzf selection",
      command: "phantom delete --fzf",
    },
  ],
  notes: [
    "By default, deletion will fail if the worktree has uncommitted changes",
    "The associated branch will also be deleted if it's not checked out elsewhere",
    "With --fzf, you can interactively select the worktree to delete",
  ],
};
