import type { CommandHelp } from "../help.ts";

export const editHelp: CommandHelp = {
  name: "edit",
  description: "Open a worktree in your configured editor",
  usage: "phantom edit <worktree-name> [path]",
  examples: [
    {
      description: "Open the worktree root in your configured editor",
      command: "phantom edit feature-auth",
    },
    {
      description: "Edit a specific file in a worktree",
      command: "phantom edit feature-auth README.md",
    },
  ],
  notes: [
    "Uses the phantom.editor preference when set (`phantom preferences set editor <command>`), falling back to $EDITOR",
    "The editor launches inside the worktree so relative paths resolve there",
  ],
};
