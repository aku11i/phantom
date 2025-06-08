# 👻 Phantom

<div align="center">

**A powerful CLI tool for seamless parallel development with Git worktrees**

[![npm version](https://img.shields.io/npm/v/@aku11i/phantom.svg)](https://www.npmjs.com/package/@aku11i/phantom)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/@aku11i/phantom.svg)](https://nodejs.org)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/aku11i/phantom)

[日本語](./README.ja.md) • [Quick Guide](./docs/quick-guide.md) • [Commands](./docs/commands.md) • [Configuration](./docs/configuration.md) • [Integrations](./docs/integrations.md)

</div>

## ✨ What is Phantom?

Phantom makes working with Git worktrees as simple as `phantom create feature`. It's designed for developers who need to work on multiple features, review PRs, and fix bugs in parallel without the overhead of stashing, committing, or managing multiple clones.

### Key Features

- 🚀 **One command to create worktree + branch** - No more manual path management
- 🔄 **Instant context switching** - Jump between features without losing state
- 🪟 **Built-in tmux integration** - Split panes and windows automatically
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

- **[Quick Guide](./docs/quick-guide.md)** - Common workflows and tips
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

## 🛠️ Development

```bash
# Clone and setup
git clone https://github.com/aku11i/phantom.git
cd phantom
pnpm install

# Run tests
pnpm test

# Type checking
pnpm typecheck

# Run all checks before committing
pnpm ready
```

## 🤝 Contributing

Contributions are welcome! Please:
- Follow the existing code style
- Add tests for new features
- Run `pnpm ready` before submitting PRs
- Keep documentation up to date

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