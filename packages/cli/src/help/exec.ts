import type { CommandHelp } from "../help.ts";

export const execHelp: CommandHelp = {
  name: "exec",
  description: "Execute a command in a worktree directory",
  usage: "phantom exec [options] <worktree-name> <command> [args...]",
  options: [
    {
      name: "--fzf",
      type: "boolean",
      description: "Use fzf for interactive worktree selection",
    },
    {
      name: "--tmux, -t",
      type: "boolean",
      description: "Execute command in new tmux window",
    },
    {
      name: "--tmux-vertical, --tmux-v",
      type: "boolean",
      description: "Execute command in vertical split pane",
    },
    {
      name: "--tmux-horizontal, --tmux-h",
      type: "boolean",
      description: "Execute command in horizontal split pane",
    },
    {
      name: "--zellij, -z",
      type: "boolean",
      description:
        "Execute command in new Zellij tab (inside Zellij) or launch a new Zellij session (outside Zellij)",
    },
    {
      name: "--zellij-vertical, --zellij-v",
      type: "boolean",
      description:
        "Execute command in vertical Zellij pane (requires being inside Zellij)",
    },
    {
      name: "--zellij-horizontal, --zellij-h",
      type: "boolean",
      description:
        "Execute command in horizontal Zellij pane (requires being inside Zellij)",
    },
  ],
  examples: [
    {
      description: "Run npm test in a worktree",
      command: "phantom exec feature-auth npm test",
    },
    {
      description: "Check git status in a worktree",
      command: "phantom exec bugfix-123 git status",
    },
    {
      description: "Run a complex command with arguments",
      command: "phantom exec staging npm run build -- --production",
    },
    {
      description: "Execute with interactive selection",
      command: "phantom exec --fzf npm run dev",
    },
    {
      description: "Run dev server in new tmux window",
      command: "phantom exec --tmux feature-auth npm run dev",
    },
    {
      description: "Run tests in vertical split pane",
      command: "phantom exec --tmux-v feature-auth npm test",
    },
    {
      description: "Interactive selection with tmux",
      command: "phantom exec --fzf --tmux npm run dev",
    },
    {
      description: "Run dev server in new Zellij tab",
      command: "phantom exec --zellij feature-auth npm run dev",
    },
    {
      description: "Run tests in vertical Zellij pane",
      command: "phantom exec --zellij-v feature-auth npm test",
    },
  ],
  notes: [
    "The command is executed with the worktree directory as the working directory",
    "All arguments after the worktree name are passed to the command",
    "The exit code of the executed command is preserved",
    "With --fzf, select the worktree interactively before executing the command",
    "Tmux options require being inside a tmux session",
    "The --zellij option can launch a new Zellij session when run outside Zellij",
    "The --zellij-vertical and --zellij-horizontal options require being inside Zellij",
  ],
};
