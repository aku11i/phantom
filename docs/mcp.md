# MCP Integration Guide

## Overview

Phantom now supports the Model Context Protocol (MCP), enabling AI coding assistants to autonomously manage Git worktrees. This integration allows AI agents to work on multiple features or variations in parallel, dramatically improving development efficiency.

## What is MCP?

Model Context Protocol (MCP) is a standard protocol that allows AI assistants to interact with external tools and services. With Phantom's MCP server, AI agents can:

- Create and manage multiple worktrees programmatically
- Switch between different development contexts seamlessly
- Work on multiple features or experiments in parallel
- Keep different implementations isolated and organized

## Installation and Setup

### For Claude Desktop

1. Install Phantom if you haven't already:
   ```bash
   brew install aku11i/tap/phantom
   # or
   npm install -g @aku11i/phantom
   ```

2. Add Phantom to your Claude Desktop configuration:
   
   Open your Claude Desktop configuration file:
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`
   - Linux: `~/.config/Claude/claude_desktop_config.json`

3. Add the Phantom MCP server configuration:
   ```json
   {
     "mcpServers": {
       "phantom": {
         "command": "npx",
         "args": ["-y", "@aku11i/phantom", "mcp"]
       }
     }
   }
   ```

4. Restart Claude Desktop for the changes to take effect.

### For Other AI Assistants

If your AI assistant supports MCP, you can start the Phantom MCP server with:

```bash
phantom mcp
```

The server will communicate via stdin/stdout using the MCP protocol.

## Available MCP Commands

The Phantom MCP server exposes three main tools:

### 1. `phantom_create_worktree`
Creates a new Git worktree (phantom).

**Parameters:**
- `name` (required): Name for the worktree (also used as the branch name)
- `baseBranch` (optional): Base branch to create from (defaults to current branch)

**Example:**
```typescript
{
  "tool": "phantom_create_worktree",
  "arguments": {
    "name": "feature-awesome",
    "baseBranch": "main"
  }
}
```

### 2. `phantom_list_worktrees`
Lists all Git worktrees (phantoms).

**Parameters:** None

**Example:**
```typescript
{
  "tool": "phantom_list_worktrees",
  "arguments": {}
}
```

### 3. `phantom_delete_worktree`
Deletes a Git worktree (phantom).

**Parameters:**
- `name` (required): Name of the worktree to delete
- `force` (optional): Force deletion even if there are uncommitted changes

**Example:**
```typescript
{
  "tool": "phantom_delete_worktree",
  "arguments": {
    "name": "feature-awesome",
    "force": false
  }
}
```

## Use Cases

### 1. Parallel Feature Development

AI agents can work on multiple features simultaneously:

```
User: "Create a user authentication system with both JWT and OAuth2 implementations in separate worktrees"

AI Agent:
1. Creates worktree: phantom_create_worktree("auth-jwt")
2. Implements JWT authentication in auth-jwt worktree
3. Creates worktree: phantom_create_worktree("auth-oauth2")
4. Implements OAuth2 authentication in auth-oauth2 worktree
5. Compares and tests both implementations
```

### 2. A/B Testing Different Approaches

Perfect for exploring multiple solutions:

```
User: "Create 2 variations of a simple hello world app using Express and Hono, 
       each in their own worktree. Make sure each can be started with npm start 
       and served on a different URL."

AI Agent:
1. phantom_create_worktree("express-app")
2. Implements Express server on port 3000
3. phantom_create_worktree("hono-app")
4. Implements Hono server on port 3001
5. Tests both implementations independently
```

### 3. Incremental Feature Development

Build features step by step in isolation:

```
User: "Implement a blog system with separate worktrees for:
       1. Basic CRUD operations
       2. Add authentication
       3. Add commenting system"

AI Agent:
1. phantom_create_worktree("blog-basic")
2. Implements basic CRUD in blog-basic
3. phantom_create_worktree("blog-auth", baseBranch: "blog-basic")
4. Adds authentication on top of basic CRUD
5. phantom_create_worktree("blog-comments", baseBranch: "blog-auth")
6. Adds commenting system on top of authenticated blog
```

### 4. Framework Migration

Migrate codebases between frameworks safely:

```
User: "Migrate our Express API to Fastify, keeping both versions available"

AI Agent:
1. phantom_create_worktree("fastify-migration")
2. Copies Express routes and converts to Fastify syntax
3. Updates middleware to Fastify plugins
4. Maintains both versions for comparison and testing
```

## Best Practices

### For AI Assistants

1. **Always create descriptive worktree names** that reflect the feature or experiment
2. **Use base branches wisely** to build features incrementally
3. **Clean up worktrees** after experiments are complete or merged
4. **List worktrees frequently** to keep track of parallel work
5. **Avoid force deletion** unless explicitly requested by the user

### For Developers

1. **Communicate intent clearly** - Tell the AI what you want to achieve
2. **Request cleanup** - Ask the AI to remove worktrees after experiments
3. **Review AI changes** - Each worktree is a separate branch, review before merging
4. **Use descriptive prompts** - Help the AI choose meaningful worktree names

## Limitations

- MCP integration requires the AI assistant to support the Model Context Protocol
- Worktrees are created in the current Git repository only
- File system operations beyond worktree management need to be done through other tools
- Network operations (like git push) are not included in the MCP interface

## Troubleshooting

### MCP Server Not Found

If Claude Desktop can't find the Phantom MCP server:

1. Verify Phantom is installed: `phantom --version`
2. Check the configuration file path is correct
3. Ensure the configuration JSON is valid
4. Restart Claude Desktop

### Worktree Creation Fails

Common issues:
- Branch name already exists
- Uncommitted changes in the current worktree
- Invalid characters in worktree name
- Insufficient disk space

### Performance Issues

For large repositories:
- Initial worktree creation may take time
- Consider using shallow clones for experiments
- Clean up unused worktrees regularly

## Security Considerations

The Phantom MCP server:
- Only operates within the current Git repository
- Cannot execute arbitrary commands
- Respects Git's security model and permissions
- Does not expose sensitive information

## Future Enhancements

Planned MCP features:
- Worktree status information
- Branch switching within worktrees
- Stash management
- Cherry-pick operations between worktrees

## Contributing

To contribute to Phantom's MCP integration:

1. Check out the MCP server code in `src/mcp/`
2. Follow the contribution guidelines in CONTRIBUTING.md
3. Test with Claude Desktop or other MCP-compatible clients
4. Submit pull requests with clear descriptions

## Resources

- [Phantom GitHub Repository](https://github.com/aku11i/phantom)
- [Model Context Protocol Specification](https://modelcontextprotocol.io)
- [Claude Desktop MCP Guide](https://modelcontextprotocol.io/docs/tools/claude-desktop)