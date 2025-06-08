# 🚀 Development Guide

This guide provides detailed information for developing Phantom.

## 📋 Table of Contents

- [Development Environment](#development-environment)
- [Project Setup](#project-setup)
- [Development Workflow](#development-workflow)
- [Testing Strategy](#testing-strategy)
- [Debugging](#debugging)
- [Building and Publishing](#building-and-publishing)
- [Common Tasks](#common-tasks)

## 💻 Development Environment

### Required Tools

- **Node.js 18+**: JavaScript runtime
- **pnpm**: Package manager (faster than npm)
- **Git**: Version control
- **TypeScript**: Type checking

### Recommended Tools

- **VS Code**: With TypeScript extensions
- **tmux**: For testing tmux integration
- **fzf**: For testing interactive features

### VS Code Extensions

- TypeScript and JavaScript Language Features
- ESLint
- Prettier (if you prefer)
- GitLens

## 🛠️ Project Setup

### Initial Setup

```bash
# Clone the repository
git clone https://github.com/aku11i/phantom.git
cd phantom

# Install dependencies
pnpm install

# Build the project
pnpm build

# Link globally for testing
pnpm link --global
```

### Directory Structure

See [Architecture](./architecture.md) for detailed structure explanation.

Key directories:
- `src/cli/` - Command-line interface code
- `src/core/` - Business logic
- `src/bin/` - Executable entry point

## 🔄 Development Workflow

### Daily Development

1. **Create a phantom for your feature**
   ```bash
   phantom create my-feature --shell
   ```

2. **Make changes and test**
   ```bash
   # Build changes
   pnpm build
   
   # Run tests
   pnpm test
   
   # Test CLI locally
   phantom list  # Uses globally linked version
   ```

3. **Check code quality**
   ```bash
   pnpm ready  # Runs all checks
   ```

### Testing Changes

After making changes:

```bash
# Rebuild
pnpm build

# Test the CLI directly
node ./dist/bin/phantom.js create test-phantom

# Or use the linked version
phantom create test-phantom
```

### Code Style

The project uses:
- TypeScript for type safety
- ES modules
- Async/await for asynchronous code
- Result types for error handling

## 🧪 Testing Strategy

### Test Structure

Tests are colocated with source files:
- `src/core/worktree/create.ts` → `src/core/worktree/create.test.js`

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run specific test file
pnpm test src/core/worktree/create.test.js

# Run with coverage
pnpm test --coverage
```

### Writing Tests

```javascript
import { test } from "node:test";
import * as assert from "node:assert/strict";

test("should create worktree", async () => {
  // Arrange
  const name = "test-feature";
  
  // Act
  const result = await createWorktree(name);
  
  // Assert
  assert.ok(result.ok);
  assert.equal(result.value.name, name);
});
```

### Test Guidelines

- Test both success and error cases
- Use descriptive test names
- Keep tests focused and isolated
- Mock external dependencies (Git, filesystem)
- Use the Result type pattern

## 🐛 Debugging

### Debug Commands

```bash
# Enable debug output
DEBUG=phantom:* phantom create test

# Debug specific module
DEBUG=phantom:git phantom create test

# Full Node.js debugging
node --inspect-brk ./dist/bin/phantom.js create test
```

### VS Code Debugging

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Phantom",
      "program": "${workspaceFolder}/dist/bin/phantom.js",
      "args": ["create", "test"],
      "outFiles": ["${workspaceFolder}/dist/**/*.js"],
      "sourceMaps": true,
      "preLaunchTask": "npm: build"
    }
  ]
}
```

### Common Issues

1. **Command not found**: Ensure `pnpm link --global` was run
2. **Type errors**: Run `pnpm typecheck`
3. **Test failures**: Check if Git is properly configured
4. **Build errors**: Delete `dist/` and rebuild

## 📦 Building and Publishing

### Build Process

```bash
# Clean and build
rm -rf dist/
pnpm build

# Verify build
ls -la dist/
```

### Pre-release Checklist

1. Update version in `package.json`
2. Update `CHANGELOG.md` (if maintained)
3. Run `pnpm ready` - all checks must pass
4. Test the built package locally

### Publishing

```bash
# Dry run first
pnpm publish --dry-run

# Publish to npm
pnpm publish --access public
```

## 📝 Common Tasks

### Adding a New Command

1. Create handler in `src/cli/handlers/`
2. Add help text in `src/cli/help/`
3. Update main CLI in `src/bin/phantom.ts`
4. Add core logic in `src/core/`
5. Add tests for both CLI and core
6. Update documentation

### Modifying Git Operations

1. All Git operations go through `src/core/git/executor.ts`
2. Add helper functions in `src/core/git/libs/`
3. Use Result types for error handling
4. Add appropriate tests

### Updating Dependencies

```bash
# Check outdated
pnpm outdated

# Update dependencies
pnpm update

# Update specific package
pnpm update typescript
```

### Performance Profiling

```bash
# Profile startup time
time phantom list

# Profile with Node.js
node --prof ./dist/bin/phantom.js create test
node --prof-process isolate-*.log
```

## 🔗 Related Documentation

- [Contributing Guidelines](./CONTRIBUTING.md)
- [Architecture Overview](./architecture.md)
- [Wiki Manual](./wiki-manual.md)

---

For questions or issues, please open a GitHub issue or start a discussion.