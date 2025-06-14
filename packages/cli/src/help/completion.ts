import type { CommandHelp } from "../help.ts";

export const completionHelp: CommandHelp = {
  name: "completion",
  usage: "phantom completion <shell>",
  description: "Generate shell completion scripts for fish, zsh, or bash",
  examples: [
    {
      command: "phantom completion fish | source",
      description: "Load Fish completion in current session",
    },
    {
      command: 'eval "$(phantom completion zsh)"',
      description: "Load Zsh completion (add to .zshrc for persistence)",
    },
    {
      command: 'eval "$(phantom completion bash)"',
      description: "Load Bash completion (add to .bashrc for persistence)",
    },
  ],
  notes: [
    "Supported shells: fish, zsh, bash",
    "For Fish: use 'source' to load in current session",
    "For Zsh: add the eval command to your .zshrc for persistence",
    "For Bash: requires bash-completion v2, add the eval command to your .bashrc for persistence",
  ],
};
