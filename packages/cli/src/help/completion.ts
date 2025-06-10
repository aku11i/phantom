import type { CommandHelp } from "../help.ts";

export const completionHelp: CommandHelp = {
  name: "completion",
  usage: "phantom completion <shell>",
  description: "Generate shell completion scripts for fish, zsh, or bash",
  examples: [
    {
      command:
        "phantom completion fish > ~/.config/fish/completions/phantom.fish",
      description: "Generate and install Fish completion",
    },
    {
      command: "phantom completion fish | source",
      description: "Load Fish completion in current session",
    },
    {
      command: "phantom completion zsh > ~/.zsh/completions/_phantom",
      description: "Generate and install Zsh completion",
    },
    {
      command: 'eval "$(phantom completion zsh)"',
      description: "Load Zsh completion in current session",
    },
    {
      command: "phantom completion bash > ~/.bash_completion.d/phantom",
      description: "Generate and install Bash completion",
    },
    {
      command: 'eval "$(phantom completion bash)"',
      description: "Load Bash completion in current session",
    },
  ],
  notes: [
    "Supported shells: fish, zsh, bash",
    "After installing completions, you may need to restart your shell or source the completion file",
    "For Fish: completions are loaded automatically from ~/.config/fish/completions/",
    "For Zsh: ensure the completion file is in a directory in your $fpath",
    "For Bash: ensure bash-completion is installed and source the completion file",
  ],
};
