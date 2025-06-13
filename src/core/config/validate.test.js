import assert from "node:assert";
import { describe, test } from "node:test";
import { isErr, isOk } from "../types/result.ts";
import { ConfigValidationError, validateConfig } from "./validate.ts";

describe("validateConfig", () => {
  test("should accept valid config with postCreate and copyFiles", () => {
    const config = {
      postCreate: {
        copyFiles: [".env", "config/local.json"],
      },
    };

    const result = validateConfig(config);

    assert.strictEqual(isOk(result), true);
    if (isOk(result)) {
      assert.deepStrictEqual(result.value, config);
    }
  });

  test("should accept empty config object", () => {
    const config = {};

    const result = validateConfig(config);

    assert.strictEqual(isOk(result), true);
    if (isOk(result)) {
      assert.deepStrictEqual(result.value, config);
    }
  });

  test("should accept config with empty postCreate", () => {
    const config = {
      postCreate: {},
    };

    const result = validateConfig(config);

    assert.strictEqual(isOk(result), true);
    if (isOk(result)) {
      assert.deepStrictEqual(result.value, config);
    }
  });

  test("should accept config with empty copyFiles array", () => {
    const config = {
      postCreate: {
        copyFiles: [],
      },
    };

    const result = validateConfig(config);

    assert.strictEqual(isOk(result), true);
    if (isOk(result)) {
      assert.deepStrictEqual(result.value, config);
    }
  });

  test("should accept valid config with postCreate and commands", () => {
    const config = {
      postCreate: {
        commands: ["pnpm install", "pnpm build"],
      },
    };

    const result = validateConfig(config);

    assert.strictEqual(isOk(result), true);
    if (isOk(result)) {
      assert.deepStrictEqual(result.value, config);
    }
  });

  test("should accept config with both copyFiles and commands", () => {
    const config = {
      postCreate: {
        copyFiles: [".env"],
        commands: ["pnpm install"],
      },
    };

    const result = validateConfig(config);

    assert.strictEqual(isOk(result), true);
    if (isOk(result)) {
      assert.deepStrictEqual(result.value, config);
    }
  });

  test("should accept valid config with postDelete commands", () => {
    const config = {
      postDelete: {
        commands: ["pnpm cleanup", "rm -rf temp"],
      },
    };

    const result = validateConfig(config);

    assert.strictEqual(isOk(result), true);
    if (isOk(result)) {
      assert.deepStrictEqual(result.value, config);
    }
  });

  test("should accept config with empty postDelete", () => {
    const config = {
      postDelete: {},
    };

    const result = validateConfig(config);

    assert.strictEqual(isOk(result), true);
    if (isOk(result)) {
      assert.deepStrictEqual(result.value, config);
    }
  });

  test("should accept config with both postCreate and postDelete", () => {
    const config = {
      postCreate: {
        copyFiles: [".env"],
        commands: ["pnpm install"],
      },
      postDelete: {
        commands: ["pnpm cleanup"],
      },
    };

    const result = validateConfig(config);

    assert.strictEqual(isOk(result), true);
    if (isOk(result)) {
      assert.deepStrictEqual(result.value, config);
    }
  });

  test("should accept config with empty commands array", () => {
    const config = {
      postCreate: {
        commands: [],
      },
    };

    const result = validateConfig(config);

    assert.strictEqual(isOk(result), true);
    if (isOk(result)) {
      assert.deepStrictEqual(result.value, config);
    }
  });

  describe("error cases", () => {
    test("should reject string config", () => {
      const result = validateConfig("not an object");

      assert.strictEqual(isErr(result), true);
      if (isErr(result)) {
        assert.ok(result.error instanceof ConfigValidationError);
        assert.strictEqual(
          result.error.message,
          "Invalid phantom.config.json: Configuration must be an object",
        );
      }
    });

    test("should reject number config", () => {
      const result = validateConfig(123);

      assert.strictEqual(isErr(result), true);
      if (isErr(result)) {
        assert.ok(result.error instanceof ConfigValidationError);
        assert.strictEqual(
          result.error.message,
          "Invalid phantom.config.json: Configuration must be an object",
        );
      }
    });

    test("should reject boolean config", () => {
      const result = validateConfig(true);

      assert.strictEqual(isErr(result), true);
      if (isErr(result)) {
        assert.ok(result.error instanceof ConfigValidationError);
        assert.strictEqual(
          result.error.message,
          "Invalid phantom.config.json: Configuration must be an object",
        );
      }
    });

    test("should reject null config", () => {
      const result = validateConfig(null);

      assert.strictEqual(isErr(result), true);
      if (isErr(result)) {
        assert.ok(result.error instanceof ConfigValidationError);
        assert.strictEqual(
          result.error.message,
          "Invalid phantom.config.json: Configuration must be an object",
        );
      }
    });

    test("should reject undefined config", () => {
      const result = validateConfig(undefined);

      assert.strictEqual(isErr(result), true);
      if (isErr(result)) {
        assert.ok(result.error instanceof ConfigValidationError);
        assert.strictEqual(
          result.error.message,
          "Invalid phantom.config.json: Configuration must be an object",
        );
      }
    });

    test("should reject array config", () => {
      const result = validateConfig([]);

      assert.strictEqual(isErr(result), true);
      if (isErr(result)) {
        assert.ok(result.error instanceof ConfigValidationError);
        assert.strictEqual(
          result.error.message,
          "Invalid phantom.config.json: Configuration must be an object",
        );
      }
    });

    test("should reject when postCreate is string", () => {
      const result = validateConfig({ postCreate: "invalid" });

      assert.strictEqual(isErr(result), true);
      if (isErr(result)) {
        assert.ok(result.error instanceof ConfigValidationError);
        assert.strictEqual(
          result.error.message,
          "Invalid phantom.config.json: postCreate must be an object",
        );
      }
    });

    test("should reject when postCreate is number", () => {
      const result = validateConfig({ postCreate: 123 });

      assert.strictEqual(isErr(result), true);
      if (isErr(result)) {
        assert.ok(result.error instanceof ConfigValidationError);
        assert.strictEqual(
          result.error.message,
          "Invalid phantom.config.json: postCreate must be an object",
        );
      }
    });

    test("should reject when postCreate is array", () => {
      const result = validateConfig({ postCreate: [] });

      assert.strictEqual(isErr(result), true);
      if (isErr(result)) {
        assert.ok(result.error instanceof ConfigValidationError);
        assert.strictEqual(
          result.error.message,
          "Invalid phantom.config.json: postCreate must be an object",
        );
      }
    });

    test("should reject when postCreate is null", () => {
      const result = validateConfig({ postCreate: null });

      assert.strictEqual(isErr(result), true);
      if (isErr(result)) {
        assert.ok(result.error instanceof ConfigValidationError);
        assert.strictEqual(
          result.error.message,
          "Invalid phantom.config.json: postCreate must be an object",
        );
      }
    });

    test("should reject when copyFiles is string", () => {
      const result = validateConfig({ postCreate: { copyFiles: "invalid" } });

      assert.strictEqual(isErr(result), true);
      if (isErr(result)) {
        assert.ok(result.error instanceof ConfigValidationError);
        assert.strictEqual(
          result.error.message,
          "Invalid phantom.config.json: postCreate.copyFiles must be an array",
        );
      }
    });

    test("should reject when copyFiles is number", () => {
      const result = validateConfig({ postCreate: { copyFiles: 123 } });

      assert.strictEqual(isErr(result), true);
      if (isErr(result)) {
        assert.ok(result.error instanceof ConfigValidationError);
        assert.strictEqual(
          result.error.message,
          "Invalid phantom.config.json: postCreate.copyFiles must be an array",
        );
      }
    });

    test("should reject when copyFiles is object", () => {
      const result = validateConfig({ postCreate: { copyFiles: {} } });

      assert.strictEqual(isErr(result), true);
      if (isErr(result)) {
        assert.ok(result.error instanceof ConfigValidationError);
        assert.strictEqual(
          result.error.message,
          "Invalid phantom.config.json: postCreate.copyFiles must be an array",
        );
      }
    });

    test("should reject when copyFiles contains non-string values", () => {
      const result = validateConfig({
        postCreate: { copyFiles: ["file1", 123] },
      });

      assert.strictEqual(isErr(result), true);
      if (isErr(result)) {
        assert.ok(result.error instanceof ConfigValidationError);
        assert.strictEqual(
          result.error.message,
          "Invalid phantom.config.json: postCreate.copyFiles must contain only strings",
        );
      }
    });

    test("should reject when copyFiles contains null", () => {
      const result = validateConfig({
        postCreate: { copyFiles: ["file1", null] },
      });

      assert.strictEqual(isErr(result), true);
      if (isErr(result)) {
        assert.ok(result.error instanceof ConfigValidationError);
        assert.strictEqual(
          result.error.message,
          "Invalid phantom.config.json: postCreate.copyFiles must contain only strings",
        );
      }
    });

    test("should reject when copyFiles contains undefined", () => {
      const result = validateConfig({
        postCreate: { copyFiles: ["file1", undefined] },
      });

      assert.strictEqual(isErr(result), true);
      if (isErr(result)) {
        assert.ok(result.error instanceof ConfigValidationError);
        assert.strictEqual(
          result.error.message,
          "Invalid phantom.config.json: postCreate.copyFiles must contain only strings",
        );
      }
    });

    test("should reject when copyFiles contains objects", () => {
      const result = validateConfig({
        postCreate: { copyFiles: ["file1", {}] },
      });

      assert.strictEqual(isErr(result), true);
      if (isErr(result)) {
        assert.ok(result.error instanceof ConfigValidationError);
        assert.strictEqual(
          result.error.message,
          "Invalid phantom.config.json: postCreate.copyFiles must contain only strings",
        );
      }
    });

    test("should reject when copyFiles contains arrays", () => {
      const result = validateConfig({
        postCreate: { copyFiles: [[]] },
      });

      assert.strictEqual(isErr(result), true);
      if (isErr(result)) {
        assert.ok(result.error instanceof ConfigValidationError);
        assert.strictEqual(
          result.error.message,
          "Invalid phantom.config.json: postCreate.copyFiles must contain only strings",
        );
      }
    });

    test("should reject when commands is string", () => {
      const result = validateConfig({ postCreate: { commands: "invalid" } });

      assert.strictEqual(isErr(result), true);
      if (isErr(result)) {
        assert.ok(result.error instanceof ConfigValidationError);
        assert.strictEqual(
          result.error.message,
          "Invalid phantom.config.json: postCreate.commands must be an array",
        );
      }
    });

    test("should reject when commands is number", () => {
      const result = validateConfig({ postCreate: { commands: 123 } });

      assert.strictEqual(isErr(result), true);
      if (isErr(result)) {
        assert.ok(result.error instanceof ConfigValidationError);
        assert.strictEqual(
          result.error.message,
          "Invalid phantom.config.json: postCreate.commands must be an array",
        );
      }
    });

    test("should reject when commands is object", () => {
      const result = validateConfig({ postCreate: { commands: {} } });

      assert.strictEqual(isErr(result), true);
      if (isErr(result)) {
        assert.ok(result.error instanceof ConfigValidationError);
        assert.strictEqual(
          result.error.message,
          "Invalid phantom.config.json: postCreate.commands must be an array",
        );
      }
    });

    test("should reject when commands contains non-string values", () => {
      const result = validateConfig({
        postCreate: { commands: ["pnpm install", 123] },
      });

      assert.strictEqual(isErr(result), true);
      if (isErr(result)) {
        assert.ok(result.error instanceof ConfigValidationError);
        assert.strictEqual(
          result.error.message,
          "Invalid phantom.config.json: postCreate.commands must contain only strings",
        );
      }
    });

    test("should reject when commands contains null", () => {
      const result = validateConfig({
        postCreate: { commands: ["pnpm install", null] },
      });

      assert.strictEqual(isErr(result), true);
      if (isErr(result)) {
        assert.ok(result.error instanceof ConfigValidationError);
        assert.strictEqual(
          result.error.message,
          "Invalid phantom.config.json: postCreate.commands must contain only strings",
        );
      }
    });

    test("should reject when commands contains objects", () => {
      const result = validateConfig({
        postCreate: { commands: ["pnpm install", {}] },
      });

      assert.strictEqual(isErr(result), true);
      if (isErr(result)) {
        assert.ok(result.error instanceof ConfigValidationError);
        assert.strictEqual(
          result.error.message,
          "Invalid phantom.config.json: postCreate.commands must contain only strings",
        );
      }
    });

    test("should reject when postDelete is string", () => {
      const result = validateConfig({ postDelete: "invalid" });

      assert.strictEqual(isErr(result), true);
      if (isErr(result)) {
        assert.ok(result.error instanceof ConfigValidationError);
        assert.strictEqual(
          result.error.message,
          "Invalid phantom.config.json: postDelete must be an object",
        );
      }
    });

    test("should reject when postDelete is number", () => {
      const result = validateConfig({ postDelete: 123 });

      assert.strictEqual(isErr(result), true);
      if (isErr(result)) {
        assert.ok(result.error instanceof ConfigValidationError);
        assert.strictEqual(
          result.error.message,
          "Invalid phantom.config.json: postDelete must be an object",
        );
      }
    });

    test("should reject when postDelete is array", () => {
      const result = validateConfig({ postDelete: [] });

      assert.strictEqual(isErr(result), true);
      if (isErr(result)) {
        assert.ok(result.error instanceof ConfigValidationError);
        assert.strictEqual(
          result.error.message,
          "Invalid phantom.config.json: postDelete must be an object",
        );
      }
    });

    test("should reject when postDelete commands is string", () => {
      const result = validateConfig({ postDelete: { commands: "invalid" } });

      assert.strictEqual(isErr(result), true);
      if (isErr(result)) {
        assert.ok(result.error instanceof ConfigValidationError);
        assert.strictEqual(
          result.error.message,
          "Invalid phantom.config.json: postDelete.commands must be an array",
        );
      }
    });

    test("should reject when postDelete commands contains non-string values", () => {
      const result = validateConfig({
        postDelete: { commands: ["pnpm cleanup", 123] },
      });

      assert.strictEqual(isErr(result), true);
      if (isErr(result)) {
        assert.ok(result.error instanceof ConfigValidationError);
        assert.strictEqual(
          result.error.message,
          "Invalid phantom.config.json: postDelete.commands must contain only strings",
        );
      }
    });
  });

  describe("edge cases", () => {
    test("should accept config with unknown properties", () => {
      const config = {
        postCreate: {
          copyFiles: [".env", "config/local.json"],
        },
        unknownProperty: "should be ignored",
      };

      const result = validateConfig(config);

      assert.strictEqual(isOk(result), true);
      if (isOk(result)) {
        assert.deepStrictEqual(result.value, config);
      }
    });

    test("should accept postCreate with unknown properties", () => {
      const config = {
        postCreate: {
          copyFiles: [".env", "config/local.json"],
          unknownProperty: "should be ignored",
        },
      };

      const result = validateConfig(config);

      assert.strictEqual(isOk(result), true);
      if (isOk(result)) {
        assert.deepStrictEqual(result.value, config);
      }
    });

    test("should accept copyFiles with empty strings", () => {
      const config = {
        postCreate: {
          copyFiles: ["", " "],
        },
      };

      const result = validateConfig(config);

      assert.strictEqual(isOk(result), true);
      if (isOk(result)) {
        assert.deepStrictEqual(result.value, config);
      }
    });

    test("should accept copyFiles with special characters", () => {
      const config = {
        postCreate: {
          copyFiles: [
            "file-with-dash.txt",
            "file_with_underscore.js",
            "file.with.dots.md",
          ],
        },
      };

      const result = validateConfig(config);

      assert.strictEqual(isOk(result), true);
      if (isOk(result)) {
        assert.deepStrictEqual(result.value, config);
      }
    });
  });
});
