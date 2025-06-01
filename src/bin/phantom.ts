#!/usr/bin/env node

import { argv, exit } from "node:process";
import { gardensCreateHandler } from "../gardens/commands/create.ts";
import { gardensDeleteHandler } from "../gardens/commands/delete.ts";
import { gardensListHandler } from "../gardens/commands/list.ts";
import { gardensWhereHandler } from "../gardens/commands/where.ts";
import { execHandler } from "../phantom/command/exec.ts";
import { shellHandler } from "../phantom/command/shell.ts";

interface Command {
  name: string;
  description: string;
  subcommands?: Command[];
  handler?: (args: string[]) => void | Promise<void>;
}

const commands: Command[] = [
  {
    name: "garden",
    description: "Manage git worktrees (gardens)",
    subcommands: [
      {
        name: "create",
        description: "Create a new worktree (garden) [--shell to open shell]",
        handler: gardensCreateHandler,
      },
      {
        name: "list",
        description: "List all gardens",
        handler: gardensListHandler,
      },
      {
        name: "where",
        description: "Output the path of a specific garden",
        handler: gardensWhereHandler,
      },
      {
        name: "delete",
        description: "Delete a garden (use --force for dirty gardens)",
        handler: gardensDeleteHandler,
      },
    ],
  },
  {
    name: "exec",
    description: "Execute a command in a garden directory",
    handler: execHandler,
  },
  {
    name: "shell",
    description: "Open interactive shell in a garden directory",
    handler: shellHandler,
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
