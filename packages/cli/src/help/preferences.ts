import type { CommandHelp } from "../help.ts";

export const preferencesHelp: CommandHelp = {
  name: "preferences",
  usage: "phantom preferences <subcommand>",
  description: "Manage phantom user preferences stored in git config (global)",
  examples: [
    {
      command: "phantom preferences get editor",
      description: "Show the configured editor preference",
    },
    {
      command: "phantom preferences set editor code --wait",
      description: "Set the editor preference (stored as phantom.editor in git config --global)",
    },
  ],
  notes: [
    "Subcommands:",
    "  get <key>    Show a preference value",
    "  set <key>    Set a preference value",
    "",
    "Preferences are saved in git config with the 'phantom.' prefix (global scope).",
  ],
};

export const preferencesGetHelp: CommandHelp = {
  name: "preferences get",
  usage: "phantom preferences get <key>",
  description:
    "Show a preference value (reads git config --global phantom.<key>)",
  examples: [
    {
      command: "phantom preferences get editor",
      description: "Show the editor preference",
    },
  ],
  notes: ["Supported keys: editor"],
};

export const preferencesSetHelp: CommandHelp = {
  name: "preferences set",
  usage: "phantom preferences set <key> <value>",
  description: "Set a preference value (writes git config --global phantom.<key>)",
  examples: [
    {
      command: "phantom preferences set editor code --wait",
      description: "Set VS Code (wait for close) as the editor",
    },
  ],
  notes: ["Supported keys: editor"],
};
