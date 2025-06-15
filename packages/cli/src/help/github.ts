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
        "Base branch for new issue branches (default: repository HEAD)",
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
  ],
  notes: [
    "For PRs: Creates worktree named 'pr-{number}' with the PR's branch",
    "For Issues: Creates worktree named 'issue-{number}' with a new branch",
    "",
    "Requirements:",
    "  - GitHub CLI (gh) must be installed",
    "  - Must be authenticated with 'gh auth login'",
  ],
};
