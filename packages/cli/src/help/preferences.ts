import type { CommandHelp } from "../help.ts";

export const preferencesHelp: CommandHelp = {
  name: "preferences",
  usage: "phantom preferences <subcommand>",
  description: "Manage phantom user preferences stored in git config (global)",
  examples: [
    {
      command: "phantom preferences get editor",
      description: "Show the configured editor preference",
    },
    {
      command: "phantom preferences set editor code",
      description:
        "Set the editor preference (stored as phantom.editor in git config --global)",
    },
    {
      command: 'phantom preferences set ai "codex --full-auto"',
      description:
        "Set the AI assistant preference (stored as phantom.ai in git config --global)",
    },
    {
      command:
        "phantom preferences set worktreesDirectory ../phantom-worktrees",
      description:
        "Set a custom worktrees directory (stored as phantom.worktreesDirectory in git config --global)",
    },
    {
      command: "phantom preferences remove editor",
      description: "Remove the editor preference (fallback to env/default)",
    },
  ],
  notes: [
    "Subcommands:",
    "  get <key>    Show a preference value",
    "  set <key>    Set a preference value",
    "  remove <key> Remove a preference value",
    "",
    "Preferences are saved in git config with the 'phantom.' prefix (global scope).",
    "Supported keys: editor (used by 'phantom edit', preferred over $EDITOR), ai (used by 'phantom ai'), and worktreesDirectory (base directory for worktrees).",
    "For worktreesDirectory, specify a path relative to the Git repository root. Default: .git/phantom/worktrees.",
  ],
};

export const preferencesGetHelp: CommandHelp = {
  name: "preferences get",
  usage: "phantom preferences get <key>",
  description:
    "Show a preference value (reads git config --global phantom.<key>)",
  examples: [
    {
      command: "phantom preferences get editor",
      description: "Show the editor preference",
    },
    {
      command: "phantom preferences get ai",
      description: "Show the AI assistant preference",
    },
    {
      command: "phantom preferences get worktreesDirectory",
      description: "Show the worktrees directory preference",
    },
  ],
  notes: ["Supported keys: editor, ai, worktreesDirectory"],
};

export const preferencesSetHelp: CommandHelp = {
  name: "preferences set",
  usage: "phantom preferences set <key> <value>",
  description:
    "Set a preference value (writes git config --global phantom.<key>)",
  examples: [
    {
      command: "phantom preferences set editor code",
      description: "Set VS Code as the editor",
    },
    {
      command: "phantom preferences set ai claude",
      description: "Configure the AI assistant command",
    },
    {
      command:
        "phantom preferences set worktreesDirectory ../phantom-worktrees",
      description: "Set a custom base directory for worktrees",
    },
  ],
  notes: [
    "Supported keys: editor, ai, worktreesDirectory",
    "worktreesDirectory should be a path relative to the repository root. Default: .git/phantom/worktrees.",
  ],
};

export const preferencesRemoveHelp: CommandHelp = {
  name: "preferences remove",
  usage: "phantom preferences remove <key>",
  description:
    "Remove a preference value (git config --global --unset phantom.<key>)",
  examples: [
    {
      command: "phantom preferences remove editor",
      description: "Unset the editor preference",
    },
    {
      command: "phantom preferences remove ai",
      description: "Unset the AI assistant preference",
    },
    {
      command: "phantom preferences remove worktreesDirectory",
      description: "Unset the worktrees directory preference",
    },
  ],
  notes: ["Supported keys: editor, ai, worktreesDirectory"],
};
