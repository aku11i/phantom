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
  ],
  notes: [
    "Uses your default shell from the SHELL environment variable",
    "The shell starts with the worktree directory as the working directory",
    "Type 'exit' to return to your original directory",
    "With --fzf, you can interactively select the worktree to enter",
    "Tmux options require being inside a tmux session",
  ],
};
