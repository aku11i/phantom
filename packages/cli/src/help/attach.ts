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
  ],
  notes: [
    "The branch must already exist locally",
    "To work with remote branches, first checkout the branch with git",
    "Only one of --shell or --exec options can be used at a time",
  ],
};
