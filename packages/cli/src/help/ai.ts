import type { CommandHelp } from "../help.ts";

export const aiHelp: CommandHelp = {
  name: "ai",
  description: "Launch your configured AI coding assistant in a worktree",
  usage: "phantom ai <worktree-name> [options]",
  options: [
    {
      name: "--tmux, -t",
      type: "boolean",
      description: "Open in a new tmux window",
    },
    {
      name: "--tmux-vertical, --tmux-v",
      type: "boolean",
      description: "Open in a vertical tmux pane",
    },
    {
      name: "--tmux-horizontal, --tmux-h",
      type: "boolean",
      description: "Open in a horizontal tmux pane",
    },
    {
      name: "--zellij, -z",
      type: "boolean",
      description: "Open in a new Zellij tab or launch a new Zellij session",
    },
    {
      name: "--zellij-vertical, --zellij-v",
      type: "boolean",
      description: "Open in a vertical Zellij pane",
    },
    {
      name: "--zellij-horizontal, --zellij-h",
      type: "boolean",
      description: "Open in a horizontal Zellij pane",
    },
  ],
  examples: [
    {
      description: "Start the AI assistant in a worktree",
      command: "phantom ai feature-auth",
    },
    {
      description: "Launch AI in a new Zellij session with layout",
      command: "phantom ai feature-auth --zellij",
    },
    {
      description: "Open AI in a new tmux window",
      command: "phantom ai feature-auth --tmux",
    },
  ],
  notes: [
    "Configure the assistant first with 'phantom preferences set ai <command>' (stored as phantom.ai in git config --global, e.g., 'claude' or 'codex --full-auto').",
    "The assistant runs inside the worktree so it can access project files and context.",
    "When using --zellij outside of Zellij, launches a new session with the AI agent and shells.",
    "When using --zellij inside Zellij, opens the AI in a new tab or pane.",
  ],
};
