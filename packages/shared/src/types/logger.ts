import type { ChildProcess } from "node:child_process";

export interface Logger {
  log(message: string): void;
  error(message: string): void;
  warn(message: string): void;
  table(data: unknown): void;
  processOutput(proc: ChildProcess): void;
}
