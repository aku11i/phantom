import type { ChildProcess } from "node:child_process";

export const output = {
  log: (message: string) => {
    console.log(message);
  },

  error: (message: string) => {
    console.error(message);
  },

  table: (data: unknown) => {
    console.table(data);
  },

  processOutput: (proc: ChildProcess) => {
    proc.stdout?.pipe(process.stdout);
    proc.stderr?.pipe(process.stderr);
  },
};
