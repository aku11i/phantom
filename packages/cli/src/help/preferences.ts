import type { CommandHelp } from "../help.ts";

export const preferencesHelp: CommandHelp = {
  name: "preferences",
  usage: "phantom preferences <subcommand>",
  description:
    "Manage phantom user preferences stored in git config (global or local)",
  examples: [
    {
      command: "phantom preferences get editor",
      description: "Show the configured editor preference (global)",
    },
    {
      command: "phantom preferences set editor code",
      description:
        "Set the editor preference (stored as phantom.editor in git config --global)",
    },
    {
      command: "phantom preferences set --local editor vim",
      description:
        "Set the editor preference for the current repository only (git config --local)",
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
        "Store a custom worktreesDirectory (relative to the Git repository root) for all commands",
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
    "Options:",
    "  --local  Target the repository-local git config instead of global",
    "",
    "Preferences are saved in git config with the 'phantom.' prefix.",
    "By default, preferences use global scope. Pass --local to use per-repository scope.",
    "Local preferences take precedence over global ones at runtime.",
    "Supported keys:",
    "  editor - used by 'phantom edit', preferred over $EDITOR",
    "  ai - used by 'phantom ai'",
    "  worktreesDirectory - path relative to the Git repo root for storing worktrees (defaults to .git/phantom/worktrees)",
  ],
};

export const preferencesGetHelp: CommandHelp = {
  name: "preferences get",
  usage: "phantom preferences get [--local] <key>",
  description: "Show a preference value (reads git config phantom.<key>)",
  options: [
    {
      name: "local",
      type: "boolean",
      description: "Read from repository-local git config instead of global",
    },
  ],
  examples: [
    {
      command: "phantom preferences get editor",
      description: "Show the editor preference (global)",
    },
    {
      command: "phantom preferences get --local editor",
      description: "Show the editor preference (local to this repository)",
    },
    {
      command: "phantom preferences get ai",
      description: "Show the AI assistant preference",
    },
    {
      command: "phantom preferences get worktreesDirectory",
      description:
        "Show the preferred worktrees directory (relative to repo root)",
    },
  ],
  notes: ["Supported keys: editor, ai, worktreesDirectory"],
};

export const preferencesSetHelp: CommandHelp = {
  name: "preferences set",
  usage: "phantom preferences set [--local] <key> <value>",
  description: "Set a preference value (writes git config phantom.<key>)",
  options: [
    {
      name: "local",
      type: "boolean",
      description: "Write to repository-local git config instead of global",
    },
  ],
  examples: [
    {
      command: "phantom preferences set editor code",
      description: "Set VS Code as the editor (global)",
    },
    {
      command: "phantom preferences set --local editor vim",
      description: "Set vim as the editor for this repository only",
    },
    {
      command: "phantom preferences set ai claude",
      description: "Configure the AI assistant command",
    },
    {
      command:
        "phantom preferences set worktreesDirectory ../phantom-worktrees",
      description:
        "Store worktrees in ../phantom-worktrees relative to the Git repository root",
    },
  ],
  notes: [
    "Supported keys: editor, ai, worktreesDirectory",
    "For worktreesDirectory, provide a path relative to the Git repository root; defaults to .git/phantom/worktrees when unset",
  ],
};

export const preferencesRemoveHelp: CommandHelp = {
  name: "preferences remove",
  usage: "phantom preferences remove [--local] <key>",
  description: "Remove a preference value (git config --unset phantom.<key>)",
  options: [
    {
      name: "local",
      type: "boolean",
      description: "Remove from repository-local git config instead of global",
    },
  ],
  examples: [
    {
      command: "phantom preferences remove editor",
      description: "Unset the editor preference (global)",
    },
    {
      command: "phantom preferences remove --local editor",
      description: "Unset the editor preference (local to this repository)",
    },
    {
      command: "phantom preferences remove ai",
      description: "Unset the AI assistant preference",
    },
    {
      command: "phantom preferences remove worktreesDirectory",
      description: "Unset the custom worktrees directory preference",
    },
  ],
  notes: ["Supported keys: editor, ai, worktreesDirectory"],
};
