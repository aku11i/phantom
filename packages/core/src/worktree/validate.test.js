import { deepStrictEqual } from "node:assert";
import { describe, it, mock } from "node:test";

const accessMock = mock.fn();
const getWorktreeDirectoryMock = mock.fn((gitRoot, worktreeBaseDirectory) => {
  if (worktreeBaseDirectory) {
    if (worktreeBaseDirectory.startsWith("/")) {
      return worktreeBaseDirectory;
    }
    return `${gitRoot}/${worktreeBaseDirectory}`;
  }
  return `${gitRoot}/.git/phantom/worktrees`;
});
const getWorktreePathMock = mock.fn((gitRoot, name, worktreeBaseDirectory) => {
  if (worktreeBaseDirectory) {
    if (worktreeBaseDirectory.startsWith("/")) {
      return `${worktreeBaseDirectory}/${name}`;
    }
    return `${gitRoot}/${worktreeBaseDirectory}/${name}`;
  }
  return `${gitRoot}/.git/phantom/worktrees/${name}`;
});

const getWorktreePathFromDirectoryMock = mock.fn((worktreeDirectory, name) => {
  return `${worktreeDirectory}/${name}`;
});

mock.module("node:fs/promises", {
  namedExports: {
    access: accessMock,
  },
});

mock.module("../paths.ts", {
  namedExports: {
    getWorktreeDirectory: getWorktreeDirectoryMock,
    getWorktreePath: getWorktreePathMock,
    getWorktreePathFromDirectory: getWorktreePathFromDirectoryMock,
  },
});

const { validateWorktreeExists, validateWorktreeDoesNotExist } = await import(
  "./validate.ts"
);
const { isOk, isErr } = await import("@aku11i/phantom-shared");

describe("validateWorktreeExists", () => {
  const resetMocks = () => {
    accessMock.mock.resetCalls();
    getWorktreeDirectoryMock.mock.resetCalls();
    getWorktreePathMock.mock.resetCalls();
    getWorktreePathFromDirectoryMock.mock.resetCalls();
  };

  it("should return ok when worktree directory exists", async () => {
    resetMocks();
    accessMock.mock.mockImplementation(() => Promise.resolve());

    const result = await validateWorktreeExists(
      "/test/repo",
      "/test/repo/.git/phantom/worktrees",
      "my-feature",
    );

    deepStrictEqual(isOk(result), true);
    deepStrictEqual(result.value, {
      path: "/test/repo/.git/phantom/worktrees/my-feature",
    });
  });

  it("should return err when worktree directory does not exist", async () => {
    resetMocks();
    accessMock.mock.mockImplementation(() =>
      Promise.reject(new Error("ENOENT")),
    );

    const result = await validateWorktreeExists(
      "/test/repo",
      "/test/repo/.git/phantom/worktrees",
      "non-existent",
    );

    deepStrictEqual(isErr(result), true);
    deepStrictEqual(result.error.message, "Worktree 'non-existent' not found");
  });

  it("should return err when phantom directory does not exist", async () => {
    resetMocks();
    accessMock.mock.mockImplementation(() =>
      Promise.reject(new Error("ENOENT")),
    );

    const result = await validateWorktreeExists(
      "/test/repo",
      "/test/repo/.git/phantom/worktrees",
      "any",
    );

    deepStrictEqual(isErr(result), true);
    deepStrictEqual(result.error.message, "Worktree 'any' not found");
  });
});

describe("validateWorktreeDoesNotExist", () => {
  const resetMocks = () => {
    accessMock.mock.resetCalls();
    getWorktreeDirectoryMock.mock.resetCalls();
    getWorktreePathMock.mock.resetCalls();
    getWorktreePathFromDirectoryMock.mock.resetCalls();
  };

  it("should return ok when worktree does not exist", async () => {
    resetMocks();
    accessMock.mock.mockImplementation(() =>
      Promise.reject(new Error("ENOENT")),
    );

    const result = await validateWorktreeDoesNotExist(
      "/test/repo",
      "/test/repo/.git/phantom/worktrees",
      "new-feature",
    );

    deepStrictEqual(isOk(result), true);
    deepStrictEqual(result.value, {
      path: "/test/repo/.git/phantom/worktrees/new-feature",
    });
  });

  it("should return err when worktree already exists", async () => {
    resetMocks();
    accessMock.mock.mockImplementation(() => Promise.resolve());

    const result = await validateWorktreeDoesNotExist(
      "/test/repo",
      "/test/repo/.git/phantom/worktrees",
      "existing-feature",
    );

    deepStrictEqual(isErr(result), true);
    deepStrictEqual(
      result.error.message,
      "Worktree 'existing-feature' already exists",
    );
  });

  it("should handle phantom directory not existing", async () => {
    resetMocks();
    accessMock.mock.mockImplementation(() =>
      Promise.reject(new Error("ENOENT")),
    );

    const result = await validateWorktreeDoesNotExist(
      "/test/repo",
      "/test/repo/.git/phantom/worktrees",
      "new-feature",
    );

    deepStrictEqual(isOk(result), true);
    deepStrictEqual(result.value, {
      path: "/test/repo/.git/phantom/worktrees/new-feature",
    });
  });
});
