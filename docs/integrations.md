# Phantom Integrations

Phantom provides seamless integration with popular development tools to enhance your workflow.

## Table of Contents

- [Shell Completion](#shell-completion)
- [tmux Integration](#tmux-integration)
- [Editor Integration](#editor-integration)
- [fzf Integration](#fzf-integration)

## Shell Completion

Phantom supports full shell completion for Fish and Zsh, making it faster to work with commands and worktree names.

### Installation

#### Fish Shell

```bash
phantom completion fish > ~/.config/fish/completions/phantom.fish
```

#### Zsh

```bash
# Add to your .zshrc
eval "$(phantom completion zsh)"
```

### Features

With shell completion enabled, you get:

- **Command completion**: Type `phantom <TAB>` to see all available commands
- **Worktree name completion**: Type `phantom shell <TAB>` to see all worktree names
- **Option completion**: Type `phantom create --<TAB>` to see all available options with descriptions
- **Dynamic updates**: Worktree completions update in real-time as you create/delete them

### Examples

```bash
# Complete command names
phantom <TAB>
# Shows: create, delete, list, shell, exec, where, attach, version, completion

# Complete worktree names for any command
phantom shell <TAB>
# Shows: feature-awesome, bugfix-login, hotfix-critical

# Complete options with descriptions
phantom create --<TAB>
# Shows: --shell, --exec, --tmux, --tmux-vertical, --tmux-horizontal, etc.
```

## tmux Integration

When creating worktrees, you can use tmux to open them in new windows or panes. This allows you to manage multiple work environments simultaneously.

### Basic Usage

```bash
# Open worktree in new tmux window
phantom create feature-x --tmux

# Open with vertical split (side by side)
phantom create feature-y --tmux-vertical

# Open with horizontal split (top and bottom)
phantom create feature-z --tmux-horizontal
```

### Real-World Example

Imagine you're working on a feature when a critical bug report comes in:

```bash
# You're in your main window working on a feature
# Critical bug reported - create a hotfix in a new tmux window
phantom create hotfix-critical --tmux

# Now you have two tmux windows:
# Window 0: Your original feature work
# Window 1: The hotfix worktree

# Switch between windows with Ctrl-b 0, Ctrl-b 1, etc.
# Or use Ctrl-b w to see a list of windows
```

### Advanced Workflow

Create multiple related features with their own tmux panes:

```bash
# Start with your main branch
# Create frontend changes in vertical split
phantom create feature-frontend --tmux-vertical

# Create backend changes in horizontal split
phantom create feature-backend --tmux-horizontal

# Result: 3 panes visible simultaneously
# - Original pane (main branch)
# - Right pane (frontend worktree)
# - Bottom pane (backend worktree)
```

### Combining with --exec

Launch worktrees with development servers running:

```bash
# Create worktree and start dev server in new window
phantom create feature --tmux --exec "npm run dev"

# Create and run tests in split pane
phantom create bugfix --tmux-v --exec "npm test --watch"
```

## Editor Integration

Phantom works seamlessly with popular editors. You can specify an editor to open when creating worktrees.

### VS Code

```bash
# Create worktree and open in VS Code
phantom create feature --exec "code ."

# Open existing worktree
phantom exec feature code .

# Get worktree path and open
code $(phantom where feature)
```

### Cursor

```bash
# Create worktree and open in Cursor
phantom create feature --exec "cursor ."

# Open existing worktree
phantom exec feature cursor .

# Get worktree path and open
cursor $(phantom where feature)
```

### Other Editors

The same pattern works with any editor:

```bash
# Neovim
phantom create feature --exec "nvim ."

# IntelliJ IDEA
phantom create feature --exec "idea ."

# Sublime Text
phantom create feature --exec "subl ."
```

### Workflow Example

A typical development workflow combining editor and tmux:

```bash
# Create feature worktree in new tmux window and open in VS Code
phantom create feature-awesome --tmux --exec "code ."

# The tmux window opens with your shell in the worktree
# VS Code launches with the worktree as the project root
# You can use the terminal in tmux while coding in VS Code
```

## fzf Integration

Interactive search with fzf allows quick worktree selection for any phantom command.

### Basic Usage

Add the `--fzf` flag to interactively select worktrees:

```bash
# Select worktree to open shell
phantom shell --fzf

# Select worktree to delete
phantom delete --fzf

# Get path of selected worktree
phantom where --fzf
```

### Interactive Workflow

The fzf integration shows all your worktrees with fuzzy search:

```bash
phantom shell --fzf

# Shows interactive list:
# > feature-awesome
#   bugfix-login
#   hotfix-critical
#   experiment-new-api

# Type "fix" to filter:
# > bugfix-login
#   hotfix-critical

# Press Enter to open shell in selected worktree
```

### Powerful Combinations

Combine fzf with other tools for efficient workflows:

```bash
# Open selected worktree in editor
code $(phantom where --fzf)

# Change to worktree directory
cd $(phantom where --fzf)

# Run command in selected worktree
phantom exec $(phantom list --fzf) npm test

# Delete worktree with confirmation
phantom delete --fzf --force
```

### Shell Aliases

Add these to your shell configuration for quick access:

```bash
# Quick shell access
alias ps='phantom shell --fzf'

# Quick editor access
alias pe='code $(phantom where --fzf)'

# Quick directory change
alias pcd='cd $(phantom where --fzf)'
```

## Combining Features

The real power comes from combining these integrations:

```bash
# Create worktree in tmux with editor, using fzf to select base branch
phantom attach $(git branch -r | fzf) --tmux --exec "code ."

# Use completion to explore options
phantom create feature --<TAB>
# See all available options, choose --tmux-vertical

# Full power combo: tmux + editor + completion
phantom create awesome-feature --tmux-v --exec "cursor ." --copy-file .env
```

These integrations are designed to work together, creating a seamless development experience that adapts to your workflow.