import type { CommandHelp } from "../help.ts";

export const shellHelp: CommandHelp = {
  name: "shell",
  description: "Open an interactive shell in a worktree directory",
  usage: "phantom shell <worktree-name> [options]",
  options: [
    {
      name: "--fzf",
      type: "boolean",
      description: "Use fzf for interactive selection",
    },
    {
      name: "--tmux, -t",
      type: "boolean",
      description: "Open shell in new tmux window",
    },
    {
      name: "--tmux-vertical, --tmux-v",
      type: "boolean",
      description: "Open shell in vertical split pane",
    },
    {
      name: "--tmux-horizontal, --tmux-h",
      type: "boolean",
      description: "Open shell in horizontal split pane",
    },
    {
      name: "--zellij, -z",
      type: "boolean",
      description:
        "Open shell in new Zellij tab (inside Zellij) or launch a new Zellij session (outside Zellij)",
    },
    {
      name: "--zellij-vertical, --zellij-v",
      type: "boolean",
      description:
        "Open shell in vertical Zellij pane (requires being inside Zellij)",
    },
    {
      name: "--zellij-horizontal, --zellij-h",
      type: "boolean",
      description:
        "Open shell in horizontal Zellij pane (requires being inside Zellij)",
    },
  ],
  examples: [
    {
      description: "Open a shell in a worktree",
      command: "phantom shell feature-auth",
    },
    {
      description: "Open a shell with interactive fzf selection",
      command: "phantom shell --fzf",
    },
    {
      description: "Open a shell in a new tmux window",
      command: "phantom shell feature-auth --tmux",
    },
    {
      description: "Open a shell in a vertical tmux pane",
      command: "phantom shell feature-auth --tmux-v",
    },
    {
      description: "Interactive selection with tmux",
      command: "phantom shell --fzf --tmux",
    },
    {
      description: "Open a shell in a new Zellij tab",
      command: "phantom shell feature-auth --zellij",
    },
    {
      description: "Open a shell in a vertical Zellij pane",
      command: "phantom shell feature-auth --zellij-v",
    },
  ],
  notes: [
    "Uses your default shell from the SHELL environment variable",
    "The shell starts with the worktree directory as the working directory",
    "Type 'exit' to return to your original directory",
    "With --fzf, you can interactively select the worktree to enter",
    "Tmux options require being inside a tmux session",
    "The --zellij option can launch a new Zellij session when run outside Zellij",
    "The --zellij-vertical and --zellij-horizontal options require being inside Zellij",
  ],
};
