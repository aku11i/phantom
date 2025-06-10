import { BaseError } from "@aku11i/phantom-shared";

export class GitOperationError extends BaseError {}

export class GitWorktreeError extends GitOperationError {}
