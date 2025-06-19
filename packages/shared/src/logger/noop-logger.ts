import type { ChildProcess } from "node:child_process";
import type { Logger } from "../types/logger.ts";

export class NoopLogger implements Logger {
  log(_message: string): void {}
  error(_message: string): void {}
  warn(_message: string): void {}
  table(_data: unknown): void {}
  processOutput(_proc: ChildProcess): void {}
}

export const noopLogger = new NoopLogger();
