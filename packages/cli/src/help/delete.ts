import type { CommandHelp } from "../help.ts";

export const deleteHelp: CommandHelp = {
  name: "delete",
  description: "Delete one or more Git worktrees",
  usage: "phantom delete <name...> [options]",
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
    {
      name: "--keep-branch",
      type: "boolean",
      description:
        "Keep the associated branch after deleting the worktree (overrides deleteBranch preference)",
    },
  ],
  examples: [
    {
      description: "Delete a worktree",
      command: "phantom delete feature-auth",
    },
    {
      description: "Delete multiple worktrees in one command",
      command: "phantom delete feature-auth docs-cleanup spike-login",
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
    {
      description: "Delete a worktree but keep its branch",
      command: "phantom delete feature-auth --keep-branch",
    },
  ],
  notes: [
    "By default, deletion will fail if the worktree has uncommitted changes",
    "You can pass multiple worktree names to delete them at once",
    "The associated branch will also be deleted unless --keep-branch is specified or the deleteBranch preference is set to false",
    "With --fzf, you can interactively select the worktree to delete",
  ],
};
