import type { CommandHelp } from "../help.ts";

export const aiHelp: CommandHelp = {
  name: "ai",
  description: "Launch your configured AI coding assistant in a worktree",
  usage: "phantom ai <worktree-name>",
  examples: [
    {
      description: "Start the AI assistant in a worktree",
      command: "phantom ai feature-auth",
    },
  ],
  notes: [
    "Configure the assistant first with 'phantom preferences set ai <command>' (e.g., 'claude' or 'codex --full-auto').",
    "The assistant runs inside the worktree so it can access project files and context.",
  ],
};
