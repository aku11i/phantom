# Phantom Commands Reference

This document provides a comprehensive reference for all Phantom commands and their options.

## Table of Contents

- [Worktree Management](#worktree-management)
  - [create](#create)
  - [attach](#attach)
  - [list](#list)
  - [where](#where)
  - [delete](#delete)
- [Working with Worktrees](#working-with-worktrees)
  - [shell](#shell)
  - [exec](#exec)
  - [review](#review)
- [GitHub Integration](#github-integration)
  - [github checkout](#github-checkout)
- [Other Commands](#other-commands)
  - [version](#version)
  - [completion](#completion)

## Worktree Management

### create

Create a new worktree with a matching branch.

```bash
phantom create <name> [options]
```

**Options:**
- `--shell` - Create and enter interactive shell
- `--exec <command>` - Create and execute command
- `--tmux` / `-t` - Create and open in new tmux window
- `--tmux-vertical` / `--tmux-v` - Create and split tmux pane vertically
- `--tmux-horizontal` / `--tmux-h` - Create and split tmux pane horizontally
- `--copy-file <file>` - Copy specific files from current worktree (can be used multiple times)
- `--base <branch/commit>` - Branch or commit to create the new worktree from (defaults to HEAD)

**Examples:**
```bash
# Basic usage
phantom create feature-auth

# Create and immediately open shell
phantom create feature-auth --shell

# Create in new tmux window
phantom create feature-auth --tmux

# Create and copy environment files
phantom create feature-auth --copy-file .env --copy-file .env.local

# Create from main branch
phantom create feature-auth --base main

# Create from remote branch
phantom create hotfix --base origin/production
```

### attach

Attach to an existing branch as a worktree.

```bash
phantom attach <branch-name> [options]
```

**Options:**
- `--shell` - Attach and enter interactive shell
- `--exec <command>` - Attach and execute command

**Examples:**
```bash
# Basic usage
phantom attach feature/existing-branch

# Attach and open shell
phantom attach feature/existing-branch --shell

# Attach and run command
phantom attach feature/existing-branch --exec "npm install"
```

### list

List all worktrees with their current status.

```bash
phantom list [options]
```

**Options:**
- `--fzf` - Interactive selection with fzf (outputs selected name)
- `--names` - Machine-readable output (for scripting)

**Examples:**
```bash
# Basic list
phantom list

# Interactive selection
phantom list --fzf

# For scripting
for worktree in $(phantom list --names); do
  echo "Processing $worktree"
done
```

### where

Get the absolute path to a worktree.

```bash
phantom where <name> [options]
```

**Options:**
- `--fzf` - Select worktree with fzf and get its path

**Examples:**
```bash
# Get path
phantom where feature-auth

# Interactive selection
cd $(phantom where --fzf)

# Open in editor
code $(phantom where feature-auth)
```

### delete

Delete a worktree and its branch.

```bash
phantom delete <name> [options]
```

**Options:**
- `--force` / `-f` - Force delete with uncommitted changes
- `--current` - Delete the current worktree (when inside one)
- `--fzf` - Select worktree to delete with fzf

**Examples:**
```bash
# Basic delete
phantom delete feature-auth

# Force delete
phantom delete feature-auth --force

# Delete current worktree
phantom delete --current

# Interactive selection
phantom delete --fzf
```

## Working with Worktrees

### shell

Open an interactive shell session in a worktree.

```bash
phantom shell <name> [options]
```

**Options:**
- `--fzf` - Select worktree with fzf and open shell
- `--tmux`, `-t` - Open shell in new tmux window
- `--tmux-vertical`, `--tmux-v` - Open shell in vertical split pane
- `--tmux-horizontal`, `--tmux-h` - Open shell in horizontal split pane

**Environment Variables:**
When in a phantom shell, these environment variables are set:
- `PHANTOM` - Set to "1"
- `PHANTOM_NAME` - Name of the current worktree
- `PHANTOM_PATH` - Absolute path to the worktree directory

**Examples:**
```bash
# Open shell
phantom shell feature-auth

# Interactive selection
phantom shell --fzf

# Open in new tmux window
phantom shell feature-auth --tmux

# Open in vertical split pane
phantom shell feature-auth --tmux-v

# Open in horizontal split pane
phantom shell feature-auth --tmux-h

# Interactive selection with tmux
phantom shell --fzf --tmux
```

**Notes:**
- tmux options require being inside a tmux session

### exec

Execute any command in a worktree's context.

```bash
phantom exec [options] <name> <command> [args...]
```

**Options:**
- `--fzf` - Select worktree with fzf and execute command
- `--tmux`, `-t` - Execute command in new tmux window
- `--tmux-vertical`, `--tmux-v` - Execute command in vertical split pane
- `--tmux-horizontal`, `--tmux-h` - Execute command in horizontal split pane

**Examples:**
```bash
# Install dependencies
phantom exec feature-auth npm install

# Run tests
phantom exec feature-auth npm test

# Check git status
phantom exec feature-auth git status

# Run complex commands
phantom exec feature-auth bash -c "npm install && npm test"

# Interactive selection
phantom exec --fzf npm run dev

# Execute in new tmux window
phantom exec --tmux feature-auth npm run dev

# Execute in vertical split pane
phantom exec --tmux-v feature-auth npm test

# Execute in horizontal split pane
phantom exec --tmux-h feature-auth npm run watch

# Interactive selection with tmux
phantom exec --fzf --tmux npm run dev
```

**Notes:**
- tmux options require being inside a tmux session

### review

**⚠️ Experimental Feature**

Launch a GitHub-like PR review interface locally using [reviewit](https://github.com/yoshiko-pg/reviewit).

```bash
phantom review <name> [options]
```

**Options:**
- `--base <ref>` - Compare against specific base reference (branch, commit, or remote)
- `--fzf` - Select worktree with fzf and review

**Examples:**
```bash
# Review against default branch
phantom review feature-auth

# Review against specific local branch
phantom review feature-auth --base main

# Review against remote branch
phantom review feature-auth --base origin/develop

# Review against specific commit
phantom review feature-auth --base a1b2c3d

# Interactive worktree selection
phantom review --fzf

# Interactive selection with custom base
phantom review --fzf --base origin/staging
```

**Requirements:**
- [reviewit](https://github.com/yoshiko-pg/reviewit) must be installed separately (`npm install -g reviewit`)
- Command executes `reviewit . <base-ref>` in the specified worktree

**Notes:**
- This is an experimental feature subject to change
- Credits to [yoshiko-pg/reviewit](https://github.com/yoshiko-pg/reviewit) for the review interface
- Uses `defaultBranch` configuration option when `--base` is not specified

## GitHub Integration

### github checkout

Create a worktree for a GitHub pull request or issue.

```bash
phantom github checkout <number> [options]
phantom gh checkout <number> [options]  # alias
```

**Options:**
- `--base <branch>` - Base branch for new issue branches (issues only, default: repository default branch)

**Examples:**
```bash
# Create worktree for PR #123
phantom github checkout 123

# Create worktree for issue #456
phantom github checkout 456

# Create worktree for issue #789 based on develop branch
phantom github checkout 789 --base develop

# Using the alias
phantom gh checkout 123
```

**Requirements:**
- GitHub CLI (gh) must be installed
- Must be authenticated with `gh auth login`

**Behavior:**
- For PRs: Creates worktree named `pulls/{number}` with the PR's branch
- For Issues: Creates worktree named `issues/{number}` with a new branch

For detailed information, see the [GitHub Integration Guide](./github.md).

## Other Commands

### version

Display the version of Phantom.

```bash
phantom version
```

### completion

Generate shell completion scripts.

```bash
phantom completion <shell>
```

**Supported Shells:**
- `fish` - Fish shell
- `zsh` - Z shell
- `bash` - Bash shell

**Installation:**

When installed via Homebrew, completions for Fish and Zsh are installed automatically. For Bash, manual setup is required:

```bash
# For Fish (add to ~/.config/fish/config.fish for persistence)
phantom completion fish | source

# For Zsh (add to .zshrc)
eval "$(phantom completion zsh)"

# For Bash (add to .bashrc or .bash_profile)
# Prerequisites: bash-completion v2 must be installed
eval "$(phantom completion bash)"
```

## Exit Codes

Phantom uses the following exit codes:
- `0` - Success
- `1` - General error
- `2` - Invalid arguments
- `3` - Git operation failed
- `4` - Worktree operation failed
- `127` - Command not found

## Related Documentation

- [Getting Started](./getting-started.md) - Get started with Phantom quickly
- [Configuration](./configuration.md) - Configure Phantom for your workflow
- [Integrations](./integrations.md) - Integrate Phantom with other tools