# Claude Context for phantom

## Project Overview
Phantom is a CLI tool for managing Git worktrees (called "phantoms") with enhanced functionality. For detailed project information, features, and usage, see [README.md](./README.md).

## Development Guidelines
- All files, issues, and pull requests in this repository must be written in English
- Follow existing code conventions and patterns when making changes
- Test all changes before committing
- Always run `pnpm ready` before committing (runs lint, typecheck, and tests)
- Other rules is written in the [](./CONTRIBUTING.md).

### Testing

- Use `pnpm test` to run all tests
- Use `pnpm test:file <file>` to run tests for a specific file
- Do not create and run temporary files for testing. Instead, use the existing test files and add new tests as needed
- To verify that implemented features work correctly, write tests instead of directly executing commands

## Project Structure
- `README.md` - Main project documentation
- `CONTRIBUTING.md` - Contribution guidelines
- `docs/` - Additional documentation files
- `src/` - Source code following Single Responsibility Principle
  - `bin/` - Executable entry points
  - `cli/` - CLI-specific layer (handles user interaction)
    - `handlers/` - Command handlers (orchestration only)
  - `core/` - Business logic layer (framework-agnostic)
    - `worktree/` - Worktree operations
    - `process/` - Process execution
    - `git/` - Git operations
      - `libs/` - Git helper libraries

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
- Be sure to read the `README.md` and `CONTRIBUTING.md` files for detailed project information and contribution guidelines
