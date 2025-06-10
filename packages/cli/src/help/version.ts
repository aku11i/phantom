import type { CommandHelp } from "../help.ts";

export const versionHelp: CommandHelp = {
  name: "version",
  description: "Display phantom version information",
  usage: "phantom version",
  examples: [
    {
      description: "Show version",
      command: "phantom version",
    },
  ],
  notes: ["Also accessible via 'phantom --version' or 'phantom -v'"],
};
