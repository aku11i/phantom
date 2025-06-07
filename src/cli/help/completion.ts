import type { CommandHelp } from "../help.js";

export const completionHelp: CommandHelp = {
  name: "completion",
  description: "Generate shell completion script",
  usage: "phantom completion <shell>",
  options: [
    {
      name: "--help, -h",
      type: "boolean",
      description: "Show help for this command",
    },
  ],
  examples: [
    {
      command: "phantom completion bash",
      description: "Generate bash completion script",
    },
    {
      command: "phantom completion zsh > ~/.zsh/completions/_phantom",
      description: "Save zsh completion to file",
    },
    {
      command: 'eval "$(phantom completion fish)"',
      description: "Load fish completion in current session",
    },
  ],
  notes: [
    "Supported shells: bash, zsh, fish",
    "For permanent installation, add the output to your shell configuration file",
  ],
};
