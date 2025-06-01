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
- One command to create both worktree and branch: `phantom garden create feature-x`
- Instant context switching: `phantom shell feature-x`
- Execute commands without changing directories: `phantom exec feature-x npm test`
- Perfect for "parallel vibe coding" with multiple AI agents

## 🚀 Quick Start

```bash
# Install Phantom
npm install -g @aku11i/phantom

# Create a new development space (garden)
phantom garden create feature-awesome

# Jump into the new space
phantom shell feature-awesome

# Or execute commands directly
phantom exec feature-awesome npm install
phantom exec feature-awesome npm test

# List all your gardens
phantom garden list

# Clean up when done
phantom garden delete feature-awesome
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

**Gardens** 🌳 - Git worktrees managed by Phantom. Each garden is an isolated workspace for a specific branch or feature.

**Phantoms** 👻 - Processes or agents that work within gardens.

### Commands Overview

#### Gardens Management

```bash
# Create a new garden with a matching branch
phantom garden create <name>

# List all gardens with their current status
phantom garden list

# Get the absolute path to a garden
phantom garden where <name>

# Delete a garden and its branch
phantom garden delete <name>
phantom garden delete <name> --force  # Force delete with uncommitted changes
```

#### Working with Gardens

```bash
# Execute any command in a garden's context
phantom exec <garden> <command> [args...]

# Examples:
phantom exec feature-auth npm install
phantom exec feature-auth npm run test
phantom exec feature-auth git status

# Open an interactive shell session in a garden
phantom shell <garden>
```

### Environment Variables

When working within a Phantom context, these environment variables are available:

- `PHANTOM_GARDEN` - Name of the current garden
- `PHANTOM_GARDEN_PATH` - Absolute path to the garden directory

## 🔄 Phantom vs Git Worktree

| Feature | Git Worktree | Phantom |
|---------|--------------|---------|
| Create worktree + branch | `git worktree add -b feature ../project-feature` | `phantom garden create feature` |
| List worktrees | `git worktree list` | `phantom garden list` |
| Navigate to worktree | `cd ../project-feature` | `phantom shell feature` |
| Run command in worktree | `cd ../project-feature && npm test` | `phantom exec feature npm test` |
| Remove worktree | `git worktree remove ../project-feature` | `phantom garden delete feature` |

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

## 🤝 Contributors

- [@aku11i](https://github.com/aku11i) - Project creator and maintainer
- [Claude (Anthropic)](https://claude.ai) - AI pair programmer who implemented most of the codebase

---

<div align="center">
Made with 👻 by <a href="https://github.com/aku11i">aku11i</a> and <a href="https://claude.ai">Claude</a>
</div>
