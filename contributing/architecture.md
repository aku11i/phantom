# 🏗️ Phantom Architecture

This document describes the architecture and design principles of Phantom.

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture Principles](#architecture-principles)
- [Project Structure](#project-structure)
- [Module Responsibilities](#module-responsibilities)
- [Data Flow](#data-flow)
- [Design Decisions](#design-decisions)

## 🎯 Overview

Phantom is designed as a layered CLI application with clear separation between user interaction, business logic, and Git operations. The architecture follows clean code principles to ensure maintainability, testability, and extensibility.

## 🏛️ Architecture Principles

### Single Responsibility Principle
Each module has one clear responsibility, making the codebase easier to understand and maintain.

### Separation of Concerns
The codebase is organized into three main layers:
- **CLI Layer**: Handles user interaction and command-line interface
- **Core Layer**: Contains business logic, framework-agnostic
- **Git Layer**: Manages all Git operations through a centralized executor

### Testability
Core modules are designed to be framework-agnostic and easily testable. Dependencies are injected where needed, making unit testing straightforward.

### No Code Duplication
Common operations are centralized in shared modules to avoid duplication and ensure consistency.

### Clear Dependencies
Dependencies flow in one direction: CLI → Core (including Git operations). Core modules never depend on CLI-specific code.

## 📁 Project Structure

```
src/
├── bin/
│   └── phantom.ts          # Entry point
├── cli/                    # CLI Layer
│   ├── handlers/          # Command handlers
│   │   ├── create.ts
│   │   ├── delete.ts
│   │   ├── exec.ts
│   │   ├── list.ts
│   │   ├── shell.ts
│   │   ├── version.ts
│   │   └── where.ts
│   ├── help/              # Help text for commands
│   ├── output.ts          # Console output formatting
│   └── errors.ts          # CLI error handling
└── core/                  # Business Logic Layer
    ├── worktree/          # Worktree operations
    │   ├── create.ts
    │   ├── delete.ts
    │   ├── list.ts
    │   ├── where.ts
    │   └── validate.ts
    ├── process/           # Process execution
    │   ├── spawn.ts
    │   ├── exec.ts
    │   ├── shell.ts
    │   └── tmux.ts
    ├── config/            # Configuration management
    │   ├── loader.ts
    │   └── validate.ts
    ├── git/               # Git operations
    │   ├── executor.ts
    │   └── libs/         # Git helper functions
    ├── utils/             # Utilities
    │   ├── fzf.ts
    │   └── type-guards.ts
    ├── paths.ts           # Path management
    └── version.ts         # Version information
```

## 🔧 Module Responsibilities

### CLI Layer (`src/cli/`)

**handlers/**
- Command orchestration
- User input validation
- Error handling and user feedback
- Calling appropriate core functions

**output.ts**
- Consistent console output formatting
- Color and styling management
- Progress indicators

**errors.ts**
- CLI-specific error handling
- Exit code management
- User-friendly error messages

### Core Layer (`src/core/`)

**worktree/**
- Core worktree management logic
- Path resolution and validation
- Business rules for phantom operations

**process/**
- Command execution in worktrees
- Shell spawning
- tmux integration
- Process lifecycle management

**config/**
- Configuration file loading
- Configuration validation
- Default values management

**git/**
- All Git command execution
- Git worktree operations
- Repository state queries

**utils/**
- Shared utilities
- Type guards
- fzf integration

## 🔄 Data Flow

1. **User Input** → CLI Handler
2. **CLI Handler** → Validates input, calls Core functions
3. **Core Functions** → Execute business logic, may call Git operations
4. **Git Operations** → Execute Git commands via centralized executor
5. **Results** → Flow back through Core to CLI
6. **CLI Output** → Formatted and displayed to user

### Example: Creating a Phantom

```
User: phantom create feature-x
  ↓
CLI Handler (create.ts)
  ↓
Core Worktree (create.ts)
  ↓
Git Executor (add-worktree.ts)
  ↓
File Copier (if configured)
  ↓
Post-create commands (if configured)
  ↓
Success message to user
```

## 💡 Design Decisions

### Why Separate CLI and Core?

- **Testability**: Core logic can be tested without CLI dependencies
- **Reusability**: Core functions could be used in different interfaces
- **Clarity**: Clear separation of concerns makes code easier to understand

### Why Centralize Git Operations?

- **Consistency**: All Git commands go through one executor
- **Error Handling**: Centralized Git error handling
- **Logging**: Easy to add Git command logging/debugging
- **Testing**: Can mock Git operations in one place

### Why Use Result Types?

- **Explicit Error Handling**: Forces consideration of error cases
- **Type Safety**: TypeScript ensures all cases are handled
- **No Exceptions**: Predictable control flow

### Configuration Design

- **Optional**: Phantom works without any configuration
- **Project-specific**: Each repository can have its own settings
- **Extensible**: Easy to add new configuration options

## 🔮 Future Considerations

- **Plugin System**: Architecture supports adding plugin capabilities
- **Alternative UIs**: Core layer could support GUI or web interface
- **Performance**: Modular design allows targeted optimization
- **Testing**: Current structure enables comprehensive test coverage

---

For implementation details and code examples, refer to the source code and inline documentation.