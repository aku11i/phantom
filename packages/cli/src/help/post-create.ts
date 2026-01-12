import type { CommandHelp } from "../help.ts";

export const postCreateHelp: CommandHelp = {
  name: "post-create",
  description:
    "Re-run postCreate file copies and commands for an existing worktree",
  usage: "phantom post-create <worktree-name> [options]",
  options: [
    {
      name: "current",
      type: "boolean",
      description: "Run post-create actions for the current worktree",
    },
    {
      name: "fzf",
      type: "boolean",
      description: "Select a worktree interactively with fzf",
    },
  ],
  examples: [
    {
      description: "Re-run post-create actions for a worktree",
      command: "phantom post-create feature-auth",
    },
    {
      description: "Re-run post-create actions for the current worktree",
      command: "phantom post-create --current",
    },
    {
      description: "Pick a worktree interactively",
      command: "phantom post-create --fzf",
    },
  ],
  notes: [
    "Runs phantom.config.json postCreate.copyFiles and postCreate.commands",
  ],
};
