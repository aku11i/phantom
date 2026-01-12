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
      description: "Open worktree in new tmux window",
    },
    {
      name: "--tmux-vertical, --tmux-v",
      type: "boolean",
      description: "Open worktree in vertical split pane",
    },
    {
      name: "--tmux-horizontal, --tmux-h",
      type: "boolean",
      description: "Open worktree in horizontal split pane",
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
      command: "phantom github checkout 321 --tmux",
      description: "Create a worktree and open it in a new tmux window",
    },
  ],
  notes: [
    "For same-repo PRs: Worktree name matches the PR branch (e.g., 'feature/add-logging')",
    "For fork PRs: Worktree name is '{owner}/{branch}' (e.g., 'aku11i/feature/add-logging')",
    "For Issues: Creates worktree named 'issues/{number}' with a new branch",
    "",
    "Requirements:",
    "  - GitHub CLI (gh) must be installed",
    "  - Must be authenticated with 'gh auth login'",
    "",
    "Tmux options require being inside a tmux session",
  ],
};
