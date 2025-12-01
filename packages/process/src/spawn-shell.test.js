import { strictEqual } from "node:assert";
import { describe, it } from "node:test";
import { spawnShell } from "./spawn-shell.ts";

describe("spawnShell", () => {
  it("returns exit code from spawned command", async () => {
    const exitCode = await spawnShell(
      'node -e "process.exit(0)"',
      [],
      process.cwd(),
      process.env,
    );

    strictEqual(exitCode, 0);
  });

  it("passes environment variables through", async () => {
    const exitCode = await spawnShell(
      'node -e "process.exit(process.env.TEST_SPAWN_SHELL === \\"1\\" ? 0 : 1)"',
      [],
      process.cwd(),
      {
        ...process.env,
        TEST_SPAWN_SHELL: "1",
      },
    );

    strictEqual(exitCode, 0);
  });

  it("propagates non-zero exit codes", async () => {
    const exitCode = await spawnShell(
      'node -e "process.exit(5)"',
      [],
      process.cwd(),
      process.env,
    );

    strictEqual(exitCode, 5);
  });
});
