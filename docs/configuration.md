# Phantom Configuration

## Table of Contents

- [Configuration File](#configuration-file)
- [Configuration Options](#configuration-options)
  - [worktreeBaseDirectory](#worktreebasedirectory)
  - [postCreate.copyFiles](#postcreatecopyfiles)
  - [postCreate.commands](#postcreatecommands)

Phantom supports configuration through a `phantom.config.json` file in your repository root. This allows you to define files to be automatically copied and commands to be executed when creating new worktrees.

## Configuration File

Create a `phantom.config.json` file in your repository root:

```json
{
  "worktreeBaseDirectory": "../phantom-worktrees",
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

### worktreeBaseDirectory

A custom base directory where Phantom worktrees will be created. By default, Phantom creates all worktrees in `.git/phantom/worktrees/`, but you can customize this location using the `worktreeBaseDirectory` option.

**Use Cases:**
- Store worktrees outside the main repository directory
- Use a shared location for multiple repositories
- Keep worktrees on a different filesystem or drive
- Organize worktrees in a custom directory structure

**Examples:**

**Relative path (relative to repository root):**
```json
{
  "worktreeBaseDirectory": "../phantom-worktrees"
}
```
This creates worktrees directly in `../phantom-worktrees/` (e.g., `../phantom-worktrees/feature-1`)

**Absolute path:**
```json
{
  "worktreeBaseDirectory": "/tmp/my-phantom-worktrees"
}
```
This creates worktrees directly in `/tmp/my-phantom-worktrees/` (e.g., `/tmp/my-phantom-worktrees/feature-1`)

**Directory Structure:**
With `worktreeBaseDirectory` set to `../phantom-worktrees`, your directory structure will look like:

```
parent-directory/
├── your-project/           # Git repository
│   ├── .git/
│   ├── phantom.config.json
│   └── ...
└── phantom-worktrees/      # Custom worktree location
    ├── feature-1/
    ├── feature-2/
    └── bugfix-login/
```

**Notes:**
- If `worktreeBaseDirectory` is not specified, defaults to `.git/phantom/worktrees`
- Relative paths are resolved from the repository root
- Absolute paths are used as-is
- The directory will be created automatically if it doesn't exist
- When worktreeBaseDirectory is specified, worktrees are created directly in that directory

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
      "config/database.local.yml"
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
      "pnpm db:seed"
    ]
  }
}
```

**Notes:**
- Commands are executed in order
- Execution stops on the first failed command
- Commands run in the new worktree's directory
- Output is displayed in real-time

