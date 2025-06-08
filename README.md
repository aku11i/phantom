# 👻 Phantom

<div align="center">

**A powerful CLI tool for seamless parallel development with Git worktrees**

[![npm version](https://img.shields.io/npm/v/@aku11i/phantom.svg)](https://www.npmjs.com/package/@aku11i/phantom)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/@aku11i/phantom.svg)](https://nodejs.org)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/aku11i/phantom)

[日本語](./README.ja.md) • [Getting Started](./docs/getting-started.md) • [Commands](./docs/commands.md) • [Configuration](./docs/configuration.md) • [Integrations](./docs/integrations.md)

</div>

## ✨ What is Phantom?

Phantom is a powerful CLI tool that dramatically boosts your development productivity by making Git worktrees simple and intuitive. Run multiple tasks in isolated environments simultaneously and achieve true multitask development. Built for the next generation of parallel development workflows, including AI-powered coding with multiple agents.

### Key Features

- 🚀 **One command to create worktree + branch** - No more manual path management
- 🔄 **True multitasking** - Create separate working directories per branch and run multiple tasks simultaneously
- 🎯 **Execute commands from anywhere** - Run commands in any worktree with `phantom exec <worktree> <command>`
- 🪟 **Built-in tmux integration** - Open worktrees in new panes or windows
- 🔍 **Interactive selection with fzf** - Find and switch worktrees instantly
- 🎮 **Shell completion** - Full autocomplete support for Fish and Zsh
- ⚡ **Zero dependencies** - Fast and lightweight

## 🚀 Quick Start

### Installation

```bash
# Using Homebrew (recommended)
brew install aku11i/tap/phantom

# Using npm
npm install -g @aku11i/phantom
```

**Optional tools for enhanced experience:**
```bash
# Interactive worktree selection
brew install fzf

# Terminal multiplexing features  
brew install tmux
```

### Basic Usage

```bash
# Create a new feature branch in its own worktree
phantom create feature-awesome

# Jump into the worktree
phantom shell feature-awesome

# Run commands in any worktree from anywhere
phantom exec feature-awesome npm test

# Clean up when done
phantom delete feature-awesome
```

### Real-World Example

```bash
# You're working on a feature when a critical bug report comes in
phantom create hotfix-critical --shell  # Creates worktree and enters shell
# Fix the bug, commit, push, create PR

# Return to your feature - exactly where you left off
exit  # Exit hotfix shell
phantom shell feature-awesome  # Back to feature development
```

## 📚 Documentation

- **[Getting Started](./docs/getting-started.md)** - Common workflows and tips
- **[Commands Reference](./docs/commands.md)** - All commands and options
- **[Configuration](./docs/configuration.md)** - Set up automatic file copying and post-create commands
- **[Integrations](./docs/integrations.md)** - tmux, fzf, editors, and more

## 🤔 Why Phantom?

Git worktrees are powerful but require manual management of paths and branches. Phantom eliminates this friction:

```bash
# Without Phantom
git worktree add -b feature-auth ../project-feature-auth origin/main
cd ../project-feature-auth

# With Phantom
phantom create feature-auth --shell
```

Perfect for:
- Working on multiple features simultaneously
- Quick PR reviews without disrupting your work
- Running different versions of your app in parallel
- Keeping a clean `main` worktree while developing in others

## 🤝 Contributing

Contributions are welcome! See our [Contributing Guide](./contributing/CONTRIBUTING.md) for:
- Development setup
- Code style guidelines  
- Testing requirements
- Pull request process

## 📄 License

MIT License - see [LICENSE](LICENSE)

## 🙏 Acknowledgments

Built with 👻 by [@aku11i](https://github.com/aku11i) and [Claude](https://claude.ai)

---

<div align="center">
<a href="https://github.com/aku11i/phantom/issues">Report Bug</a> • 
<a href="https://github.com/aku11i/phantom/issues">Request Feature</a> •
<a href="https://github.com/aku11i/phantom/discussions">Discussions</a>
</div>