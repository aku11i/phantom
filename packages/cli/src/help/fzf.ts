import type { CommandHelp } from "../help.ts";

export const fzfHelp: CommandHelp = {
  name: "fzf",
  usage: "phantom fzf [options]",
  description:
    "Interactive interface for managing worktrees with keyboard shortcuts",
  options: [
    {
      name: "help",
      short: "h",
      type: "boolean",
      description: "Show this help message",
    },
  ],
  examples: [
    {
      command: "phantom fzf",
      description: "Open interactive worktree selector",
    },
  ],
  notes: [
    "Keybindings:",
    "  enter    - Open shell in the worktree (default action)",
    "  ctrl-d   - Delete the worktree",
    "  ctrl-w   - Show worktree path (where)",
    "  ctrl-o   - Open worktree directory in file manager",
    "  ctrl-y   - Copy worktree path to clipboard",
    "  alt-?    - Toggle help/keybindings",
    "",
    "Navigation:",
    "  ↑/↓      - Move selection up/down",
    "  /        - Start search",
    "  esc      - Cancel search or exit",
    "",
    "Platform-specific commands:",
    "  - Clipboard: pbcopy (macOS), xclip (Linux), clip (Windows)",
    "  - File manager: open (macOS), xdg-open (Linux), explorer (Windows)",
  ],
};
