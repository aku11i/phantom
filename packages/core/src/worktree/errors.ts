export class WorktreeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class WorktreeNotFoundError extends WorktreeError {
  constructor(name: string) {
    super(`Worktree '${name}' not found`);
    this.name = "WorktreeNotFoundError";
  }
}

export class WorktreeAlreadyExistsError extends WorktreeError {
  constructor(name: string) {
    super(`Worktree '${name}' already exists`);
    this.name = "WorktreeAlreadyExistsError";
  }
}

export class InvalidWorktreeNameError extends WorktreeError {
  constructor(name: string) {
    super(`Invalid worktree name: '${name}'`);
    this.name = "InvalidWorktreeNameError";
  }
}

export class BranchNotFoundError extends WorktreeError {
  constructor(branchName: string) {
    super(`Branch '${branchName}' not found`);
    this.name = "BranchNotFoundError";
  }
}
