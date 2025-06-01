# phantom

A CLI tool for managing Git worktrees (called "ruins") with enhanced functionality.

## Overview

`phantom` provides an intuitive interface for creating and managing Git worktrees. It treats worktrees as isolated development environments called "ruins" where you can work on different features or experiments without affecting your main repository.

## Installation

### Prerequisites

- Node.js 20 or later
- Git

### Install from npm

```bash
npm install --global @aku11i/phantom
```

### Build from source

```bash
# Clone the repository
git clone https://github.com/aku11i/phantom.git
cd phantom

# Install dependencies
pnpm install

# Run the CLI
pnpm start <command>
```

## Usage

### Ruins Management

Ruins are Git worktrees managed by phantom. Each ruin is an isolated workspace for a specific branch or feature.

```bash
# Create a new ruin
phantom ruins create <name>

# List all ruins with their status
phantom ruins list

# Get the path of a specific ruin
phantom ruins where <name>

# Delete a ruin
phantom ruins delete <name>
# Use --force to delete ruins with uncommitted changes
phantom ruins delete <name> --force
```

### Working with Ruins

```bash
# Execute a command in a ruin directory
phantom exec <ruin-name> <command> [args...]
# Example: phantom exec my-feature npm test

# Open an interactive shell in a ruin
phantom shell <ruin-name>
# This changes your working directory to the ruin and starts a new shell session
```

### Navigation Tips

You can use the `where` command with shell substitution to quickly navigate to a ruin:

```bash
# Change directory to a ruin
cd $(phantom ruins where <name>)
```

## Environment Variables

When using `phantom shell` or `phantom exec`, the following environment variables are set:

- `PHANTOM_RUIN` - The name of the current ruin
- `PHANTOM_RUIN_PATH` - The absolute path to the ruin directory

You can use these in your shell configuration to customize your prompt:

```bash
# Example for .bashrc or .zshrc
if [ -n "$PHANTOM_RUIN" ]; then
    PS1="[ruin:$PHANTOM_RUIN] $PS1"
fi
```

## Development

### Setup

```bash
# Install dependencies
pnpm install

# Run tests
pnpm test

# Run linting and type checking
pnpm fix
pnpm type-check

# Run all checks (lint, type-check, and test)
pnpm ready
```

### Project Structure

- `src/bin.ts` - CLI entry point
- `src/ruins/` - Ruins management commands
- `src/commands/` - Top-level commands (exec, shell)
- `src/git/` - Git utility functions

## Contributing

Contributions are welcome! Please ensure all tests pass and follow the existing code style.

## License

TBD
