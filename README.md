# 👻 Phantom

<div align="center">

**A powerful CLI tool for seamless parallel development with Git worktrees**

[![npm version](https://img.shields.io/npm/v/@aku11i/phantom.svg)](https://www.npmjs.com/package/@aku11i/phantom)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/@aku11i/phantom.svg)](https://nodejs.org)

[Installation](#-installation) • [Quick Start](#-quick-start) • [Why Phantom?](#-why-phantom) • [Documentation](#-documentation) • [日本語](./README.ja.md)

</div>

## ✨ Overview

Phantom is a CLI tool that dramatically simplifies Git worktree management. It's optimized for modern development workflows where you need to work on multiple features, bug fixes, and PR reviews in parallel.

### Key Features

- 🚀 **Simplified Worktree Management** - Create and manage Git worktrees with intuitive commands
- 🔄 **Seamless Context Switching** - Jump between different features without stashing or committing
- 🤖 **AI-Friendly** - Perfect for running multiple AI coding agents in parallel
- 🎯 **Branch-Worktree Sync** - Automatically creates matching branches for each worktree
- 🐚 **Interactive Shell** - SSH-like experience for worktree navigation
- ⚡ **Zero Configuration** - Works out of the box with sensible defaults

## 🤔 Why Phantom?

Modern development workflows often require working on multiple features simultaneously. While Git worktree is a powerful feature, it requires specifying paths and branches separately, which can be cumbersome.

### The Manual Process

When using Git worktree directly, you need to specify the worktree path, branch name, and base branch each time. Additionally, switching between tasks requires navigating directories, which can be a bit tedious when frequently switching between multiple parallel tasks.

### The Phantom Solution

```bash
# Traditional approach
git worktree add -b feature ../project-feature origin/main
cd ../project-feature
npm install

# With Phantom
phantom create feature
phantom shell feature
```

Phantom consolidates worktree creation, branch management, and directory navigation into single, intuitive commands.

## 🚀 Quick Start

```bash
# Install Phantom
npm install -g @aku11i/phantom

# Create a new worktree
phantom create feature-awesome

# Jump into the worktree
phantom shell feature-awesome

# Or execute commands directly
phantom exec feature-awesome npm install
phantom exec feature-awesome npm test

# List all your worktrees
phantom list

# Clean up when done
phantom delete feature-awesome
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
pnpm build
npm link
```

## 📖 Documentation

### Core Concepts

**Worktrees** 🌳 - Git worktrees managed by Phantom. Each worktree is an isolated workspace for a specific branch or feature, allowing parallel development without conflicts.

### Commands Overview

#### Worktree Management

```bash
# Create a new worktree with a matching branch
phantom create <name>

# List all worktrees with their current status
phantom list

# Get the absolute path to a worktree
phantom where <name>

# Delete a worktree and its branch
phantom delete <name>
phantom delete <name> --force  # Force delete with uncommitted changes
```

#### Working with Worktrees

```bash
# Execute any command in a worktree's context
phantom exec <name> <command> [args...]

# Examples:
phantom exec feature-auth npm install
phantom exec feature-auth npm run test
phantom exec feature-auth git status

# Open an interactive shell session in a worktree
phantom shell <name>
```

### Environment Variables

When working within a worktree managed by Phantom, these environment variables are available:

- `PHANTOM_NAME` - Name of the current worktree
- `PHANTOM_PATH` - Absolute path to the worktree directory

## 🔄 Phantom vs Git Worktree

| Feature | Git Worktree | Phantom |
|---------|--------------|---------|
| Create worktree + branch | `git worktree add -b feature ../project-feature` | `phantom create feature` |
| List worktrees | `git worktree list` | `phantom list` |
| Navigate to worktree | `cd ../project-feature` | `phantom shell feature` |
| Run command in worktree | `cd ../project-feature && npm test` | `phantom exec feature npm test` |
| Remove worktree | `git worktree remove ../project-feature` | `phantom delete feature` |

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

## 🚀 Release Process

To release a new version of Phantom:

1. **Ensure you're on main branch and up to date**
   ```bash
   git checkout main
   git pull
   ```

2. **Run all checks**
   ```bash
   pnpm ready
   ```

3. **Bump version**
   ```bash
   # For patch releases (bug fixes)
   npm version patch

   # For minor releases (new features)
   npm version minor

   # For major releases (breaking changes)
   npm version major
   ```

4. **Push the version commit and tag**
   ```bash
   git push && git push --tags
   ```

5. **Publish to npm**
   ```bash
   pnpm publish
   ```

6. **Create GitHub release**
   ```bash
   # Create a release with automatically generated notes
   gh release create v<version> \
     --title "Phantom v<version>" \
     --generate-notes \
     --target main

   # Example for v0.1.3:
   gh release create v0.1.3 \
     --title "Phantom v0.1.3" \
     --generate-notes \
     --target main
   ```

The build process is automatically handled by the `prepublishOnly` script, which:
- Runs all tests and checks
- Builds the TypeScript source to JavaScript using esbuild
- Creates bundled executables in the `dist/` directory

**Note**: The `dist/` directory is git-ignored and only created during the publish process.

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
