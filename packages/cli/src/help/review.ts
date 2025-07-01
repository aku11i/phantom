import type { CommandHelp } from "../help.ts";

export const reviewHelp: CommandHelp = {
  name: "review",
  description: "Review changes in a worktree with a local PR review interface",
  usage: "phantom review [options] <worktree-name>",
  options: [
    {
      name: "--fzf",
      type: "boolean",
      description: "Use fzf for interactive worktree selection",
    },
    {
      name: "--base",
      type: "string",
      description:
        "Base reference for comparison (default: origin/<defaultBranch>)",
    },
  ],
  examples: [
    {
      description: "Review changes against default branch",
      command: "phantom review feature-auth",
    },
    {
      description: "Review changes against specific remote branch",
      command: "phantom review feature-auth --base origin/develop",
    },
    {
      description: "Review changes against local branch",
      command: "phantom review feature-auth --base main",
    },
    {
      description: "Interactive worktree selection",
      command: "phantom review --fzf",
    },
    {
      description: "Interactive selection with custom base",
      command: "phantom review --fzf --base origin/staging",
    },
  ],
  notes: [
    "Uses reviewit to provide a GitHub-like PR review interface locally",
    "Default base is origin/<defaultBranch> where defaultBranch is from config or 'main'",
    "The --base value is passed directly to reviewit as the comparison reference",
    "powered by yoshiko-pg/reviewit (https://github.com/yoshiko-pg/reviewit)",
  ],
};
