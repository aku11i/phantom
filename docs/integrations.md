# Phantom Integrations

Phantom integrates seamlessly with popular development tools to enhance your workflow.

## 🪟 tmux Integration

Phantom has built-in tmux support for the ultimate terminal-based workflow.

### Features

- Create worktrees directly in new tmux windows or panes
- Automatic environment variable setup
- Seamless context switching with tmux keybindings

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
# Perfect for feature development workflow
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

### Environment Variables

When using tmux integration, these variables are automatically set:
- `PHANTOM=1`
- `PHANTOM_NAME=<worktree-name>`
- `PHANTOM_PATH=<worktree-path>`

## 🔍 fzf Integration

Use fzf's fuzzy finding power to quickly navigate between worktrees.

### Features

- Interactive worktree selection
- Shows branch names and dirty status
- Fuzzy search across all worktrees
- Works with multiple commands

### Commands Supporting fzf

```bash
# Interactively select and open a worktree
phantom shell --fzf

# Select a worktree and get its path
phantom where --fzf

# Delete a worktree with interactive selection
phantom delete --fzf

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

# Change directory to selected worktree
cd $(phantom where --fzf)

# Delete a worktree interactively
phantom delete --fzf
```

### Creating Aliases

Add these to your shell configuration:

```bash
# Quick switch
alias pw='phantom shell --fzf'

# Quick edit
alias pe='code $(phantom where --fzf)'

# Quick cd
alias pcd='cd $(phantom where --fzf)'
```

### Scripting with fzf

```bash
# Select a worktree and run tests
WORKTREE=$(phantom list --fzf)
if [ -n "$WORKTREE" ]; then
  phantom exec "$WORKTREE" npm test
fi

# Interactive worktree operations
select_and_build() {
  local worktree=$(phantom list --fzf)
  [ -n "$worktree" ] && phantom exec "$worktree" npm run build
}
```

## 🎮 Shell Completion

Phantom supports shell completion for Fish and Zsh.

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

- Command name completion
- Worktree name completion for relevant commands
- Option completion with descriptions
- Dynamic worktree listing

### Examples

```bash
# Complete command names
phantom <TAB>
# Shows: create, attach, list, shell, exec, delete, where, version, completion

# Complete worktree names
phantom shell <TAB>
# Shows: feature-auth, feature-ui, bugfix-123, etc.

# Complete options
phantom create --<TAB>
# Shows: --shell, --exec, --tmux, --tmux-vertical, --copy-file, etc.
```

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