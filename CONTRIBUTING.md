# 🤝 Contributing to Phantom

Thank you for your interest in contributing to Phantom! This guide will help you get started with development.

## 📋 Table of Contents

- [Development Setup](#development-setup)
- [Development Guidelines](#development-guidelines)
- [Testing](#testing)
- [Code Quality](#code-quality)
- [Pull Request Process](#pull-request-process)
- [Documentation](#documentation)
- [Release Process](#release-process)
- [Additional Resources](#additional-resources)

## 🛠️ Development Setup

### Prerequisites

- Node.js 22+ and pnpm 10+

### Getting Started

```bash
# Clone and setup
git clone https://github.com/aku11i/phantom.git
cd phantom
pnpm install

# run phantom in development mode
pnpm phantom
```

### Development Workflow

```bash
# Run tests
pnpm test

# Type checking
pnpm typecheck

# Linting
pnpm lint
# or
pnpm fix

# Run all checks before committing
pnpm ready
```

## 📝 Development Guidelines

### Language Requirements

- **All files, issues, and pull requests must be written in English**
- This ensures the project is accessible to the global community

### Code Style

- Follow existing code conventions and patterns
- Use TypeScript for all new code
- Follow the Single Responsibility Principle
- Keep modules focused and testable

### Architecture Principles

- **Single Responsibility Principle**: Each module has one clear responsibility
- **Separation of Concerns**: CLI, business logic, and git operations are separated
- **Testability**: Core modules are framework-agnostic and easily testable
- **No Code Duplication**: Common operations are centralized
- **Clear Dependencies**: Dependencies flow from CLI → Core (including Git operations)

## 🧪 Testing

### Running Tests

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test:file src/core/worktree/create.test.js
```

### Writing Tests

- Add tests for all new features
- Follow existing test patterns
- Use descriptive test names
- Test both success and error cases

## ✨ Code Quality

### Before Committing

Always run the following command before committing:

```bash
pnpm ready
```

This command runs:
- Linting (`pnpm lint`)
- Type checking (`pnpm typecheck`)
- All tests (`pnpm test`)

### Security Best Practices

- Never introduce code that exposes or logs secrets and keys
- Never commit secrets or keys to the repository
- Be careful with user input validation

## 🚀 Pull Request Requirements

- Clear description of changes
- Tests for new functionality
- Documentation updates if applicable
- All checks passing (`pnpm ready`)
- Follow existing code style

## 📚 Documentation

When contributing documentation:

- Keep language clear and concise
- Update the table of contents if adding sections
- Check for broken links

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

3. **Build the project**
   ```bash
   pnpm build
   ```

4. **Bump version**
   ```bash
   # For patch releases (bug fixes)
   pnpm version:patch

   # For minor releases (new features)
   pnpm version:minor

   # For major releases (breaking changes)
   pnpm version:major
   ```

5. **Create a release branch**
   ```bash
   git checkout -b release/v<version>
   ```

6. **Commit and push the version changes**
   ```bash
   git add -A
   git commit -m "chore: bump version to <version>"
   git push -u origin release/v<version>
   ```

7. **Create a Pull Request**
   ```bash
   gh pr create --title "Release v<version>" --body "$(cat <<'EOF'
   ## Summary
   - Bump version from <old-version> to <new-version>
   - This release includes <brief summary of changes>
   
   ## Changes Included
   - Feature/Fix description (#PR-number)
   
   ## Release Plan
   After this PR is merged:
   1. Create git tag v<version>
   2. Build the project
   3. Publish to npm
   4. Create GitHub release with detailed notes
   EOF
   )"
   ```

8. **After PR is merged, switch back to main**
   ```bash
   git checkout main
   git pull
   ```

9. **Create and push tag**
   ```bash
   git tag v<version>
   git push --tags
   ```

10. **Build the project before publishing**
    ```bash
    pnpm build
    ```

11. **Publish to npm**
    ```bash
    pnpm publish --recursive
    ```

12. **Create GitHub release**
    ```bash
    # Create a release with automatically generated notes
    gh release create v<version> \
      --title "Phantom v<version>" \
      --generate-notes \
      --target main

    # Example for v1.3.0:
    gh release create v1.3.0 \
      --title "Phantom v1.3.0" \
      --generate-notes \
      --target main
    ```

13. **Update release notes for clarity**
   - Review the auto-generated release notes using `gh release view v<version>`
   - Check PR descriptions for important details using `gh pr view <number>`
   - Update the release notes to be more user-friendly:
     - Group changes by category (Features, Bug Fixes, Improvements, Documentation)
     - Add usage examples for new features with code blocks
     - Credit external contributors inline (e.g., "Thanks @username!")
     - Include PR numbers for all changes
     - Add installation/upgrade instructions
     - Include "New Contributors" section with PR numbers
   
   ```bash
   # Edit the release notes
   gh release edit v<version> --notes "$(cat <<'EOF'
   ## 🚀 What's New in v<version>
   
   <Brief overview of major changes>
   
   ### ✨ New Features
   
   #### Feature Name (#PR) - Thanks @contributor!
   Description and usage example:
   ```bash
   # Example command
   ```
   
   ### 🛠️ Improvements
   - **Improvement** (#PR) - Description
   - **Another improvement** (#PR) - Description
   
   ### 🐛 Bug Fixes
   - Fixed issue description (#PR) - Thanks @contributor!
   
   ### 📚 Documentation
   - Documentation updates (#PR)
   
   ### 🙏 New Contributors
   Welcome to our new contributors!
   - @username - Contribution description (#PR)
   
   ---
   
   **Installation/Upgrade:**
   ```bash
   npm install -g @aku11i/phantom@latest
   # or
   brew upgrade phantom
   ```
   
   **Full Changelog**: https://github.com/aku11i/phantom/compare/v<previous>...v<version>
   EOF
   )"
   ```

## 🙏 Thank You!

Your contributions make Phantom better for everyone. If you have questions, feel free to:
- Open an issue for bugs or feature requests
- Start a discussion for general questions
- Ask in pull request comments

