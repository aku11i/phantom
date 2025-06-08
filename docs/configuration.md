# Phantom Configuration

## Table of Contents

- [Configuration File](#configuration-file)
- [Configuration Options](#configuration-options)
  - [postCreate.copyFiles](#postcreatecopyfiles)
  - [postCreate.commands](#postcreatecommands)
- [Complete Example](#complete-example)
- [Command Line Override](#command-line-override)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)
  - [Commands Failing](#commands-failing)
  - [Files Not Copying](#files-not-copying)
- [Related Documentation](#related-documentation)

Phantom supports configuration through a `phantom.config.json` file in your repository root. This allows you to define files to be automatically copied and commands to be executed when creating new worktrees.

## Configuration File

Create a `phantom.config.json` file in your repository root:

```json
{
  "postCreate": {
    "copyFiles": [
      ".env",
      ".env.local",
      "config/local.json"
    ],
    "commands": [
      "pnpm install",
      "pnpm build"
    ]
  }
}
```

## Configuration Options

### postCreate.copyFiles

An array of file paths to automatically copy from the current worktree to newly created worktrees.

**Use Cases:**
- Environment configuration files (`.env`, `.env.local`)
- Local development settings
- Secret files that are gitignored
- Database configuration files
- API keys and certificates

**Example:**
```json
{
  "postCreate": {
    "copyFiles": [
      ".env",
      ".env.local",
      "config/database.local.yml",
      "certs/dev.pem",
      "certs/dev-key.pem"
    ]
  }
}
```

**Notes:**
- Paths are relative to the repository root
- Currently, glob patterns are not supported
- Files must exist in the source worktree
- Non-existent files are silently skipped
- Can be overridden with `--copy-file` command line options

### postCreate.commands

An array of commands to execute after creating a new worktree.

**Use Cases:**
- Installing dependencies
- Building the project
- Setting up the development environment
- Running database migrations
- Generating configuration files

**Example:**
```json
{
  "postCreate": {
    "commands": [
      "pnpm install",
      "pnpm db:migrate",
      "pnpm db:seed",
      "cp .env.example .env",
      "pnpm build"
    ]
  }
}
```

**Notes:**
- Commands are executed in order
- Execution stops on the first failed command
- Commands run in the new worktree's directory
- Output is displayed in real-time

## Complete Example

Here's a comprehensive example for a full-stack application:

```json
{
  "postCreate": {
    "copyFiles": [
      ".env",
      ".env.local",
      "config/local.json",
      "docker-compose.override.yml",
      "certs/localhost.pem",
      "certs/localhost-key.pem"
    ],
    "commands": [
      "pnpm install",
      "docker-compose up -d postgres redis",
      "pnpm db:migrate",
      "pnpm db:seed:dev",
      "pnpm generate:types",
      "pnpm build"
    ]
  }
}
```

## Command Line Override

You can combine configuration file settings with command line options:

```bash
# Uses config file + additional files
phantom create feature --copy-file "extra-file.json"

# Config file's copyFiles + command line files are merged
```

## Best Practices

1. **Keep it Simple**: Only include essential setup commands
2. **Fast Commands**: Avoid long-running commands that might timeout
3. **Idempotent**: Commands should be safe to run multiple times
4. **Error Handling**: Consider commands that might fail gracefully
5. **Documentation**: Document your configuration in your project's README

## Troubleshooting

### Commands Failing

If post-create commands are failing:

1. Run commands manually to debug:
   ```bash
   phantom exec <worktree-name> <command>
   ```

2. Check command dependencies are available
3. Ensure commands work in a fresh environment
4. Consider adding error handling:
   ```json
   {
     "postCreate": {
       "commands": [
         "pnpm install || npm install",
         "test -f .env || cp .env.example .env"
       ]
     }
   }
   ```

### Files Not Copying

If files aren't being copied:

1. Verify file paths are correct
2. Check files exist in source worktree
3. Ensure you have read permissions
4. Use `--copy-file` flag to test individual files:
   ```bash
   phantom create test --copy-file ".env"
   ```

## Related Documentation

- [Getting Started](getting-started.md) - Quick guide to get up and running with Phantom
- [Commands Reference](commands.md) - Detailed documentation of all Phantom commands
- [Integrations](integrations.md) - Integration guides for tmux, fzf, and shell completion