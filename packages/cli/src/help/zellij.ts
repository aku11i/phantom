import type { CommandHelp } from "../help.ts";

export const zellijHelp: CommandHelp = {
  name: "zellij",
  usage: "phantom zellij <subcommand>",
  description: "Manage Zellij layout templates for phantom launch",
  examples: [
    {
      command: "phantom zellij init",
      description: "Create a project layout in .zellij/default.kdl",
    },
    {
      command: "phantom zellij init --global",
      description:
        "Create a global layout in ~/.config/zellij/layouts/phantom.kdl",
    },
    {
      command: "phantom zellij list",
      description: "List available layouts (project and global)",
    },
  ],
  notes: [
    "Subcommands:",
    "  init   Create a customizable Zellij layout file",
    "  list   List available layouts",
    "",
    "Layout resolution order (highest to lowest priority):",
    "  1. --layout flag on phantom launch",
    "  2. phantom.config.json -> zellij.layout",
    "  3. .zellij/default.kdl (auto-detected)",
    "  4. ~/.config/phantom/config.json -> zellij.layout",
    "  5. ~/.config/zellij/layouts/phantom.kdl (global default)",
    "  6. Built-in default (no file needed)",
  ],
};

export const zellijInitHelp: CommandHelp = {
  name: "zellij init",
  usage: "phantom zellij init [options]",
  description: "Create a customizable Zellij layout file",
  options: [
    {
      name: "global",
      short: "g",
      type: "boolean",
      description:
        "Create in global location (~/.config/zellij/layouts/phantom.kdl)",
    },
    {
      name: "name",
      short: "n",
      type: "string",
      description:
        "Custom layout name (default: 'default' for project, 'phantom' for global)",
    },
    {
      name: "force",
      short: "f",
      type: "boolean",
      description: "Overwrite existing layout file",
    },
  ],
  examples: [
    {
      command: "phantom zellij init",
      description: "Create .zellij/default.kdl in current project",
    },
    {
      command: "phantom zellij init --global",
      description: "Create ~/.config/zellij/layouts/phantom.kdl",
    },
    {
      command: "phantom zellij init --name minimal",
      description: "Create .zellij/minimal.kdl",
    },
    {
      command: "phantom zellij init --global --name work",
      description: "Create ~/.config/zellij/layouts/work.kdl",
    },
    {
      command: "phantom zellij init --force",
      description: "Overwrite existing layout file",
    },
  ],
  notes: [
    "Project layouts are stored in .zellij/ directory",
    "Global layouts are stored in ~/.config/zellij/layouts/",
    "The generated layout includes documentation and alternative layouts as comments",
  ],
};

export const zellijListHelp: CommandHelp = {
  name: "zellij list",
  usage: "phantom zellij list",
  description: "List available Zellij layouts",
  examples: [
    {
      command: "phantom zellij list",
      description: "Show all available layouts",
    },
  ],
  notes: [
    "Shows layouts from:",
    "  - Project: .zellij/*.kdl",
    "  - Global: ~/.config/zellij/layouts/*.kdl",
    "  - Built-in: always available",
  ],
};
