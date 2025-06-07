import type { CommandHelp } from "../help.ts";

export const execHelp: CommandHelp = {
  name: "exec",
  description: "Execute a command in a worktree directory",
  usage: "phantom exec <worktree-name> <command> [args...]",
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
  ],
  notes: [
    "The command is executed with the worktree directory as the working directory",
    "All arguments after the worktree name are passed to the command",
    "The exit code of the executed command is preserved",
  ],
};
