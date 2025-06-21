import assert from "node:assert";
import { describe, test } from "node:test";
import { isErr, isOk } from "@aku11i/phantom-shared";
import { PreferencesValidationError, validatePreferences } from "./validate.ts";

describe("validatePreferences", () => {
  test("should validate empty object", () => {
    const result = validatePreferences({});

    assert.strictEqual(isOk(result), true);
    if (isOk(result)) {
      assert.deepStrictEqual(result.value, {});
    }
  });

  test("should validate object with worktreesDirectory", () => {
    const preferences = { worktreesDirectory: "/path/to/worktrees" };
    const result = validatePreferences(preferences);

    assert.strictEqual(isOk(result), true);
    if (isOk(result)) {
      assert.deepStrictEqual(result.value, preferences);
    }
  });

  test("should validate object with additional properties (passthrough)", () => {
    const preferences = {
      worktreesDirectory: "/path/to/worktrees",
      futureOption: "someValue",
    };
    const result = validatePreferences(preferences);

    assert.strictEqual(isOk(result), true);
    if (isOk(result)) {
      assert.deepStrictEqual(result.value, preferences);
    }
  });

  test("should reject non-object types", () => {
    const testCases = [
      { input: "string", expected: "Expected object, received string" },
      { input: 123, expected: "Expected object, received number" },
      { input: true, expected: "Expected object, received boolean" },
      { input: null, expected: "Expected object, received null" },
      { input: [], expected: "Expected object, received array" },
    ];

    for (const { input, expected } of testCases) {
      const result = validatePreferences(input);

      assert.strictEqual(isErr(result), true);
      if (isErr(result)) {
        assert.ok(result.error instanceof PreferencesValidationError);
        assert.strictEqual(
          result.error.message,
          `Invalid phantom.json: ${expected}`,
        );
      }
    }
  });

  test("should reject invalid worktreesDirectory types", () => {
    const testCases = [
      { worktreesDirectory: 123 },
      { worktreesDirectory: true },
      { worktreesDirectory: [] },
      { worktreesDirectory: {} },
    ];

    for (const input of testCases) {
      const result = validatePreferences(input);

      assert.strictEqual(isErr(result), true);
      if (isErr(result)) {
        assert.ok(result.error instanceof PreferencesValidationError);
        assert.ok(result.error.message.includes("worktreesDirectory"));
      }
    }
  });
});
