# Claude Context for phantom

## Project Overview
Phantom is a CLI tool for managing Git worktrees (called "phantoms") with enhanced functionality. For detailed project information, features, and usage, see [](./README.md).

## Development Guidelines
- All files, issues, and pull requests in this repository must be written in English
- Follow existing code conventions and patterns when making changes
- Test all changes before committing
- Always run `pnpm ready` before committing (runs lint, type-check, and tests)
- Other rules is written in the [](./README.md).

## Project Structure
- `README.md` - Main project documentation
- `docs/` - Additional documentation files
- `src/` - Source code
  - `bin/` - Executable entry points
    - `phantom.ts` - Main CLI entry point
    - `phantom.ts` - Alias command for phantom management
  - `commands/` - Top-level commands
    - `exec.ts` - Execute commands in a phantom
    - `shell.ts` - Open interactive shell in a phantom
  - `phantoms/` - Phantom (worktree) management
    - `commands/` - Phantom-specific commands
      - `create.ts` - Create new phantoms
      - `delete.ts` - Delete phantoms
      - `list.ts` - List all phantoms
      - `where.ts` - Get phantom path
  - `git/` - Git utility functions
    - `libs/` - Git helper libraries

## Important Notes
- Use English for all communications and documentation
- Maintain consistency with existing code style

