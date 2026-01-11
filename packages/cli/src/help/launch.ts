import type { CommandHelp } from "../help.ts";

export const launchHelp: CommandHelp = {
  name: "launch",
  description: "Create a worktree and launch a Zellij session with Claude",
  usage: "phantom launch <name> [options]",
  options: [
    {
      name: "layout",
      short: "l",
      type: "string",
      description: "Path to a custom Zellij layout file (.kdl)",
      example: "--layout ./my-layout.kdl",
    },
    {
      name: "base",
      type: "string",
      description:
        "Branch or commit to create the worktree from (defaults to HEAD)",
      example: "--base main",
    },
    {
      name: "no-claude",
      type: "boolean",
      description: "Don't start Claude in the session (shell only)",
    },
    {
      name: "copy-file",
      type: "string",
      multiple: true,
      description:
        "Copy specified files from the current worktree to the new one. Can be used multiple times",
      example: "--copy-file .env",
    },
  ],
  examples: [
    {
      description: "Launch a new worktree with Claude in Zellij",
      command: "phantom launch feature-auth",
    },
    {
      description: "Launch with a custom layout",
      command: "phantom launch bugfix-123 --layout ./dev.kdl",
    },
    {
      description: "Launch from main branch",
      command: "phantom launch feature-new --base main",
    },
    {
      description: "Launch without Claude (shell only)",
      command: "phantom launch experiment --no-claude",
    },
    {
      description: "Launch an existing worktree in Zellij",
      command: "phantom launch existing-branch",
    },
  ],
  notes: [
    "Creates a new Zellij session (works outside Zellij too)",
    "Automatically creates the worktree if it doesn't exist",
    "If a branch with that name exists, attaches to it instead",
    "Default layout: shell on top, Claude on bottom (Claude focused)",
    "Configure Claude command in phantom.config.json under 'zellij.claude'",
    "Custom layouts can be specified in config: 'zellij.layout'",
  ],
};
