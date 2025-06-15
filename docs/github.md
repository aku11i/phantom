# GitHub Integration Guide

## Overview

Phantom provides seamless integration with GitHub, allowing you to quickly create worktrees for pull requests and issues. This feature streamlines the workflow for reviewing PRs, testing changes, and developing fixes for issues.

## Requirements

> [!IMPORTANT]  
> To use Phantom's GitHub integration, you need:
> - GitHub CLI (gh) installed and authenticated
> 
> For installation and authentication instructions, visit the [GitHub CLI documentation](https://cli.github.com/manual/)

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
- `--base <branch>`: Base branch for new issue branches (issues only, default: repository default branch)

## Use Cases

### 1. Reviewing Pull Requests

When you need to review and test a pull request locally:

```bash
# Create a worktree for PR #123
phantom github checkout 123

# Open shell in the PR worktree
phantom shell pr-123

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

# Open shell in the issue worktree
phantom shell issue-456

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

# Open shell in the issue worktree
phantom shell issue-789
# Your worktree is now based on the 'develop' branch
```

## Workflow Examples

### Pull Request Review Workflow

```bash
# 1. Create worktree for the PR
phantom gh checkout 234

# 2. Open shell in the worktree
phantom shell pr-234

# 3. Install dependencies and run tests
npm install
npm test

# 4. Make any necessary changes
code .

# 5. When done, exit shell and delete worktree
exit
phantom delete pr-234
```

### Issue Development Workflow

```bash
# 1. Create worktree for the issue
phantom gh checkout 567 --base main

# 2. Open shell in the worktree
phantom shell issue-567

# 3. Implement the fix
# ... make your changes ...

# 4. Commit and push
git add .
git commit -m "fix: resolve issue #567"
git push -u origin issue-567

# 5. Create PR using GitHub CLI
gh pr create --title "Fix: Issue #567" --body "Closes #567"

# 6. Exit shell when done
exit
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