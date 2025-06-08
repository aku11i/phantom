# Phantom Quick Guide

## Most Common Commands

### Daily Workflow

```bash
# Start working on a new feature
phantom create feature-name --shell

# Switch between worktrees
phantom shell --fzf

# Run tests in another worktree without switching
phantom exec other-feature npm test

# See what you're working on
phantom list

# Clean up finished work
phantom delete --fzf
```

### Power User Tips

```bash
# Set up aliases in your shell config
alias pw='phantom shell --fzf'          # Quick switch
alias pwe='phantom exec'                # Quick exec
alias pwl='phantom list'                # Quick list
alias pwd='phantom delete --fzf'        # Quick delete

# Create and immediately open in editor
phantom create feature --exec "code ." --tmux

# Work on a colleague's branch
phantom attach origin/colleague-branch --shell
```

## Essential Integrations

### tmux Users

```bash
# Each feature in its own window
phantom create feat1 --tmux
phantom create feat2 --tmux
phantom create feat3 --tmux

# Split current window
phantom create feat --tmux-v  # Vertical split
phantom create feat --tmux-h  # Horizontal split
```

### Shell Completion

```bash
# Fish
phantom completion fish > ~/.config/fish/completions/phantom.fish

# Zsh
echo 'eval "$(phantom completion zsh)"' >> ~/.zshrc
```

## Common Scenarios

### PR Review Workflow

```bash
# Someone asks you to review PR #123
phantom attach origin/pr-123-branch --shell
# Review code, run tests, leave feedback
exit
# Back to your work instantly
```

### Hotfix During Feature Development

```bash
# Working on a feature when production issue appears
phantom create hotfix-prod-issue --shell
# Fix, test, commit, push
exit
# Continue feature work without any setup
```

### Parallel Testing

```bash
# Run tests on multiple branches
for branch in feature-a feature-b feature-c; do
  phantom exec $branch npm test &
done
wait
```

## Advanced Workflows

### Quick Switching with fzf

```bash
# Set up a switching alias
alias pw='phantom shell --fzf'

# Create worktree and immediately open in your editor
phantom create feature --exec "code ." --tmux-v

# Quick directory change to any worktree
cd $(phantom where --fzf)

# Open any worktree in your editor
code $(phantom where --fzf)
```

### Automated Testing Across Worktrees

```bash
# List worktrees for scripting
for worktree in $(phantom list --names); do
  echo "Running tests in $worktree"
  phantom exec $worktree npm test
done

# Interactive test runner
test_worktree() {
  local worktree=$(phantom list --fzf)
  [ -n "$worktree" ] && phantom exec "$worktree" npm test
}
```

### Combined tmux + fzf Workflow

```bash
# Create a function for quick feature switching
phantom_switch() {
  local worktree=$(phantom list --fzf)
  if [ -n "$worktree" ]; then
    tmux new-window -n "$worktree" "phantom shell $worktree"
  fi
}

# Create multiple features and organize in tmux
for feat in auth api ui; do
  phantom create feature-$feat --tmux
done
```

### Git Integration Workflows

```bash
# Quick branch checkout using phantom
checkout_phantom() {
  local worktree=$(phantom list --fzf)
  [ -n "$worktree" ] && git checkout "$worktree"
}

# Compare branches across worktrees
phantom exec feature-a git log --oneline -10 > feature-a.log
phantom exec feature-b git log --oneline -10 > feature-b.log
diff feature-a.log feature-b.log
```

## Project Setup

If your project needs special setup for new worktrees, create `phantom.config.json`:

```json
{
  "postCreate": {
    "copyFiles": [".env", ".env.local"],
    "commands": ["npm install", "npm run setup"]
  }
}
```

## Need More?

- [Full Command Reference](./commands.md)
- [Configuration Options](./configuration.md)
- [All Integrations](./integrations.md)