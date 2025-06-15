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