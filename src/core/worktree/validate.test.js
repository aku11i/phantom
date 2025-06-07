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

const { validateWorktreeExists, validateWorktreeDoesNotExist } = await import(
  "./validate.ts"
);

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
