# 🚀 Getting Started with Phantom

This guide will help you get up and running with Phantom quickly.

## 📋 Table of Contents

- [Installation](#-installation)
- [Basic Concepts](#-basic-concepts)
- [Your First Phantom](#-your-first-phantom)
- [Essential Commands](#-essential-commands)
- [Common Workflows](#-common-workflows)

## 📥 Installation

```bash
# Using Homebrew (recommended)
brew install aku11i/tap/phantom

# Using npm
npm install -g @aku11i/phantom

# Optional tools for better experience: fzf and tmux
```

## 💡 Basic Concepts

### What is a Phantom?

A "phantom" is a Git worktree managed by Phantom. When you create a phantom, it creates a new working directory at `.git/phantom/worktrees/<branch-name>` where you can work independently from your main workspace.

### Why Use Phantom?

Git worktrees are powerful but require manual management of paths and branches. Phantom eliminates these problems:

```bash
# Without Phantom
git worktree add -b feature-awesome ../project-feature-awesome origin/main
cd ../project-feature-awesome

# With Phantom
phantom create feature-awesome --shell
```

Benefits:
- **True multitasking** - Work on multiple features in parallel without context switching
- **Clean workspace** - No need to stash or commit WIP when switching tasks
- **Centralized management** - All worktrees in one predictable location
- **Simple commands** - Intuitive interface for complex Git operations

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

For more commands and options, see the [Commands Reference](./commands.md).

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

