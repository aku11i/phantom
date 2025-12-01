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
  ],
  notes: [
    "Subcommands:",
    "  get <key>    Show a preference value",
    "",
    "Preferences are saved in git config with the 'phantom.' prefix (global scope).",
  ],
};

export const preferencesGetHelp: CommandHelp = {
  name: "preferences get",
  usage: "phantom preferences get <key>",
  description: "Show a preference value (reads git config --global phantom.<key>)",
  examples: [
    {
      command: "phantom preferences get editor",
      description: "Show the editor preference",
    },
  ],
  notes: ["Supported keys: editor"],
};
