import { deepStrictEqual } from "node:assert";
import { describe, it } from "node:test";
import {
  decodeWorktreeName,
  encodeWorktreeName,
  validateWorktreeName,
} from "./validate.ts";

describe("validateWorktreeName", () => {
  it("should reject empty name", () => {
    const result = validateWorktreeName("");
    deepStrictEqual(result.ok, false);
    deepStrictEqual(result.error?.message, "Phantom name cannot be empty");
  });

  it("should reject whitespace-only name", () => {
    const result = validateWorktreeName("   ");
    deepStrictEqual(result.ok, false);
    deepStrictEqual(result.error?.message, "Phantom name cannot be empty");
  });

  it("should reject name starting with dot", () => {
    const result = validateWorktreeName(".hidden");
    deepStrictEqual(result.ok, false);
    deepStrictEqual(
      result.error?.message,
      "Phantom name cannot start with a dot",
    );
  });

  it("should reject name starting with slash", () => {
    const result = validateWorktreeName("/feature/branch");
    deepStrictEqual(result.ok, false);
    deepStrictEqual(
      result.error?.message,
      "Phantom name cannot start or end with a slash",
    );
  });

  it("should reject name ending with slash", () => {
    const result = validateWorktreeName("feature/branch/");
    deepStrictEqual(result.ok, false);
    deepStrictEqual(
      result.error?.message,
      "Phantom name cannot start or end with a slash",
    );
  });

  it("should reject consecutive slashes", () => {
    const result = validateWorktreeName("feature//branch");
    deepStrictEqual(result.ok, false);
    deepStrictEqual(
      result.error?.message,
      "Phantom name cannot contain consecutive slashes",
    );
  });

  it("should accept valid names without slashes", () => {
    const result = validateWorktreeName("my-feature");
    deepStrictEqual(result.ok, true);
  });

  it("should accept names with single slashes", () => {
    const result = validateWorktreeName("feature/user-authentication");
    deepStrictEqual(result.ok, true);
  });

  it("should accept names with multiple slashes", () => {
    const result = validateWorktreeName("feature/auth/login-page");
    deepStrictEqual(result.ok, true);
  });

  it("should accept common branch naming patterns", () => {
    const validNames = [
      "feature/user-authentication",
      "bugfix/header-layout",
      "release/v2.0.0",
      "hotfix/critical-bug",
      "chore/update-dependencies",
      "docs/readme-update",
    ];

    for (const name of validNames) {
      const result = validateWorktreeName(name);
      deepStrictEqual(result.ok, true, `Should accept "${name}"`);
    }
  });
});

describe("encodeWorktreeName", () => {
  it("should encode slashes to double underscores", () => {
    deepStrictEqual(encodeWorktreeName("feature/branch"), "feature__branch");
  });

  it("should encode multiple slashes", () => {
    deepStrictEqual(
      encodeWorktreeName("feature/auth/login"),
      "feature__auth__login",
    );
  });

  it("should not modify names without slashes", () => {
    deepStrictEqual(encodeWorktreeName("my-feature"), "my-feature");
  });

  it("should handle edge cases", () => {
    deepStrictEqual(encodeWorktreeName("a/b/c/d"), "a__b__c__d");
  });
});

describe("decodeWorktreeName", () => {
  it("should decode double underscores to slashes", () => {
    deepStrictEqual(decodeWorktreeName("feature__branch"), "feature/branch");
  });

  it("should decode multiple double underscores", () => {
    deepStrictEqual(
      decodeWorktreeName("feature__auth__login"),
      "feature/auth/login",
    );
  });

  it("should not modify names without double underscores", () => {
    deepStrictEqual(decodeWorktreeName("my-feature"), "my-feature");
  });

  it("should handle edge cases", () => {
    deepStrictEqual(decodeWorktreeName("a__b__c__d"), "a/b/c/d");
  });

  it("should be inverse of encode", () => {
    const names = [
      "feature/branch",
      "bugfix/header-layout",
      "release/v2.0.0",
      "feature/auth/login",
    ];

    for (const name of names) {
      const encoded = encodeWorktreeName(name);
      const decoded = decodeWorktreeName(encoded);
      deepStrictEqual(
        decoded,
        name,
        `Encode/decode should be inverse for "${name}"`,
      );
    }
  });
});
