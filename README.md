# 👻 Phantom

<div align="center">

**A powerful CLI tool for seamless parallel development with Git worktrees**

[![npm version](https://img.shields.io/npm/v/@aku11i/phantom.svg)](https://www.npmjs.com/package/@aku11i/phantom)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/@aku11i/phantom.svg)](https://nodejs.org)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/aku11i/phantom)

[Installation](#-installation) • [Basic Usage](#-basic-usage) • [Why Phantom?](#-why-phantom) • [Documentation](#-documentation) • [日本語](./README.ja.md)

</div>

## ✨ Overview

Phantom is a CLI tool that dramatically simplifies Git worktree management. It's optimized for modern development workflows where you need to work on multiple features, bug fixes, and PR reviews in parallel.

### Key Features

- 🚀 **Simplified Worktree Management** - Create and manage Git worktrees with intuitive commands
- 🔄 **Seamless Context Switching** - Jump between different features without stashing or committing
- 🤖 **AI-Friendly** - Perfect for running multiple AI coding agents in parallel
- 🎯 **Branch-Worktree Sync** - Automatically creates matching branches for each worktree
- 🐚 **Interactive Shell** - SSH-like experience for worktree navigation
- 🪟 **tmux Integration** - Create worktrees directly in new tmux windows or panes
- 🔍 **fzf Integration** - Fuzzy find and select worktrees interactively
- 🎮 **Shell Completion** - Full autocomplete support for Fish and Zsh
- ⚡ **Zero Configuration** - Works out of the box with sensible defaults
- 📦 **Zero Dependencies** - Lightweight and fast with no external dependencies

## 🤔 Why Phantom?

Modern development workflows often require working on multiple features simultaneously. While Git worktree is a powerful feature, it requires specifying paths and branches separately, which can be cumbersome.

### The Manual Process

When using Git worktree directly, you need to specify the worktree path, branch name, and base branch each time. Additionally, switching between tasks requires navigating directories, which can be a bit tedious when frequently switching between multiple parallel tasks.

### The Phantom Solution

```bash
# Traditional approach
git worktree add -b feature ../project-feature origin/main
cd ../project-feature

# With Phantom
phantom create feature --shell
```

Phantom combines worktree and branch creation into a single command, making it easy to switch between and work in different workspaces.

## 🚀 Basic Usage

```bash
# Install Phantom
brew install aku11i/tap/phantom

# Create a new worktree
phantom create feature-awesome

# Attach to an existing branch
phantom attach existing-branch

# Jump into the worktree
phantom shell feature-awesome

# Or execute commands directly
phantom exec feature-awesome npm install
phantom exec feature-awesome npm test

# List all your worktrees
phantom list

# Interactive worktree selection with fzf
phantom shell --fzf    # Select and open shell
phantom delete --fzf   # Select and delete

# Clean up when done
phantom delete feature-awesome
```

## 📦 Installation

### Using Homebrew (recommended)
```bash
brew install aku11i/tap/phantom
```

### Using npm
```bash
npm install -g @aku11i/phantom
```

### Build from source
```bash
git clone https://github.com/aku11i/phantom.git
cd phantom
pnpm install
pnpm build
npm link
```

### Optional Dependencies

For the best experience, install these optional tools:

```bash
# For interactive worktree selection
brew install fzf

# For terminal multiplexing features
brew install tmux
```

## 📖 Documentation

### 🎮 Shell Completion Setup

Phantom supports shell completion for Fish and Zsh, making it even faster to work with worktrees:

```bash
# For Fish shell
phantom completion fish > ~/.config/fish/completions/phantom.fish

# For Zsh (add to .zshrc)
eval "$(phantom completion zsh)"
```

Once enabled, you'll get:
- Command name completion (`phantom <TAB>`)
- Worktree name completion (`phantom shell <TAB>`)
- Option completion with descriptions (`phantom create --<TAB>`)

### Commands Overview

#### Worktree Management

```bash
# Create a new worktree with a matching branch
phantom create <name>
phantom create <name> --shell  # Create and enter interactive shell
phantom create <name> --exec <command>  # Create and execute command
phantom create <name> --tmux  # Create and open in new tmux window
phantom create <name> --tmux-vertical  # Create and split tmux pane vertically
phantom create <name> --tmux-v  # Shorthand for --tmux-vertical
phantom create <name> --tmux-horizontal  # Create and split tmux pane horizontally
phantom create <name> --tmux-h  # Shorthand for --tmux-horizontal

# Create a worktree and copy specific files
phantom create <name> --copy-file ".env" --copy-file ".env.local"

# Attach to an existing branch as a worktree
phantom attach <branch-name>
phantom attach <branch-name> --shell  # Attach and enter interactive shell
phantom attach <branch-name> --exec <command>  # Attach and execute command

# List all worktrees with their current status
phantom list
phantom list --fzf  # Interactive selection with fzf (outputs selected name)
phantom list --names  # Machine-readable output (for scripting)

# Get the absolute path to a worktree
phantom where <name>
phantom where --fzf  # Select worktree with fzf and get its path

# Delete a worktree and its branch
phantom delete <name>
phantom delete <name> --force  # Force delete with uncommitted changes
phantom delete --current        # Delete the current worktree (when inside one)
phantom delete --current --force # Force delete current worktree
phantom delete --fzf            # Select worktree to delete with fzf
phantom delete --fzf --force    # Force delete selected worktree
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
phantom shell --fzf  # Select worktree with fzf and open shell
```

### Environment Variables

When opening an interactive shell with `phantom shell`, these environment variables are set:

- `PHANTOM` - Set to "1" for all processes spawned from phantom shell
- `PHANTOM_NAME` - Name of the current worktree
- `PHANTOM_PATH` - Absolute path to the worktree directory

## 💡 Use Cases

Phantom is more than just a worktree wrapper - it's a productivity multiplier. Here are some real-world examples:

### 🪟 tmux Integration

Phantom has built-in tmux support for the ultimate terminal-based workflow:

```bash
# Create a worktree and open in a new tmux window
phantom create feature-x --tmux

# Create and split current pane vertically
phantom create feature-y --tmux-vertical
phantom create feature-y --tmux-v  # shorthand

# Create and split current pane horizontally
phantom create feature-z --tmux-horizontal
phantom create feature-z --tmux-h  # shorthand
```

Perfect for managing multiple features in parallel:
- Each feature gets its own tmux window/pane
- Automatic environment variable setup (`PHANTOM_NAME`, `PHANTOM_PATH`)
- Seamless context switching with tmux keybindings

### 🔍 fzf Integration

Use fzf's fuzzy finding power to quickly navigate between worktrees:

```bash
# Interactively select and open a worktree
phantom shell --fzf

# Select a worktree and get its path
cd $(phantom where --fzf)

# Delete a worktree with interactive selection
phantom delete --fzf

# Combine with other tools
code $(phantom where --fzf)  # Open selected worktree in VS Code
```

The fzf interface shows:
- Worktree names with their branch names
- Dirty status indicators
- Fuzzy search across all worktrees

### Advanced Workflows

```bash
# Quick switching script using fzf
alias pw='phantom shell --fzf'

# Create worktree and immediately open in your editor
phantom create feature --exec "code ." --tmux-v

# List worktrees for scripting
for worktree in $(phantom list --names); do
  echo "Running tests in $worktree"
  phantom exec $worktree npm test
done
```

### VS Code Integration

```bash
# Create a worktree and immediately open it in VS Code
phantom create --exec "code ." new-feature
phantom create --exec "cursor ." new-feature # also works with cursor!!

# Attach to existing branch and open in VS Code
phantom attach --exec "code ." feature/existing-branch
```

### Parallel Development Workflow

```bash
# When a bug report comes in during feature development
phantom create hotfix-critical  # Create worktree for the fix
phantom shell hotfix-critical   # Start working immediately

# After fixing, return to your feature
exit  # Exit the hotfix shell
phantom shell feature-awesome  # Continue feature development
```

## 🔄 Phantom vs Git Worktree

| Feature | Git Worktree | Phantom |
|---------|--------------|---------|
| Create worktree + branch | `git worktree add -b feature ../project-feature` | `phantom create feature` |
| Attach to existing branch | `git worktree add ../project-feature feature` | `phantom attach feature` |
| List worktrees | `git worktree list` | `phantom list` |
| Navigate to worktree | `cd ../project-feature` | `phantom shell feature` |
| Run command in worktree | `cd ../project-feature && npm test` | `phantom exec feature npm test` |
| Remove worktree | `git worktree remove ../project-feature` | `phantom delete feature` |
| Remove current worktree | `cd .. && git worktree remove project-feature` | `phantom delete --current` |

## ⚙️ Configuration

Phantom supports configuration through a `phantom.config.json` file in your repository root. This allows you to define files to be automatically copied and commands to be executed when creating new worktrees.

### Configuration File

Create a `phantom.config.json` file in your repository root:

```json
{
  "postCreate": {
    "copyFiles": [
      ".env",
      ".env.local",
      "config/local.json"
    ],
    "commands": [
      "pnpm install",
      "pnpm build"
    ]
  }
}
```

### Copy Files Feature

When creating a new worktree, Phantom can automatically copy specified files from your current worktree to the new one. This is particularly useful for:

- Environment configuration files (`.env`, `.env.local`)
- Local development settings
- Secret files that are gitignored

You can specify files to copy in two ways:

1. **Using the command line option:**
   ```bash
   phantom create feature --copy-file ".env" --copy-file ".env.local" --copy-file "config/local.json"
   ```

2. **Using the configuration file:**
   Configure once in `phantom.config.json` and it will apply to all new worktrees.

3. **Using both:**
   Files specified in both the configuration file and command line options are merged together (duplicates are removed).

> **Note:** Currently, glob patterns are not supported. Files must be specified with their exact paths relative to the repository root.

### Post-Create Commands

Phantom can automatically execute commands after creating a new worktree. This is useful for:

- Installing dependencies (`pnpm install`, `npm install`, `yarn install`)
- Building the project
- Setting up the development environment
- Running database migrations
- Any other setup tasks specific to your project

Commands are executed in the order they are specified in the configuration file. If a command fails, the creation process will stop and report the error.

Example use cases:
```json
{
  "postCreate": {
    "commands": [
      "pnpm install",           // Install dependencies
      "pnpm db:migrate",        // Run database migrations
      "cp .env.example .env",   // Create environment file from template
      "pnpm build"              // Build the project
    ]
  }
}
```

## 🛠️ Development

```bash
# Clone and setup
git clone https://github.com/aku11i/phantom.git
cd phantom
pnpm install

# Run tests
pnpm test

# Run a specific test file
pnpm test:file src/core/worktree/create.test.js

# Type checking
pnpm typecheck

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

7. **Update release notes for clarity**
   - Review the auto-generated release notes using `gh release view v<version>`
   - Check PR descriptions for important details using `gh pr view <number>`
   - Update the release notes to be more user-friendly:
     - Group changes by category (Features, Bug Fixes, Improvements)
     - Add usage examples for new features
     - Explain the impact of changes in plain language
     - Highlight security fixes and breaking changes
   
   ```bash
   # Edit the release notes
   gh release edit v<version> --notes "$(cat <<'EOF'
   ## 🚀 What's New in v<version>
   
   ### ✨ New Features
   - Feature description with usage example
   
   ### 🐛 Bug Fixes
   - Clear description of what was fixed
   
   ### 🛠️ Improvements
   - Performance, security, or other improvements
   
   EOF
   )"
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
