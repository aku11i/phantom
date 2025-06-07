import type { CommandHelp } from "../help.ts";

export const deleteHelp: CommandHelp = {
  name: "delete",
  description: "Delete a Git worktree (phantom)",
  usage: "phantom delete <name> [options]",
  options: [
    {
      name: "force",
      short: "f",
      type: "boolean",
      description:
        "Force deletion even if the worktree has uncommitted or unpushed changes",
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
  ],
  notes: [
    "By default, deletion will fail if the worktree has uncommitted changes",
    "The associated branch will also be deleted if it's not checked out elsewhere",
  ],
};
