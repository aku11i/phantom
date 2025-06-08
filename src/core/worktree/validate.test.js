import { deepStrictEqual } from "node:assert";
import { describe, it, mock } from "node:test";

const accessMock = mock.fn();
const getPhantomDirectoryMock = mock.fn(
  (gitRoot) => `${gitRoot}/.git/phantom/worktrees`,
);
const getWorktreePathMock = mock.fn(
  (gitRoot, name) => `${gitRoot}/.git/phantom/worktrees/${name}`,
);

mock.module("node:fs/promises", {
  namedExports: {
    access: accessMock,
  },
});

mock.module("../paths.ts", {
  namedExports: {
    getPhantomDirectory: getPhantomDirectoryMock,
    getWorktreePath: getWorktreePathMock,
  },
});

const {
  validateWorktreeExists,
  validateWorktreeDoesNotExist,
  validateWorktreeName,
} = await import("./validate.ts");

describe("validateWorktreeExists", () => {
  const resetMocks = () => {
    accessMock.mock.resetCalls();
    getPhantomDirectoryMock.mock.resetCalls();
    getWorktreePathMock.mock.resetCalls();
  };

  it("should return exists true when worktree directory exists", async () => {
    resetMocks();
    accessMock.mock.mockImplementation(() => Promise.resolve());

    const result = await validateWorktreeExists("/test/repo", "my-feature");

    deepStrictEqual(result, {
      exists: true,
      path: "/test/repo/.git/phantom/worktrees/my-feature",
    });
  });

  it("should return exists false when worktree directory does not exist", async () => {
    resetMocks();
    accessMock.mock.mockImplementation(() =>
      Promise.reject(new Error("ENOENT")),
    );

    const result = await validateWorktreeExists("/test/repo", "non-existent");

    deepStrictEqual(result, {
      exists: false,
      message: "Worktree 'non-existent' does not exist",
    });
  });

  it("should return exists false when phantom directory does not exist", async () => {
    resetMocks();
    accessMock.mock.mockImplementation(() =>
      Promise.reject(new Error("ENOENT")),
    );

    const result = await validateWorktreeExists("/test/repo", "any");

    deepStrictEqual(result, {
      exists: false,
      message: "Worktree 'any' does not exist",
    });
  });
});

describe("validateWorktreeDoesNotExist", () => {
  const resetMocks = () => {
    accessMock.mock.resetCalls();
    getPhantomDirectoryMock.mock.resetCalls();
    getWorktreePathMock.mock.resetCalls();
  };

  it("should return exists false when worktree does not exist", async () => {
    resetMocks();
    accessMock.mock.mockImplementation(() =>
      Promise.reject(new Error("ENOENT")),
    );

    const result = await validateWorktreeDoesNotExist(
      "/test/repo",
      "new-feature",
    );

    deepStrictEqual(result, {
      exists: false,
      path: "/test/repo/.git/phantom/worktrees/new-feature",
    });
  });

  it("should return exists true when worktree already exists", async () => {
    resetMocks();
    accessMock.mock.mockImplementation(() => Promise.resolve());

    const result = await validateWorktreeDoesNotExist(
      "/test/repo",
      "existing-feature",
    );

    deepStrictEqual(result, {
      exists: true,
      message: "Worktree 'existing-feature' already exists",
    });
  });

  it("should handle phantom directory not existing", async () => {
    resetMocks();
    accessMock.mock.mockImplementation(() =>
      Promise.reject(new Error("ENOENT")),
    );

    const result = await validateWorktreeDoesNotExist(
      "/test/repo",
      "new-feature",
    );

    deepStrictEqual(result, {
      exists: false,
      path: "/test/repo/.git/phantom/worktrees/new-feature",
    });
  });
});

