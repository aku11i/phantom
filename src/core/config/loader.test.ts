import assert from "node:assert";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, test } from "node:test";
import { isErr, isOk } from "../types/result.ts";
import { ConfigNotFoundError, ConfigParseError, loadConfig } from "./loader.ts";

describe("loadConfig", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(path.join(tmpdir(), "phantom-test-"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  test("should load valid config file", async () => {
    const config = {
      postCreate: {
        copyFiles: [".env", "config.local.json"],
      },
    };
    await writeFile(
      path.join(tempDir, "phantom.config.json"),
      JSON.stringify(config),
    );

    const result = await loadConfig(tempDir);

    assert.strictEqual(isOk(result), true);
    if (isOk(result)) {
      assert.deepStrictEqual(result.value, config);
    }
  });

  test("should return ConfigNotFoundError when file doesn't exist", async () => {
    const result = await loadConfig(tempDir);

    assert.strictEqual(isErr(result), true);
    if (isErr(result)) {
      assert.ok(result.error instanceof ConfigNotFoundError);
    }
  });

  test("should return ConfigParseError for invalid JSON", async () => {
    await writeFile(
      path.join(tempDir, "phantom.config.json"),
      "{ invalid json",
    );

    const result = await loadConfig(tempDir);

    assert.strictEqual(isErr(result), true);
    if (isErr(result)) {
      assert.ok(result.error instanceof ConfigParseError);
    }
  });

  test("should load config with only copyFiles", async () => {
    const config = {
      postCreate: {
        copyFiles: [".env.local"],
      },
    };
    await writeFile(
      path.join(tempDir, "phantom.config.json"),
      JSON.stringify(config),
    );

    const result = await loadConfig(tempDir);

    assert.strictEqual(isOk(result), true);
    if (isOk(result)) {
      assert.deepStrictEqual(result.value, config);
    }
  });

  test("should load empty config", async () => {
    await writeFile(path.join(tempDir, "phantom.config.json"), "{}");

    const result = await loadConfig(tempDir);

    assert.strictEqual(isOk(result), true);
    if (isOk(result)) {
      assert.deepStrictEqual(result.value, {});
    }
  });
});
