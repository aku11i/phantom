import type { CommandHelp } from "../help.ts";

export const attachHelp: CommandHelp = {
  name: "attach",
  description: "Attach to an existing branch by creating a new worktree",
  usage: "phantom attach <branch-name> [options]",
  options: [
    {
      name: "shell",
      short: "s",
      type: "boolean",
      description: "Open an interactive shell in the worktree after attaching",
    },
    {
      name: "exec",
      short: "x",
      type: "string",
      description: "Execute a command in the worktree after attaching",
      example: "--exec 'git pull'",
    },
    {
      name: "tmux",
      short: "t",
      type: "boolean",
      description: "Open the worktree in a new tmux window after attaching",
    },
    {
      name: "tmux-vertical",
      type: "boolean",
      description: "Open the worktree in a vertical tmux pane after attaching",
    },
    {
      name: "tmux-v",
      type: "boolean",
      description: "Alias for --tmux-vertical",
    },
    {
      name: "tmux-horizontal",
      type: "boolean",
      description:
        "Open the worktree in a horizontal tmux pane after attaching",
    },
    {
      name: "tmux-h",
      type: "boolean",
      description: "Alias for --tmux-horizontal",
    },
    {
      name: "zellij",
      short: "z",
      type: "boolean",
      description: "Open the worktree in a new Zellij tab after attaching",
    },
    {
      name: "zellij-vertical",
      type: "boolean",
      description:
        "Open the worktree in a vertical Zellij pane after attaching",
    },
    {
      name: "zellij-v",
      type: "boolean",
      description: "Alias for --zellij-vertical",
    },
    {
      name: "zellij-horizontal",
      type: "boolean",
      description:
        "Open the worktree in a horizontal Zellij pane after attaching",
    },
    {
      name: "zellij-h",
      type: "boolean",
      description: "Alias for --zellij-horizontal",
    },
    {
      name: "copy-file",
      type: "string",
      multiple: true,
      description:
        "Copy specified files from the current worktree before attaching. Can be used multiple times",
      example: "--copy-file .env --copy-file .npmrc",
    },
  ],
  examples: [
    {
      description: "Attach to an existing branch",
      command: "phantom attach main",
    },
    {
      description: "Attach to a branch and open a shell",
      command: "phantom attach feature-branch --shell",
    },
    {
      description: "Attach to a branch and pull latest changes",
      command: "phantom attach develop --exec 'git pull'",
    },
    {
      description: "Attach and open the worktree in a tmux window",
      command: "phantom attach feature-branch --tmux",
    },
    {
      description: "Attach and open the worktree in a Zellij tab",
      command: "phantom attach feature-branch --zellij",
    },
    {
      description: "Attach and copy shared environment files",
      command:
        "phantom attach feature-branch --copy-file .env --copy-file .npmrc",
    },
  ],
  notes: [
    "The branch must already exist locally",
    "To work with remote branches, first checkout the branch with git",
    "Only one of --shell, --exec, --tmux, or --zellij options can be used at a time",
    "The tmux options require running phantom inside an active tmux session",
    "The zellij options require running phantom inside an active Zellij session",
  ],
};
