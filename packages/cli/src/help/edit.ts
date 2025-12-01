import type { CommandHelp } from "../help.ts";

export const editHelp: CommandHelp = {
  name: "edit",
  description: "Open a worktree in your configured editor",
  usage: "phantom edit [--visual] <worktree-name> [path]",
  options: [
    {
      name: "visual",
      type: "boolean",
      description: "Use $VISUAL instead of $EDITOR",
    },
  ],
  examples: [
    {
      description: "Open the worktree root in your default editor",
      command: "phantom edit feature-auth",
    },
    {
      description: "Edit a specific file in a worktree",
      command: "phantom edit feature-auth README.md",
    },
    {
      description: "Use the visual editor configured in $VISUAL",
      command: "phantom edit --visual feature-auth",
    },
  ],
  notes: [
    "$EDITOR must be set (or $VISUAL when using --visual)",
    "The editor launches inside the worktree so relative paths resolve there",
  ],
};
