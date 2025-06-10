import type { CommandHelp } from "../help.ts";

export const createHelp: CommandHelp = {
  name: "create",
  description: "Create a new Git worktree",
  usage: "phantom create <name> [options]",
  options: [
    {
      name: "shell",
      short: "s",
      type: "boolean",
      description:
        "Open an interactive shell in the new worktree after creation",
    },
    {
      name: "exec",
      short: "x",
      type: "string",
      description: "Execute a command in the new worktree after creation",
      example: "--exec 'npm install'",
    },
    {
      name: "tmux",
      short: "t",
      type: "boolean",
      description:
        "Open the worktree in a new tmux window (requires being inside tmux)",
    },
    {
      name: "tmux-vertical",
      type: "boolean",
      description:
        "Open the worktree in a vertical tmux pane (requires being inside tmux)",
    },
    {
      name: "tmux-horizontal",
      type: "boolean",
      description:
        "Open the worktree in a horizontal tmux pane (requires being inside tmux)",
    },
    {
      name: "copy-file",
      type: "string",
      multiple: true,
      description:
        "Copy specified files from the current worktree to the new one. Can be used multiple times",
      example: "--copy-file .env --copy-file config.local.json",
    },
    {
      name: "base",
      type: "string",
      description:
        "Branch or commit to create the new worktree from (defaults to HEAD)",
      example: "--base main, --base origin/feature, --base abc123",
    },
  ],
  examples: [
    {
      description: "Create a new worktree named 'feature-auth'",
      command: "phantom create feature-auth",
    },
    {
      description: "Create a worktree and open a shell in it",
      command: "phantom create bugfix-123 --shell",
    },
    {
      description: "Create a worktree and run npm install",
      command: "phantom create new-feature --exec 'npm install'",
    },
    {
      description: "Create a worktree in a new tmux window",
      command: "phantom create experiment --tmux",
    },
    {
      description: "Create a worktree and copy environment files",
      command:
        "phantom create staging --copy-file .env --copy-file database.yml",
    },
    {
      description: "Create a worktree from main branch",
      command: "phantom create feature-new --base main",
    },
    {
      description: "Create a worktree from remote branch",
      command: "phantom create hotfix --base origin/production",
    },
  ],
  notes: [
    "The worktree name will be used as the branch name",
    "Only one of --shell, --exec, or --tmux options can be used at a time",
    "File copying can also be configured in phantom.config.json",
  ],
};
