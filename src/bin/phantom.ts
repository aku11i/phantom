#!/usr/bin/env node

import { argv, exit } from "node:process";
import { attachHandler } from "../cli/handlers/attach.ts";
import { createHandler } from "../cli/handlers/create.ts";
import { deleteHandler } from "../cli/handlers/delete.ts";
import { execHandler } from "../cli/handlers/exec.ts";
import { listHandler } from "../cli/handlers/list.ts";
import { shellHandler } from "../cli/handlers/shell.ts";
import { versionHandler } from "../cli/handlers/version.ts";
import { whereHandler } from "../cli/handlers/where.ts";

interface Command {
  name: string;
  description: string;
  subcommands?: Command[];
  handler?: (args: string[]) => void | Promise<void>;
}

const commands: Command[] = [
  {
    name: "create",
    description:
      "Create a new worktree [--shell | --exec <command> | --tmux [new|vertical|horizontal]]",
    handler: createHandler,
  },
  {
    name: "attach",
    description: "Attach to an existing branch [--shell | --exec <command>]",
    handler: attachHandler,
  },
  {
    name: "list",
    description: "List all worktrees",
    handler: listHandler,
  },
  {
    name: "where",
    description: "Output the path of a specific worktree",
    handler: whereHandler,
  },
  {
    name: "delete",
    description: "Delete a worktree (use --force for uncommitted changes)",
    handler: deleteHandler,
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
