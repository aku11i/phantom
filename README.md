# 👻 Phantom

<div align="center">

**A powerful CLI tool for seamless parallel development with Git worktrees**

[![npm version](https://img.shields.io/npm/v/@aku11i/phantom.svg)](https://www.npmjs.com/package/@aku11i/phantom)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/@aku11i/phantom.svg)](https://nodejs.org)

[Installation](#-installation) • [Quick Start](#-quick-start) • [Why Phantom?](#-why-phantom) • [Documentation](#-documentation)

</div>

## ✨ Key Features

- 🚀 **Simplified Worktree Management** - Create and manage Git worktrees with intuitive commands
- 🔄 **Seamless Context Switching** - Jump between different features without stashing or committing
- 🤖 **AI-Friendly** - Perfect for running multiple AI coding agents in parallel
- 🎯 **Branch-Worktree Sync** - Automatically creates matching branches for each worktree
- 🐚 **Interactive Shell** - SSH-like experience for worktree navigation
- ⚡ **Zero Configuration** - Works out of the box with sensible defaults

## 🤔 Why Phantom?

Modern development workflows often require working on multiple features simultaneously. Whether you're running AI coding agents in parallel, reviewing PRs while developing, or simply multitasking across features, managing multiple Git worktrees can be cumbersome.

**The Problem:**
- Git worktree commands are verbose and complex
- Managing branches and worktrees separately is error-prone
- Switching contexts requires multiple commands
- Running parallel AI agents on the same codebase is challenging

**The Phantom Solution:**
- One command to create both worktree and branch: `phantom ruins create feature-x`
- Instant context switching: `phantom shell feature-x`
- Execute commands without changing directories: `phantom exec feature-x npm test`
- Perfect for "parallel vibe coding" with multiple AI agents

## 🚀 Quick Start

```bash
# Install Phantom
npm install -g @aku11i/phantom

# Create a new development space (ruin)
phantom ruins create feature-awesome

# Jump into the new space
phantom shell feature-awesome

# Or execute commands directly
phantom exec feature-awesome npm install
phantom exec feature-awesome npm test

# List all your ruins
phantom ruins list

# Clean up when done
phantom ruins delete feature-awesome
```

## 📦 Installation

### Using npm (recommended)
```bash
npm install -g @aku11i/phantom
```

### Using pnpm
```bash
pnpm add -g @aku11i/phantom
```

### Using yarn
```bash
yarn global add @aku11i/phantom
```

### Build from source
```bash
git clone https://github.com/aku11i/phantom.git
cd phantom
pnpm install
npm link
```

## 📖 Documentation

### Core Concepts

**Ruins** 🏚️ - Git worktrees managed by Phantom. Each ruin is an isolated workspace for a specific branch or feature.

**Phantoms** 👻 - Processes or agents that work within ruins. When you run commands or shells in a ruin, you're summoning phantoms.

### Commands Overview

#### Ruins Management

```bash
# Create a new ruin with a matching branch
phantom ruins create <name>

# List all ruins with their current status
phantom ruins list

# Get the absolute path to a ruin
phantom ruins where <name>

# Delete a ruin and its branch
phantom ruins delete <name>
phantom ruins delete <name> --force  # Force delete with uncommitted changes
```

#### Working with Ruins

```bash
# Execute any command in a ruin's context
phantom exec <ruin> <command> [args...]

# Examples:
phantom exec feature-auth npm install
phantom exec feature-auth npm run test
phantom exec feature-auth git status

# Open an interactive shell session in a ruin
phantom shell <ruin>
```

### Environment Variables

When working within a Phantom context, these environment variables are available:

- `PHANTOM_RUIN` - Name of the current ruin
- `PHANTOM_RUIN_PATH` - Absolute path to the ruin directory

### Tips & Tricks

#### Quick Navigation
```bash
# Add to your .bashrc/.zshrc for quick navigation
alias pr='cd $(phantom ruins where $1)'

# Usage: pr feature-auth
```

#### Shell Prompt Customization
```bash
# Add to your shell configuration
if [ -n "$PHANTOM_RUIN" ]; then
    PS1="👻[$PHANTOM_RUIN] $PS1"
fi
```

#### Parallel Development Workflow
```bash
# Start multiple features in parallel
phantom ruins create feature-auth & 
phantom ruins create feature-api &
phantom ruins create bugfix-header

# Run AI agents on different features simultaneously
phantom exec feature-auth cursor .
phantom exec feature-api aider
phantom exec bugfix-header vim
```

## 🔄 Phantom vs Git Worktree

| Feature | Git Worktree | Phantom |
|---------|--------------|---------|
| Create worktree + branch | `git worktree add -b feature ../project-feature` | `phantom ruins create feature` |
| List worktrees | `git worktree list` | `phantom ruins list` |
| Navigate to worktree | `cd ../project-feature` | `phantom shell feature` |
| Run command in worktree | `cd ../project-feature && npm test` | `phantom exec feature npm test` |
| Remove worktree | `git worktree remove ../project-feature` | `phantom ruins delete feature` |

## 🛠️ Development

```bash
# Clone and setup
git clone https://github.com/aku11i/phantom.git
cd phantom
pnpm install

# Run tests
pnpm test

# Type checking
pnpm type-check

# Linting
pnpm lint

# Run all checks
pnpm ready
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to:
- Update tests as appropriate
- Follow the existing code style
- Run `pnpm ready` before submitting

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by the need for better parallel development workflows
- Built for the AI-assisted development era
- Special thanks to all contributors

---

<div align="center">
Made with 👻 by <a href="https://github.com/aku11i">aku11i</a>
</div>