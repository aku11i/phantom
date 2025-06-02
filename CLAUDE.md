# Claude Context for phantom

## Project Overview
Phantom is a CLI tool for managing Git worktrees (called "phantoms") with enhanced functionality. For detailed project information, features, and usage, see [](./README.md).

## Development Guidelines
- All files, issues, and pull requests in this repository must be written in English
- Follow existing code conventions and patterns when making changes
- Test all changes before committing
- Always run `pnpm ready` before committing (runs lint, type-check, and tests)
- Other rules is written in the [](./README.md).

## Project Structure (Updated after Refactoring)
- `README.md` - Main project documentation
- `docs/` - Additional documentation files
- `src/` - Source code following Single Responsibility Principle
  - `bin/` - Executable entry points
    - `phantom.ts` - Main CLI entry point
  - `cli/` - CLI-specific layer (handles user interaction)
    - `handlers/` - Command handlers (orchestration only)
      - `create.ts` - CLI handler for create command
      - `delete.ts` - CLI handler for delete command
      - `exec.ts` - CLI handler for exec command
      - `list.ts` - CLI handler for list command
      - `shell.ts` - CLI handler for shell command
      - `version.ts` - CLI handler for version command
      - `where.ts` - CLI handler for where command
    - `output.ts` - Centralized console output formatting
    - `errors.ts` - CLI error handling and exit codes
  - `core/` - Business logic layer (framework-agnostic)
    - `worktree/` - Worktree operations
      - `create.ts` - Core worktree creation logic
      - `delete.ts` - Core worktree deletion logic
      - `list.ts` - Core worktree listing logic
      - `where.ts` - Core worktree location logic
      - `validate.ts` - Shared validation logic
    - `process/` - Process execution
      - `spawn.ts` - Shared spawn logic
      - `exec.ts` - Command execution in worktree
      - `shell.ts` - Shell spawning in worktree
    - `paths.ts` - Centralized path management
    - `version.ts` - Version information
    - `git/` - Git operations
      - `executor.ts` - Centralized git command execution
      - `libs/` - Git helper libraries
        - `add-worktree.ts` - Git worktree add wrapper
        - `get-current-branch.ts` - Get current branch
        - `get-git-root.ts` - Get git repository root

## Architecture Principles
- **Single Responsibility Principle**: Each module has one clear responsibility
- **Separation of Concerns**: CLI, business logic, and git operations are separated
- **Testability**: Core modules are framework-agnostic and easily testable
- **No Code Duplication**: Common operations are centralized
- **Clear Dependencies**: Dependencies flow from CLI → Core (including Git operations)

## Important Notes
- Use English for all communications and documentation
- Maintain consistency with existing code style
- Core modules should not have CLI-specific dependencies
- All git operations should use the centralized executor