import assert from "node:assert";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, test } from "node:test";
import { isErr, isOk } from "@aku11i/phantom-shared";
import {
  PreferencesNotFoundError,
  PreferencesParseError,
  loadPreferences,
} from "./loader.ts";
import { PreferencesValidationError } from "./validate.ts";

describe("loadPreferences", () => {
  let tempDir;
  let originalXdgConfigHome;
  let originalHome;

  beforeEach(async () => {
    tempDir = await mkdtemp(path.join(tmpdir(), "phantom-pref-test-"));
    originalXdgConfigHome = process.env.XDG_CONFIG_HOME;
    originalHome = process.env.HOME;

    // Set HOME to temp directory for testing
    process.env.HOME = tempDir;
    // Clear XDG_CONFIG_HOME to test default behavior
    // biome-ignore lint/performance/noDelete: Need to actually delete env var, not set to "undefined"
    delete process.env.XDG_CONFIG_HOME;
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
  });

  test("should load valid preferences file", async () => {
    const preferences = {
      worktreesDirectory: "/custom/worktrees/path",
    };

    const configPath = path.join(tempDir, ".config", "phantom");
    await mkdir(configPath, { recursive: true });
    await writeFile(
      path.join(configPath, "phantom.json"),
      JSON.stringify(preferences),
    );

    const result = await loadPreferences();

    assert.strictEqual(isOk(result), true);
    if (isOk(result)) {
      assert.deepStrictEqual(result.value, preferences);
    }
  });

  test("should respect XDG_CONFIG_HOME when set", async () => {
    const customConfigDir = path.join(tempDir, "custom-config");
    process.env.XDG_CONFIG_HOME = customConfigDir;

    const preferences = {
      worktreesDirectory: "/xdg/worktrees",
    };

    const configPath = path.join(customConfigDir, "phantom");
    await mkdir(configPath, { recursive: true });
    await writeFile(
      path.join(configPath, "phantom.json"),
      JSON.stringify(preferences),
    );

    const result = await loadPreferences();

    assert.strictEqual(isOk(result), true);
    if (isOk(result)) {
      assert.deepStrictEqual(result.value, preferences);
    }
  });

  test("should return PreferencesNotFoundError when file doesn't exist", async () => {
    const result = await loadPreferences();

    assert.strictEqual(isErr(result), true);
    if (isErr(result)) {
      assert.ok(result.error instanceof PreferencesNotFoundError);
    }
  });

  test("should return PreferencesParseError for invalid JSON", async () => {
    const configPath = path.join(tempDir, ".config", "phantom");
    await mkdir(configPath, { recursive: true });
    await writeFile(path.join(configPath, "phantom.json"), "{ invalid json");

    const result = await loadPreferences();

    assert.strictEqual(isErr(result), true);
    if (isErr(result)) {
      assert.ok(result.error instanceof PreferencesParseError);
    }
  });

  test("should load empty preferences", async () => {
    const configPath = path.join(tempDir, ".config", "phantom");
    await mkdir(configPath, { recursive: true });
    await writeFile(path.join(configPath, "phantom.json"), "{}");

    const result = await loadPreferences();

    assert.strictEqual(isOk(result), true);
    if (isOk(result)) {
      assert.deepStrictEqual(result.value, {});
    }
  });

  describe("validation", () => {
    test("should return PreferencesValidationError when preferences is not an object", async () => {
      const configPath = path.join(tempDir, ".config", "phantom");
      await mkdir(configPath, { recursive: true });
      await writeFile(
        path.join(configPath, "phantom.json"),
        JSON.stringify("string preferences"),
      );

      const result = await loadPreferences();

      assert.strictEqual(isErr(result), true);
      if (isErr(result)) {
        assert.ok(result.error instanceof PreferencesValidationError);
        assert.strictEqual(
          result.error.message,
          "Invalid phantom.json: Expected object, received string",
        );
      }
    });

    test("should return PreferencesValidationError when preferences is null", async () => {
      const configPath = path.join(tempDir, ".config", "phantom");
      await mkdir(configPath, { recursive: true });
      await writeFile(path.join(configPath, "phantom.json"), "null");

      const result = await loadPreferences();

      assert.strictEqual(isErr(result), true);
      if (isErr(result)) {
        assert.ok(result.error instanceof PreferencesValidationError);
        assert.strictEqual(
          result.error.message,
          "Invalid phantom.json: Expected object, received null",
        );
      }
    });

    test("should accept valid preferences with worktreesDirectory", async () => {
      const preferences = {
        worktreesDirectory: "../phantom-worktrees",
      };

      const configPath = path.join(tempDir, ".config", "phantom");
      await mkdir(configPath, { recursive: true });
      await writeFile(
        path.join(configPath, "phantom.json"),
        JSON.stringify(preferences),
      );

      const result = await loadPreferences();

      assert.strictEqual(isOk(result), true);
      if (isOk(result)) {
        assert.deepStrictEqual(result.value, preferences);
      }
    });

    test("should return PreferencesValidationError when preferences is an array", async () => {
      const configPath = path.join(tempDir, ".config", "phantom");
      await mkdir(configPath, { recursive: true });
      await writeFile(
        path.join(configPath, "phantom.json"),
        JSON.stringify([]),
      );

      const result = await loadPreferences();

      assert.strictEqual(isErr(result), true);
      if (isErr(result)) {
        assert.ok(result.error instanceof PreferencesValidationError);
        assert.strictEqual(
          result.error.message,
          "Invalid phantom.json: Expected object, received array",
        );
      }
    });
  });
});
