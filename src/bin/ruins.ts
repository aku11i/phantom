#!/usr/bin/env node

import { argv, exit } from "node:process";
import { ruinsCreateHandler } from "../ruins/commands/create.ts";
import { ruinsDeleteHandler } from "../ruins/commands/delete.ts";
import { ruinsListHandler } from "../ruins/commands/list.ts";
import { ruinsWhereHandler } from "../ruins/commands/where.ts";

interface Command {
  name: string;
  description: string;
  handler?: (args: string[]) => void | Promise<void>;
}

const commands: Command[] = [
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
];

function printHelp() {
  console.log("Usage: ruins <command> [options]\n");
  console.log("Commands:");
  for (const cmd of commands) {
    console.log(`  ${cmd.name.padEnd(20)} ${cmd.description}`);
  }
  console.log("\nThis is an alias for 'phantom ruins' commands.");
}

function findCommand(cmdName: string, commands: Command[]): Command | null {
  return commands.find((cmd) => cmd.name === cmdName) || null;
}

const args = argv.slice(2);

if (args.length === 0 || args[0] === "-h" || args[0] === "--help") {
  printHelp();
  exit(0);
}

const command = findCommand(args[0], commands);

if (!command || !command.handler) {
  console.error(`Error: Unknown command '${args[0]}'\n`);
  printHelp();
  exit(1);
}

try {
  await command.handler(args.slice(1));
} catch (error) {
  console.error(
    "Error:",
    error instanceof Error ? error.message : String(error),
  );
  exit(1);
}
