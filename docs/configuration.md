# Phantom Configuration

## Table of Contents

- [Global Preferences](#global-preferences)
- [Project Configuration](#project-configuration)
- [Configuration Options](#configuration-options)
  - [worktreesDirectory](#worktreebasedirectory)
  - [postCreate.copyFiles](#postcreatecopyfiles)
  - [postCreate.commands](#postcreatecommands)
- [Configuration Priority](#configuration-priority)

Phantom supports two types of configuration files:
1. **Global Preferences** (`~/.config/phantom/phantom.json`) - User-specific settings that apply to all projects
2. **Project Configuration** (`phantom.config.json`) - Project-specific settings that are committed to the repository

## Global Preferences

The global preferences file allows you to configure user-specific settings that should not be committed to project repositories.

### Location

The preferences file is located at:
- Linux/macOS: `~/.config/phantom/phantom.json`
- With XDG_CONFIG_HOME: `$XDG_CONFIG_HOME/phantom/phantom.json`

### Example

```json
{
  "worktreesDirectory": "/home/user/phantom-worktrees"
}
```

## Project Configuration

Create a `phantom.config.json` file in your repository root to define project-specific settings. This file is committed to the repository and shared among all contributors.

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

### worktreesDirectory

A custom base directory where Phantom worktrees will be created. By default, Phantom creates all worktrees in `.git/phantom/worktrees/`, but you can customize this location using the `worktreesDirectory` option.

> **⚠️ Deprecation Notice**
> 
> Setting `worktreesDirectory` in `phantom.config.json` is deprecated and will be removed in a future version.
> Please move this setting to the global preferences file (`~/.config/phantom/phantom.json`).

**Migration Guide:**

1. Create the global preferences directory:
   ```bash
   mkdir -p ~/.config/phantom
   ```

2. Create or update `~/.config/phantom/phantom.json`:
   ```json
   {
     "worktreesDirectory": "/your/preferred/path"
   }
   ```

3. Remove `worktreesDirectory` from your project's `phantom.config.json`

**Use Cases:**
- Store worktrees outside the main repository directory
- Use a shared location for multiple repositories
- Keep worktrees on a different filesystem or drive
- Organize worktrees in a custom directory structure

**Examples:**

**In global preferences (`~/.config/phantom/phantom.json`):**

Relative path (relative to repository root):
```json
{
  "worktreesDirectory": "../phantom-worktrees"
}
```

Absolute path:
```json
{
  "worktreesDirectory": "/tmp/my-phantom-worktrees"
}
```

**Directory Structure:**
With `worktreesDirectory` set to `../phantom-worktrees`, your directory structure will look like:

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
- If `worktreesDirectory` is not specified, defaults to `.git/phantom/worktrees`
- Relative paths are resolved from the repository root
- Absolute paths are used as-is
- The directory will be created automatically if it doesn't exist
- When worktreesDirectory is specified, worktrees are created directly in that directory

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

## Configuration Priority

Phantom uses the following priority order when determining configuration values:

1. **Global Preferences** (`~/.config/phantom/phantom.json`) - Highest priority
2. **Project Configuration** (`phantom.config.json`) - Lower priority
3. **Default Values** - Lowest priority

This means that user-specific settings in the global preferences file will override project-specific settings, allowing users to customize their workflow without modifying shared project files.

### Example

If both files contain `worktreesDirectory`:
- Global preferences: `"worktreesDirectory": "/home/user/all-worktrees"`
- Project config: `"worktreesDirectory": "../project-worktrees"`

Phantom will use `/home/user/all-worktrees` from the global preferences.
