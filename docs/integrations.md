# Phantom Integrations

Phantom integrates seamlessly with popular development tools to enhance your workflow.

## Table of Contents

- [🪟 tmux Integration](#-tmux-integration)
  - [Features](#features)
  - [Commands](#commands)
  - [Usage Examples](#usage-examples)
  - [Advanced tmux Workflow](#advanced-tmux-workflow)
  - [Power User Tips](#power-user-tips)
  - [Environment Variables](#environment-variables)
- [🔍 fzf Integration](#-fzf-integration)
  - [Features](#features-1)
  - [Commands Supporting fzf](#commands-supporting-fzf)
  - [Usage Examples](#usage-examples-1)
  - [Creating Powerful Aliases](#creating-powerful-aliases)
  - [Advanced Scripting with fzf](#advanced-scripting-with-fzf)
  - [Integration with Other Tools](#integration-with-other-tools)
- [🎮 Shell Completion](#-shell-completion)
  - [Installation](#installation)
  - [Features](#features-2)
  - [Examples](#examples)
  - [Tips](#tips)
- [💻 Editor Integration](#-editor-integration)
  - [VS Code](#vs-code)
  - [Cursor](#cursor)
  - [Neovim](#neovim)
  - [IntelliJ IDEA](#intellij-idea)
- [🔧 Git Integration](#-git-integration)
  - [Pre-commit Hooks](#pre-commit-hooks)
  - [Git Aliases](#git-aliases)
- [🚀 CI/CD Integration](#-cicd-integration)
  - [GitHub Actions](#github-actions)
  - [Scripts](#scripts)
- [🐳 Docker Integration](#-docker-integration)
  - [Docker Compose](#docker-compose)
  - [Development Containers](#development-containers)

## 🪟 tmux Integration

Phantom has built-in tmux support for the ultimate terminal-based workflow.

### Features

- Create worktrees directly in new tmux windows or panes
- Automatic environment variable setup (`PHANTOM_NAME`, `PHANTOM_PATH`)
- Seamless context switching with tmux keybindings
- Perfect for managing multiple features in parallel

### Commands

```bash
# Create a worktree and open in a new tmux window
phantom create feature-x --tmux
phantom create feature-x -t  # shorthand

# Create and split current pane vertically
phantom create feature-y --tmux-vertical
phantom create feature-y --tmux-v  # shorthand

# Create and split current pane horizontally
phantom create feature-z --tmux-horizontal
phantom create feature-z --tmux-h  # shorthand
```

### Usage Examples

```bash
# Perfect for parallel feature development
phantom create feature-auth --tmux
phantom create feature-api --tmux
phantom create feature-ui --tmux

# Each feature now has its own tmux window
# Switch between them with: Ctrl-b [window-number]
```

### Advanced tmux Workflow

```bash
# Create a tmux session for your project
tmux new-session -s myproject

# Create worktrees in split panes
phantom create feature --tmux-h
phantom create bugfix --tmux-v

# Now you have three panes:
# - Original (main branch)
# - Feature worktree (horizontal split)
# - Bugfix worktree (vertical split)
```

### Power User Tips

```bash
# Create worktree and immediately run your dev server
phantom create feature --tmux --exec "npm run dev"

# Create multiple related worktrees quickly
for feat in auth api ui; do
  phantom create feature-$feat --tmux
done

# Use with tmux send-keys for automation
phantom create feature --tmux
tmux send-keys -t feature "npm install && npm run dev" Enter
```

### Environment Variables

When using tmux integration, these variables are automatically set:
- `PHANTOM=1` - Indicates you're in a Phantom worktree
- `PHANTOM_NAME=<worktree-name>` - The worktree name
- `PHANTOM_PATH=<worktree-path>` - Absolute path to the worktree

## 🔍 fzf Integration

Use fzf's fuzzy finding power to quickly navigate between worktrees.

### Features

- Interactive worktree selection with fuzzy search
- Shows worktree names with their branch names
- Dirty status indicators for modified worktrees
- Works seamlessly with multiple commands

### Commands Supporting fzf

```bash
# Interactively select and open a worktree
phantom shell --fzf

# Select a worktree and get its path
phantom where --fzf

# Delete a worktree with interactive selection
phantom delete --fzf
phantom delete --fzf --force  # Force delete with uncommitted changes

# List worktrees and select one (outputs name)
phantom list --fzf
```

### Usage Examples

```bash
# Quick switching between worktrees
phantom shell --fzf

# Open selected worktree in your editor
code $(phantom where --fzf)
cursor $(phantom where --fzf)
vim $(phantom where --fzf)

# Change directory to selected worktree
cd $(phantom where --fzf)

# Run commands in selected worktree
phantom exec $(phantom list --fzf) npm test
```

### Creating Powerful Aliases

Add these to your shell configuration:

```bash
# Quick switch to worktree shell
alias pw='phantom shell --fzf'

# Quick edit in VS Code
alias pe='code $(phantom where --fzf)'

# Quick cd to worktree
alias pcd='cd $(phantom where --fzf)'

# Quick delete with confirmation
alias pd='phantom delete --fzf'
```

### Advanced Scripting with fzf

```bash
# Function to select and run any command
phantom_run() {
  local worktree=$(phantom list --fzf)
  if [ -n "$worktree" ]; then
    phantom exec "$worktree" "$@"
  fi
}

# Usage: phantom_run npm test
# Usage: phantom_run git status

# Interactive worktree operations menu
phantom_menu() {
  local worktree=$(phantom list --fzf)
  [ -z "$worktree" ] && return
  
  local action=$(echo -e "shell\nexec\ndelete\nwhere" | fzf --prompt="Action: ")
  case $action in
    shell) phantom shell "$worktree" ;;
    exec) read -p "Command: " cmd && phantom exec "$worktree" $cmd ;;
    delete) phantom delete "$worktree" ;;
    where) phantom where "$worktree" ;;
  esac
}
```

### Integration with Other Tools

```bash
# Use with tmux for powerful workflows
phantom create feature --exec "tmux new-window 'phantom shell --fzf'"

# Combine with git for branch operations
git checkout $(phantom list --fzf)

# Use in scripts for automation
#!/bin/bash
for worktree in $(phantom list --names); do
  echo "Building $worktree..."
  phantom exec "$worktree" npm run build
done
```

## 🎮 Shell Completion

Phantom supports shell completion for Fish and Zsh, making it even faster to work with worktrees.

### Installation

#### Fish Shell

```bash
phantom completion fish > ~/.config/fish/completions/phantom.fish
```

#### Zsh

```bash
# Add to your .zshrc
eval "$(phantom completion zsh)"

# Or save to a file in your fpath
phantom completion zsh > ~/.zsh/completions/_phantom
```

### Features

Once enabled, you'll get:
- Command name completion (`phantom <TAB>`)
- Worktree name completion (`phantom shell <TAB>`)
- Option completion with descriptions (`phantom create --<TAB>`)
- Dynamic worktree listing that updates in real-time

### Examples

```bash
# Complete command names
phantom <TAB>
# Shows: create, attach, list, shell, exec, delete, where, version, completion

# Complete worktree names
phantom shell <TAB>
# Shows: feature-auth, feature-ui, bugfix-123, etc.

# Complete options with descriptions
phantom create --<TAB>
# Shows:
# --shell            Open shell after creation
# --exec             Execute command after creation  
# --tmux             Open in new tmux window
# --tmux-vertical    Split tmux pane vertically
# --copy-file        Copy files after creation
# ... and more
```

### Tips

- Completion works with all commands that accept worktree names
- Option descriptions help you discover new features
- Worktree completion shows only valid worktrees for the command

## 💻 Editor Integration

### VS Code

```bash
# Create and open immediately
phantom create feature --exec "code ."

# Attach and open
phantom attach existing-branch --exec "code ."

# Open existing worktree
code $(phantom where feature)

# With fzf
code $(phantom where --fzf)
```

### Cursor

```bash
# Create and open
phantom create feature --exec "cursor ."

# Open with fzf selection
cursor $(phantom where --fzf)
```

### Neovim

```bash
# Create and open
phantom create feature --exec "nvim ."

# Open in tmux split
phantom create feature --tmux-v --exec "nvim ."
```

### IntelliJ IDEA

```bash
# Create and open
phantom create feature --exec "idea ."

# Open existing
idea $(phantom where feature)
```

## 🔧 Git Integration

### Pre-commit Hooks

Phantom respects your repository's git hooks:

```bash
# If you have pre-commit hooks, they'll run in each worktree
phantom exec feature git commit -m "feat: new feature"
```

### Git Aliases

Add these to your `.gitconfig`:

```ini
[alias]
    pw = !phantom where
    ps = !phantom shell
    pl = !phantom list
```

## 🚀 CI/CD Integration

### GitHub Actions

```yaml
name: Test All Worktrees
on: [push]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install Phantom
        run: npm install -g @aku11i/phantom
      
      - name: Test all worktrees
        run: |
          for worktree in $(phantom list --names); do
            echo "Testing $worktree"
            phantom exec $worktree npm test
          done
```

### Scripts

```bash
#!/bin/bash
# test-all-worktrees.sh

set -e

for worktree in $(phantom list --names); do
  echo "=== Testing $worktree ==="
  phantom exec "$worktree" npm test
  phantom exec "$worktree" npm run lint
done
```

## 🐳 Docker Integration

### Docker Compose

```bash
# Run docker commands in specific worktrees
phantom exec feature docker-compose up -d
phantom exec feature docker-compose logs -f

# Different compose files per worktree
phantom create feature --copy-file docker-compose.override.yml
```

### Development Containers

```bash
# Open worktree in devcontainer
phantom create feature --exec "code . --open-devcontainer"
```

## Related Documentation

- [Getting Started](./getting-started.md) - Get started with Phantom in minutes
- [Commands Reference](./commands.md) - Complete list of all Phantom commands
- [Configuration](./configuration.md) - Learn how to configure Phantom for your workflow