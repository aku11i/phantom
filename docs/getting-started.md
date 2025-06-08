# 🚀 Getting Started with Phantom

This guide will help you get up and running with Phantom quickly.

## 📋 Table of Contents

- [Installation](#installation)
- [Basic Concepts](#basic-concepts)
- [Your First Phantom](#your-first-phantom)
- [Essential Commands](#essential-commands)
- [Common Workflows](#common-workflows)
- [Tips for Beginners](#tips-for-beginners)
- [Next Steps](#next-steps)

## 📥 Installation

```bash
# Using Homebrew (recommended)
brew install aku11i/tap/phantom

# Using npm
npm install -g @aku11i/phantom

# Optional: Install for better experience
brew install fzf tmux
```

## 💡 Basic Concepts

### What is a Phantom?

A "phantom" is Phantom's friendly name for a Git worktree. Think of it as a lightweight copy of your repository where you can work on a different branch without affecting your main workspace.

### Why Use Phantom?

- **Work on multiple features** without stashing or committing WIP
- **Review PRs** without disrupting your current work
- **Test different versions** of your code simultaneously
- **Keep a clean main branch** while developing features

## 👻 Your First Phantom

Let's create your first phantom:

```bash
# Create a new feature branch in its own workspace
phantom create my-first-feature

# Enter the phantom's workspace
phantom shell my-first-feature

# You're now in a separate workspace!
# Make changes, test, commit - all isolated from your main branch

# When done, exit back to where you started
exit
```

## 🎯 Essential Commands

These five commands will cover 90% of your phantom usage:

### 1. Create a Phantom
```bash
phantom create feature-name
```

### 2. Enter a Phantom
```bash
phantom shell feature-name
```

### 3. List Your Phantoms
```bash
phantom list
```

### 4. Run Commands in a Phantom
```bash
phantom exec feature-name npm test
```

### 5. Delete a Phantom
```bash
phantom delete feature-name
```

## 🔄 Common Workflows

### Switching Between Features

You're working on a feature when you need to check something in another branch:

```bash
# Save your current location mentally
phantom list  # See: you're in feature-a

# Jump to another feature
phantom shell feature-b

# Do your work...

# Jump back
exit
phantom shell feature-a
```

### Emergency Bug Fix

A critical bug needs fixing while you're in the middle of feature development:

```bash
# Create a hotfix phantom
phantom create hotfix-critical --shell

# You're now in the hotfix workspace
# Fix the bug, test, commit, push

# Return to your feature
exit
phantom shell my-feature
```

### Reviewing a Pull Request

```bash
# Create phantom from a remote branch
phantom attach origin/pr-branch --shell

# Review code, run tests
npm test

# Done reviewing
exit
```

## 💡 Tips for Beginners

### 1. Use Descriptive Names
```bash
# Good
phantom create fix-login-bug
phantom create feature-user-dashboard

# Less clear
phantom create fix1
phantom create temp
```

### 2. Start Simple
Don't worry about advanced features initially. Master the basic create → shell → delete workflow first.

### 3. Check Where You Are
```bash
phantom list  # Shows all phantoms, marks current with *
```

### 4. Clean Up Regularly
```bash
phantom list                    # See what you have
phantom delete old-feature      # Remove finished work
```

### 5. Use Shell Completion
Set up tab completion for easier use:
```bash
# For Fish
phantom completion fish > ~/.config/fish/completions/phantom.fish

# For Zsh
echo 'eval "$(phantom completion zsh)"' >> ~/.zshrc
```

## 🚪 Next Steps

Now that you understand the basics:

1. **Explore More Commands**: See the [Commands Reference](./commands.md) for all available options
2. **Set Up Your Project**: Learn about [Configuration](./configuration.md) for automatic setup
3. **Power User Features**: Check out [Integrations](./integrations.md) for tmux, fzf, and editor integration

### Helpful Aliases

Add these to your shell configuration for quicker access:

```bash
alias pw='phantom create'
alias ps='phantom shell'
alias pl='phantom list'
alias pe='phantom exec'
alias pd='phantom delete'
```

## 🆘 Getting Help

- Run `phantom --help` for command help
- Check the [Commands Reference](./commands.md) for detailed usage
- Visit the [GitHub repository](https://github.com/aku11i/phantom) for issues and discussions

---

Remember: Phantom is designed to make your development workflow smoother. Start with the basics, and gradually incorporate more features as you get comfortable!