#!/usr/bin/env node

import { argv, exit } from "node:process";
import { attachHandler } from "../cli/handlers/attach.ts";
import { completionHandler } from "../cli/handlers/completion.ts";
import { createHandler } from "../cli/handlers/create.ts";
import { deleteHandler } from "../cli/handlers/delete.ts";
import { execHandler } from "../cli/handlers/exec.ts";
import { listHandler } from "../cli/handlers/list.ts";
import { shellHandler } from "../cli/handlers/shell.ts";
import { versionHandler } from "../cli/handlers/version.ts";
import { whereHandler } from "../cli/handlers/where.ts";
import { type CommandHelp, helpFormatter } from "../cli/help.ts";
import { attachHelp } from "../cli/help/attach.ts";
import { completionHelp } from "../cli/help/completion.ts";
import { createHelp } from "../cli/help/create.ts";
import { deleteHelp } from "../cli/help/delete.ts";
import { execHelp } from "../cli/help/exec.ts";
import { listHelp } from "../cli/help/list.ts";
import { shellHelp } from "../cli/help/shell.ts";
import { versionHelp } from "../cli/help/version.ts";
import { whereHelp } from "../cli/help/where.ts";

interface Command {
  name: string;
  description: string;
  subcommands?: Command[];
  handler?: (args: string[]) => void | Promise<void>;
  help?: CommandHelp;
}

const commands: Command[] = [
  {
    name: "create",
    description: "Create a new Git worktree (phantom)",
    handler: createHandler,
    help: createHelp,
  },
  {
    name: "attach",
    description: "Attach to an existing branch by creating a new worktree",
    handler: attachHandler,
    help: attachHelp,
  },
  {
    name: "list",
    description: "List all Git worktrees (phantoms)",
    handler: listHandler,
    help: listHelp,
  },
  {
    name: "where",
    description: "Output the filesystem path of a specific worktree",
    handler: whereHandler,
    help: whereHelp,
  },
  {
    name: "delete",
    description: "Delete a Git worktree (phantom)",
    handler: deleteHandler,
    help: deleteHelp,
  },
  {
    name: "exec",
    description: "Execute a command in a worktree directory",
    handler: execHandler,
    help: execHelp,
  },
  {
    name: "shell",
    description: "Open an interactive shell in a worktree directory",
    handler: shellHandler,
    help: shellHelp,
  },
  {
    name: "version",
    description: "Display phantom version information",
    handler: versionHandler,
    help: versionHelp,
  },
  {
    name: "completion",
    description: "Generate shell completion scripts",
    handler: completionHandler,
    help: completionHelp,
  },
];

function printHelp(commands: Command[]) {
  const simpleCommands = commands.map((cmd) => ({
    name: cmd.name,
    description: cmd.description,
  }));
  console.log(helpFormatter.formatMainHelp(simpleCommands));
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

// Check if user is requesting help for a specific command
if (remainingArgs.includes("--help") || remainingArgs.includes("-h")) {
  if (command.help) {
    console.log(helpFormatter.formatCommandHelp(command.help));
  } else {
    console.log(`Help not available for command '${command.name}'`);
  }
  exit(0);
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
