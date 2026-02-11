# Phantom Configuration

## Table of Contents

- [Configuration File](#configuration-file)
- [Configuration Options](#configuration-options)
  - [worktreesDirectory](#worktreebasedirectory)
  - [postCreate.copyFiles](#postcreatecopyfiles)
  - [postCreate.commands](#postcreatecommands)
  - [preDelete.commands](#predeletecommands)
  - [zellij](#zellij)

Phantom supports configuration through a `phantom.config.json` file in your repository root. This allows you to define files to be automatically copied and commands to be executed when creating new worktrees. For personal defaults such as `worktreesDirectory`, prefer `phantom preferences` (stored in your global git config); the `worktreesDirectory` key in `phantom.config.json` is deprecated and will be removed in the next version.

## Configuration File

Create a `phantom.config.json` file in your repository root:

```json
{
  "worktreesDirectory": "../phantom-worktrees",
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
  },
  "preDelete": {
    "commands": [
      "docker compose down"
    ]
  },
  "zellij": {
    "agent": {
      "command": "claude",
      "args": []
    },
    "layout": "./layouts/dev.kdl"
  }
}
```

## Configuration Options

### worktreesDirectory

A custom base directory where Phantom worktrees will be created. By default, Phantom creates all worktrees in `.git/phantom/worktrees/`. Set a per-user location with `phantom preferences set worktreesDirectory <path-from-git-root>` (recommended). The `worktreesDirectory` option in `phantom.config.json` remains temporarily supported for compatibility but is deprecated and will be removed in the next version.

**Use Cases:**
- Store worktrees outside the main repository directory
- Use a shared location for multiple repositories
- Keep worktrees on a different filesystem or drive
- Organize worktrees in a custom directory structure

**Examples:**

**Relative path (relative to repository root):**
```json
{
  "worktreesDirectory": "../phantom-worktrees"
}
```
This creates worktrees directly in `../phantom-worktrees/` (e.g., `../phantom-worktrees/feature-1`)

**Absolute path:**
```json
{
  "worktreesDirectory": "/tmp/my-phantom-worktrees"
}
```
This creates worktrees directly in `/tmp/my-phantom-worktrees/` (e.g., `/tmp/my-phantom-worktrees/feature-1`)

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
- Use a path relative to the Git repository root (relative paths are resolved from the repo root; absolute paths are used as-is)
- The directory will be created automatically if it doesn't exist
- When worktreesDirectory is specified, worktrees are created directly in that directory
- Prefer configuring this via `phantom preferences set worktreesDirectory <path-from-git-root>`; the `phantom.config.json` key is deprecated and will be removed in the next version

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

### preDelete.commands

An array of commands to execute in a worktree **before** it is deleted. Use this to gracefully shut down resources or clean up artifacts that were created in the worktree.

**Use Cases:**
- Stop background services started from the worktree (e.g., `docker compose down`)
- Remove generated assets or caches before deletion
- Run custom teardown scripts

**Example:**
```json
{
  "preDelete": {
    "commands": [
      "docker compose down"
    ]
  }
}
```

**Notes:**
- Commands run in the worktree being deleted
- Commands are executed in order and halt on the first failure
- If a command fails, the worktree is **not** removed
- Output is displayed in real-time

### zellij

Configuration options for Zellij terminal multiplexer integration. The `phantom launch` command uses these settings when creating Zellij sessions.

#### zellij.agent

Configure the AI agent that runs in the Zellij session created by `phantom launch`.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `command` | string | `"claude"` | The command to run the AI agent |
| `args` | string[] | `[]` | Arguments to pass to the agent command |

**Example:**
```json
{
  "zellij": {
    "agent": {
      "command": "claude",
      "args": ["--model", "opus"]
    }
  }
}
```

**Use Cases:**
- Use a different AI coding assistant (e.g., `aider`, `codex`)
- Pass custom arguments to your preferred agent
- Configure model selection or other agent-specific options

**Notes:**
- The agent can be disabled at runtime with `phantom launch --no-agent`
- The default agent command is `claude` if not specified

#### zellij.layout

Path to a custom Zellij layout file (`.kdl`) to use instead of the default layout.

**Example:**
```json
{
  "zellij": {
    "layout": "./layouts/dev.kdl"
  }
}
```

**Default Layout:**
When no custom layout is specified, Phantom generates a layout with:
- Top pane (50%): AI agent (focused)
- Bottom pane (50%): Two shells side by side

**Custom Layout Example (`./layouts/dev.kdl`):**
```kdl
layout {
    pane split_direction="vertical" {
        pane size="60%" focus=true {
            name "agent"
            command "claude"
        }
        pane size="40%" split_direction="horizontal" {
            pane {
                name "shell"
            }
            pane {
                name "tests"
                command "npm"
                args "run" "test:watch"
            }
        }
    }
}
```

**Notes:**
- Paths are relative to the repository root
- Can be overridden at runtime with `phantom launch --layout <path>`
- See [Zellij Layout Documentation](https://zellij.dev/documentation/layouts) for layout syntax

#### Full Zellij Configuration Example

```json
{
  "zellij": {
    "agent": {
      "command": "aider",
      "args": ["--model", "gpt-4o"]
    },
    "layout": "./layouts/custom.kdl"
  }
}
```
