#!/usr/bin/env node

import { argv, exit } from "node:process";
import { ruinsCreateHandler } from "./ruins/commands/create.ts";

interface Command {
  name: string;
  description: string;
  subcommands?: Command[];
  handler?: (args: string[]) => void;
}

const commands: Command[] = [
  {
    name: "ruins",
    description: "Manage git worktrees (ruins)",
    subcommands: [
      {
        name: "create",
        description: "Create a new worktree (ruin)",
        handler: ruinsCreateHandler,
      },
      {
        name: "list",
        description: "List all ruins",
        handler: () => {
          console.log("Listing ruins...");
        },
      },
      {
        name: "switch",
        description: "Switch to a specific ruin",
        handler: (args) => {
          const name = args[0];
          if (!name) {
            console.error("Error: ruin name required");
            exit(1);
          }
          console.log(`Switching to ruin: ${name}`);
        },
      },
      {
        name: "delete",
        description: "Delete a ruin",
        handler: (args) => {
          const name = args[0];
          if (!name) {
            console.error("Error: ruin name required");
            exit(1);
          }
          console.log(`Deleting ruin: ${name}`);
        },
      },
    ],
  },
  {
    name: "spawn",
    description: "Spawn a phantom (run command) in a ruin",
    handler: (args) => {
      const ruinName = args[0];
      const command = args.slice(1).join(" ");
      if (!ruinName || !command) {
        console.error("Error: ruin name and command required");
        exit(1);
      }
      console.log(`Spawning phantom in ${ruinName}: ${command}`);
    },
  },
  {
    name: "kill",
    description: "Kill a phantom (stop process) in a ruin",
    handler: (args) => {
      const ruinName = args[0];
      const command = args.slice(1).join(" ");
      if (!ruinName || !command) {
        console.error("Error: ruin name and command required");
        exit(1);
      }
      console.log(`Killing phantom in ${ruinName}: ${command}`);
    },
  },
  {
    name: "list",
    description: "List running phantoms (processes)",
    handler: () => {
      console.log("Listing phantoms...");
    },
  },
];

function printHelp(commands: Command[], prefix = "") {
  console.log("Usage: phantom <command> [options]\n");
  console.log("Commands:");
  for (const cmd of commands) {
    console.log(`  ${prefix}${cmd.name.padEnd(20)} ${cmd.description}`);
    if (cmd.subcommands) {
      for (const subcmd of cmd.subcommands) {
        console.log(`    ${subcmd.name.padEnd(18)} ${subcmd.description}`);
      }
    }
  }
}

function findCommand(
  args: string[],
  commands: Command[],
): { command: Command | null; remainingArgs: string[] } {
  if (args.length === 0) {
    return { command: null, remainingArgs: [] };
  }

  const [cmdName, ...rest] = args;
  const command = commands.find((cmd) => cmd.name === cmdName);

  if (!command) {
    return { command: null, remainingArgs: args };
  }

  if (command.subcommands && rest.length > 0) {
    const { command: subcommand, remainingArgs } = findCommand(
      rest,
      command.subcommands,
    );
    if (subcommand) {
      return { command: subcommand, remainingArgs };
    }
  }

  return { command, remainingArgs: rest };
}

function main() {
  const args = argv.slice(2);

  if (args.length === 0 || args[0] === "-h" || args[0] === "--help") {
    printHelp(commands);
    exit(0);
  }

  const { command, remainingArgs } = findCommand(args, commands);

  if (!command || !command.handler) {
    console.error(`Error: Unknown command '${args.join(" ")}'\n`);
    printHelp(commands);
    exit(1);
  }

  command.handler(remainingArgs);
}

main();
