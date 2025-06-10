/**
 * Base error class that all domain-specific errors should extend from.
 * Provides a consistent error structure across the application.
 */
export class BaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}
