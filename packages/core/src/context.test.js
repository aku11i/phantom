import assert from "node:assert";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, mock, test } from "node:test";
import { createContext } from "./context.ts";

describe("createContext", () => {
  let tempDir;
  let gitRoot;
  let originalXdgConfigHome;
  let originalHome;
  let consoleWarnMock;

  beforeEach(async () => {
    tempDir = await mkdtemp(path.join(tmpdir(), "phantom-context-test-"));
    gitRoot = path.join(tempDir, "project");
    await mkdir(gitRoot, { recursive: true });

    originalXdgConfigHome = process.env.XDG_CONFIG_HOME;
    originalHome = process.env.HOME;

    // Set HOME to temp directory for testing
    process.env.HOME = tempDir;
    // Clear XDG_CONFIG_HOME to test default behavior
    // biome-ignore lint/performance/noDelete: Need to actually delete env var, not set to "undefined"
    delete process.env.XDG_CONFIG_HOME;

    // Mock console.warn
    consoleWarnMock = mock.method(console, "warn");
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });

    // Restore original environment
    if (originalXdgConfigHome !== undefined) {
      process.env.XDG_CONFIG_HOME = originalXdgConfigHome;
    } else {
      // biome-ignore lint/performance/noDelete: Need to actually delete env var, not set to "undefined"
      delete process.env.XDG_CONFIG_HOME;
    }
    process.env.HOME = originalHome;

    // Restore console.warn
    consoleWarnMock.mock.restore();
  });

  test("should use default worktreesDirectory when no config or preferences", async () => {
    const context = await createContext(gitRoot);

    assert.strictEqual(context.gitRoot, gitRoot);
    assert.strictEqual(
      context.worktreesDirectory,
      path.join(gitRoot, ".git", "phantom", "worktrees"),
    );
    assert.strictEqual(context.config, null);
    assert.strictEqual(context.preferences, null);
  });

  test("should use preferences worktreesDirectory when available", async () => {
    // Create preferences file
    const configPath = path.join(tempDir, ".config", "phantom");
    await mkdir(configPath, { recursive: true });
    await writeFile(
      path.join(configPath, "phantom.json"),
      JSON.stringify({ worktreesDirectory: "/preferences/worktrees" }),
    );

    const context = await createContext(gitRoot);

    assert.strictEqual(context.worktreesDirectory, "/preferences/worktrees");
    assert.notStrictEqual(context.preferences, null);
  });

  test("should use config worktreesDirectory when preferences not available", async () => {
    // Create config file
    await writeFile(
      path.join(gitRoot, "phantom.config.json"),
      JSON.stringify({ worktreesDirectory: "/config/worktrees" }),
    );

    const context = await createContext(gitRoot);

    assert.strictEqual(context.worktreesDirectory, "/config/worktrees");
    assert.notStrictEqual(context.config, null);

    // Should show deprecation warning
    assert.strictEqual(consoleWarnMock.mock.calls.length, 1);
    assert.ok(
      consoleWarnMock.mock.calls[0].arguments[0].includes("deprecated"),
    );
  });

  test("should prioritize preferences over config for worktreesDirectory", async () => {
    // Create both preferences and config files
    const configPath = path.join(tempDir, ".config", "phantom");
    await mkdir(configPath, { recursive: true });
    await writeFile(
      path.join(configPath, "phantom.json"),
      JSON.stringify({ worktreesDirectory: "/preferences/worktrees" }),
    );

    await writeFile(
      path.join(gitRoot, "phantom.config.json"),
      JSON.stringify({ worktreesDirectory: "/config/worktrees" }),
    );

    const context = await createContext(gitRoot);

    // Should use preferences value, not config
    assert.strictEqual(context.worktreesDirectory, "/preferences/worktrees");

    // Should still show deprecation warning for config
    assert.strictEqual(consoleWarnMock.mock.calls.length, 1);
    assert.ok(
      consoleWarnMock.mock.calls[0].arguments[0].includes("deprecated"),
    );
  });

  test("should handle relative worktreesDirectory from preferences", async () => {
    // Create preferences file with relative path
    const configPath = path.join(tempDir, ".config", "phantom");
    await mkdir(configPath, { recursive: true });
    await writeFile(
      path.join(configPath, "phantom.json"),
      JSON.stringify({ worktreesDirectory: "../phantom-worktrees" }),
    );

    const context = await createContext(gitRoot);

    // Should resolve relative to gitRoot
    assert.strictEqual(
      context.worktreesDirectory,
      path.join(gitRoot, "../phantom-worktrees"),
    );
  });

  test("should not warn when config has no worktreesDirectory", async () => {
    // Create config file without worktreesDirectory
    await writeFile(
      path.join(gitRoot, "phantom.config.json"),
      JSON.stringify({ postCreate: { commands: ["echo test"] } }),
    );

    const _context = await createContext(gitRoot);

    // Should not show deprecation warning
    assert.strictEqual(consoleWarnMock.mock.calls.length, 0);
  });
});
