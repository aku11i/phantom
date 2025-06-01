#!/usr/bin/env node

import { argv, exit } from "node:process";
import { execHandler } from "./commands/exec.ts";
import { ruinsCreateHandler } from "./ruins/commands/create.ts";
import { ruinsDeleteHandler } from "./ruins/commands/delete.ts";
import { ruinsListHandler } from "./ruins/commands/list.ts";
import { ruinsWhereHandler } from "./ruins/commands/where.ts";

interface Command {
  name: string;
  description: string;
  subcommands?: Command[];
  handler?: (args: string[]) => void | Promise<void>;
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
        handler: ruinsListHandler,
      },
      {
        name: "where",
        description: "Output the path of a specific ruin",
        handler: ruinsWhereHandler,
      },
      {
        name: "delete",
        description: "Delete a ruin (use --force for dirty ruins)",
        handler: ruinsDeleteHandler,
      },
    ],
  },
  {
    name: "exec",
    description: "Execute a command in a ruin directory",
    handler: execHandler,
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

try {
  await command.handler(remainingArgs);
} catch (error) {
  console.error(
    "Error:",
    error instanceof Error ? error.message : String(error),
  );
  exit(1);
}
