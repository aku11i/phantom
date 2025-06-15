# GitHub Integration Guide

## Overview

Phantom provides seamless integration with GitHub, allowing you to quickly create worktrees for pull requests and issues. This feature streamlines the workflow for reviewing PRs, testing changes, and developing fixes for issues.

## Requirements

> [!IMPORTANT]  
> To use Phantom's GitHub integration, you need:
> - GitHub CLI (gh) installed
> - Authentication via `gh auth login`

### Installing GitHub CLI

**macOS:**
```bash
brew install gh
```

**Ubuntu/Debian:**
```bash
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update
sudo apt install gh
```

**Other platforms:**
Visit [GitHub CLI installation guide](https://github.com/cli/cli#installation)

### Authentication

After installing GitHub CLI, authenticate with your GitHub account:

```bash
gh auth login
```

Follow the interactive prompts to complete authentication.

## Commands

### `phantom github checkout`

Creates a worktree for a GitHub pull request or issue.

**Syntax:**
```bash
phantom github checkout <number> [options]
```

**Alias:**
```bash
phantom gh checkout <number> [options]
```

**Options:**
- `--base <branch>`: Base branch for new issue branches (default: repository default branch)

## Use Cases

### 1. Reviewing Pull Requests

When you need to review and test a pull request locally:

```bash
# Create a worktree for PR #123
phantom github checkout 123

# The worktree is created as 'pr-123' with the PR's branch
cd .git/phantom/worktrees/pr-123

# Review, test, and make changes
npm test
```

**What happens:**
- Creates a worktree named `pr-123`
- Checks out the PR's branch
- You can test the changes without affecting your main working directory

### 2. Working on Issues

When you want to implement a fix for an issue:

```bash
# Create a worktree for issue #456
phantom github checkout 456

# The worktree is created as 'issue-456' with a new branch
cd .git/phantom/worktrees/issue-456

# Implement your fix
```

**What happens:**
- Creates a worktree named `issue-456`
- Creates a new branch `issue-456` based on the default branch
- You can start implementing the fix immediately

### 3. Issue with Custom Base Branch

When working on an issue that needs to be based on a specific branch:

```bash
# Create a worktree for issue #789 based on 'develop' branch
phantom github checkout 789 --base develop

cd .git/phantom/worktrees/issue-789
# Your worktree is now based on the 'develop' branch
```

## Workflow Examples

### Pull Request Review Workflow

```bash
# 1. Create worktree for the PR
phantom gh checkout 234

# 2. Navigate to the worktree
cd .git/phantom/worktrees/pr-234

# 3. Install dependencies and run tests
npm install
npm test

# 4. Make any necessary changes
code .

# 5. When done, return to main directory and delete worktree
cd -
phantom delete pr-234
```

### Issue Development Workflow

```bash
# 1. Create worktree for the issue
phantom gh checkout 567 --base main

# 2. Navigate to the worktree
cd .git/phantom/worktrees/issue-567

# 3. Implement the fix
# ... make your changes ...

# 4. Commit and push
git add .
git commit -m "fix: resolve issue #567"
git push -u origin issue-567

# 5. Create PR using GitHub CLI
gh pr create --title "Fix: Issue #567" --body "Closes #567"
```

## Best Practices

1. **Clean up after review**: Delete worktrees after reviewing PRs to keep your workspace organized
   ```bash
   phantom delete pr-123
   ```

2. **Use descriptive branch names**: The automatic naming (`pr-{number}` or `issue-{number}`) helps identify the purpose

3. **Keep worktrees focused**: Each worktree should address a single PR or issue

4. **Leverage GitHub CLI**: Use `gh` commands within worktrees for GitHub operations
   ```bash
   gh pr comment 123 --body "LGTM!"
   gh pr merge 123
   ```

## Troubleshooting

### Authentication Issues

If you encounter authentication errors:

```bash
# Check authentication status
gh auth status

# Re-authenticate if needed
gh auth login
```

### Repository Access

Ensure you're in a Git repository with GitHub remote:

```bash
# Check remote configuration
git remote -v

# The repository should have a GitHub remote URL
```

### Network Issues

If GitHub API is unreachable:

```bash
# Test GitHub CLI connectivity
gh api user
```

## Integration with Other Phantom Features

The GitHub integration works seamlessly with other Phantom features:

- **Post-create hooks**: Automatically set up the environment after creating a PR/issue worktree
- **MCP integration**: AI assistants can use GitHub worktrees for automated PR reviews
- **Shell/exec commands**: Run commands in PR worktrees for testing

Example combining features:
```bash
# Create worktree for PR
phantom gh checkout 345

# Run tests in the PR worktree
phantom exec pr-345 npm test

# Open shell in the PR worktree
phantom shell pr-345
```