describe("validateWorktreeName", () => {
  it("should reject empty name", () => {
    const result = validateWorktreeName("");
    deepStrictEqual(result.ok, false);
    deepStrictEqual(result.error.message, "Phantom name cannot be empty");
  });

  it("should reject name with only spaces", () => {
    const result = validateWorktreeName("   ");
    deepStrictEqual(result.ok, false);
    deepStrictEqual(result.error.message, "Phantom name cannot be empty");
  });

  it("should reject name with forward slash", () => {
    const result = validateWorktreeName("feature/branch");
    deepStrictEqual(result.ok, false);
    deepStrictEqual(
      result.error.message,
      "Phantom name cannot contain path separators",
    );
  });

  it("should reject name with backslash", () => {
    const result = validateWorktreeName("feature\\branch");
    deepStrictEqual(result.ok, false);
    deepStrictEqual(
      result.error.message,
      "Phantom name cannot contain path separators",
    );
  });

  it("should reject name with path traversal", () => {
    const result = validateWorktreeName("test/../../../etc/passwd");
    deepStrictEqual(result.ok, false);
    deepStrictEqual(
      result.error.message,
      "Phantom name cannot contain path separators",
    );
  });

  it("should reject name with double dots", () => {
    const result = validateWorktreeName("foo..bar");
    deepStrictEqual(result.ok, false);
    deepStrictEqual(result.error.message, "Phantom name cannot contain '..'");
  });

  it("should reject name with shell special characters", () => {
    const shellChars = [
      ";",
      "&",
      "|",
      "`",
      "$",
      "<",
      ">",
      "(",
      ")",
      "{",
      "}",
      "[",
      "]",
      "!",
      "#",
      "*",
      "?",
      "'",
      '"',
    ];
    for (const char of shellChars) {
      const result = validateWorktreeName(`test${char}name`);
      deepStrictEqual(result.ok, false);
      deepStrictEqual(
        result.error.message,
        "Phantom name contains invalid characters",
      );
    }
  });

  it("should reject Windows reserved names", () => {
    const reservedNames = [
      "CON",
      "PRN",
      "AUX",
      "NUL",
      "COM1",
      "COM9",
      "LPT1",
      "LPT9",
    ];
    for (const name of reservedNames) {
      const result = validateWorktreeName(name);
      deepStrictEqual(result.ok, false);
      deepStrictEqual(
        result.error.message,
        "Phantom name is reserved on Windows",
      );
    }
  });

  it("should reject Windows reserved names case-insensitively", () => {
    const result = validateWorktreeName("con");
    deepStrictEqual(result.ok, false);
    deepStrictEqual(
      result.error.message,
      "Phantom name is reserved on Windows",
    );
  });

  it("should reject names longer than 255 characters", () => {
    const longName = "a".repeat(256);
    const result = validateWorktreeName(longName);
    deepStrictEqual(result.ok, false);
    deepStrictEqual(result.error.message, "Phantom name is too long");
  });

  it("should reject names with spaces", () => {
    const result = validateWorktreeName("my feature branch");
    deepStrictEqual(result.ok, false);
    deepStrictEqual(
      result.error.message,
      "Phantom name can only contain letters, numbers, hyphens, and underscores",
    );
  });

  it("should reject names with special characters not in whitelist", () => {
    const result = validateWorktreeName("feature@branch");
    deepStrictEqual(result.ok, false);
    deepStrictEqual(
      result.error.message,
      "Phantom name can only contain letters, numbers, hyphens, and underscores",
    );
  });

  it("should accept valid names", () => {
    const validNames = [
      "feature-branch",
      "feature_branch",
      "feature123",
      "FEATURE",
      "123feature",
      "a",
      "A",
      "0",
      "-",
      "_",
      "feature-123_test",
    ];
    for (const name of validNames) {
      const result = validateWorktreeName(name);
      deepStrictEqual(result.ok, true);
      deepStrictEqual(result.value, undefined);
    }
  });

  it("should accept names up to 255 characters", () => {
    const maxLengthName = "a".repeat(255);
    const result = validateWorktreeName(maxLengthName);
    deepStrictEqual(result.ok, true);
    deepStrictEqual(result.value, undefined);
  });
});
