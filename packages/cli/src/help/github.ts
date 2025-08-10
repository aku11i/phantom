import type { CommandHelp } from "../help.ts";

export const githubHelp: CommandHelp = {
  name: "github",
  usage: "phantom github <subcommand> [options]",
  description: "GitHub-specific commands for phantom",
  examples: [
    {
      command: "phantom github checkout 123",
      description: "Create a worktree for PR or issue #123",
    },
    {
      command: "phantom gh checkout 456",
      description: "Same as above, using the gh alias",
    },
  ],
  notes: [
    "Subcommands:",
    "  checkout    Create a worktree for a GitHub PR or issue",
    "",
    "Alias: 'gh' can be used instead of 'github'",
    "",
    "Requirements:",
    "  - GitHub CLI (gh) must be installed",
    "  - Must be authenticated with 'gh auth login'",
  ],
};

export const githubCheckoutHelp: CommandHelp = {
  name: "github checkout",
  usage: "phantom github checkout <number> [options]",
  description: "Create a worktree for a GitHub PR or issue",
  options: [
    {
      name: "--base",
      type: "string",
      description:
        "Base branch for new issue branches (issues only, default: repository HEAD)",
    },
    {
      name: "--tmux, -t",
      type: "boolean",
      description: "Open the worktree in a new tmux window",
    },
    {
      name: "--tmux-vertical, --tmux-v",
      type: "boolean",
      description: "Open the worktree in a vertical tmux pane",
    },
    {
      name: "--tmux-horizontal, --tmux-h",
      type: "boolean",
      description: "Open the worktree in a horizontal tmux pane",
    },
  ],
  examples: [
    {
      command: "phantom github checkout 123",
      description: "Create a worktree for PR #123 (checks out PR branch)",
    },
    {
      command: "phantom github checkout 456",
      description: "Create a worktree for issue #456 (creates new branch)",
    },
    {
      command: "phantom github checkout 789 --base develop",
      description: "Create a worktree for issue #789 based on develop branch",
    },
    {
      command: "phantom gh checkout 123 --tmux",
      description: "Create a worktree and open it in a new tmux window",
    },
    {
      command: "phantom gh checkout 123 --tmux-v",
      description: "Create a worktree and open it in a vertical tmux pane",
    },
    {
      command: "phantom gh checkout 123 --tmux-h",
      description: "Create a worktree and open it in a horizontal tmux pane",
    },
  ],
  notes: [
    "For PRs: Creates worktree named 'pulls/{number}' with the PR's branch",
    "For Issues: Creates worktree named 'issues/{number}' with a new branch",
    "",
    "Requirements:",
    "  - GitHub CLI (gh) must be installed",
    "  - Must be authenticated with 'gh auth login'",
  ],
};
