#!/usr/bin/env node

import { argv, exit } from "node:process";
import { execHandler } from "../phantom/command/exec.ts";
import { shellHandler } from "../phantom/command/shell.ts";
import { versionHandler } from "../phantom/command/version.ts";
import { phantomsCreateHandler } from "../phantoms/commands/create.ts";
import { phantomsDeleteHandler } from "../phantoms/commands/delete.ts";
import { phantomsListHandler } from "../phantoms/commands/list.ts";
import { phantomsWhereHandler } from "../phantoms/commands/where.ts";

interface Command {
  name: string;
  description: string;
  subcommands?: Command[];
  handler?: (args: string[]) => void | Promise<void>;
}

const commands: Command[] = [
  {
    name: "create",
    description: "Create a new worktree [--shell to open shell]",
    handler: phantomsCreateHandler,
  },
  {
    name: "list",
    description: "List all worktrees",
    handler: phantomsListHandler,
  },
  {
    name: "where",
    description: "Output the path of a specific worktree",
    handler: phantomsWhereHandler,
  },
  {
    name: "delete",
    description: "Delete a worktree (use --force for uncommitted changes)",
    handler: phantomsDeleteHandler,
  },
  {
    name: "exec",
    description: "Execute a command in a worktree directory",
    handler: execHandler,
  },
  {
    name: "shell",
    description: "Open interactive shell in a worktree directory",
    handler: shellHandler,
  },
  {
    name: "version",
    description: "Display phantom version",
    handler: versionHandler,
  },
];

function printHelp(commands: Command[]) {
  console.log("Usage: phantom <command> [options]\n");
  console.log("Commands:");
  for (const cmd of commands) {
    console.log(`  ${cmd.name.padEnd(12)} ${cmd.description}`);
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

if (args[0] === "--version" || args[0] === "-v") {
  versionHandler();
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
