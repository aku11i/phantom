import type { ChildProcess } from "node:child_process";
import type { Logger } from "../types/logger.ts";

export class DefaultLogger implements Logger {
  log(message: string): void {
    console.log(message);
  }

  error(message: string): void {
    console.error(message);
  }

  warn(message: string): void {
    console.warn(message);
  }

  table(data: unknown): void {
    console.table(data);
  }

  processOutput(proc: ChildProcess): void {
    proc.stdout?.pipe(process.stdout);
    proc.stderr?.pipe(process.stderr);
  }
}
