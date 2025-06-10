export class GitOperationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class GitWorktreeError extends GitOperationError {}
