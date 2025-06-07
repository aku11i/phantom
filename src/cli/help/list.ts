import type { CommandHelp } from "../help.ts";

export const listHelp: CommandHelp = {
  name: "list",
  description: "List all Git worktrees (phantoms)",
  usage: "phantom list",
  examples: [
    {
      description: "List all worktrees",
      command: "phantom list",
    },
  ],
  notes: [
    "Shows all worktrees with their paths and associated branches",
    "The main worktree is marked as '(bare)' if using a bare repository",
  ],
};
