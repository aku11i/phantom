import { deepStrictEqual, strictEqual } from "node:assert";
import { describe, it, mock } from "node:test";
import { err, isErr, isOk, ok } from "../types/result.ts";
import { GitOperationError, WorktreeAlreadyExistsError } from "./errors.ts";

const accessMock = mock.fn();
const mkdirMock = mock.fn();
const validateWorktreeDoesNotExistMock = mock.fn();
const validateWorktreeNameMock = mock.fn();
const addWorktreeMock = mock.fn();
const getPhantomDirectoryMock = mock.fn(
  (gitRoot) => `${gitRoot}/.git/phantom/worktrees`,
);
const getWorktreePathMock = mock.fn(
  (gitRoot, name) => `${gitRoot}/.git/phantom/worktrees/${name}`,
);
const copyFilesMock = mock.fn();

mock.module("node:fs/promises", {
  namedExports: {
    access: accessMock,
    mkdir: mkdirMock,
  },
});

mock.module("./validate.ts", {
  namedExports: {
    validateWorktreeDoesNotExist: validateWorktreeDoesNotExistMock,
    validateWorktreeName: validateWorktreeNameMock,
  },
});

mock.module("../git/libs/add-worktree.ts", {
  namedExports: {
    addWorktree: addWorktreeMock,
  },
});

mock.module("../paths.ts", {
  namedExports: {
    getPhantomDirectory: getPhantomDirectoryMock,
    getWorktreePath: getWorktreePathMock,
  },
});

mock.module("./file-copier.ts", {
  namedExports: {
    copyFiles: copyFilesMock,
  },
});

const { createWorktree } = await import("./create.ts");

describe("createWorktree", () => {
  const resetMocks = () => {
    accessMock.mock.resetCalls();
    mkdirMock.mock.resetCalls();
    validateWorktreeDoesNotExistMock.mock.resetCalls();
    validateWorktreeNameMock.mock.resetCalls();
    addWorktreeMock.mock.resetCalls();
    getPhantomDirectoryMock.mock.resetCalls();
    getWorktreePathMock.mock.resetCalls();
    copyFilesMock.mock.resetCalls();
  };

  it("should create worktree successfully", async () => {
    resetMocks();
    accessMock.mock.mockImplementation(() => Promise.resolve());
    mkdirMock.mock.mockImplementation(() => Promise.resolve());
    validateWorktreeNameMock.mock.mockImplementation(() => ok(undefined));
    validateWorktreeDoesNotExistMock.mock.mockImplementation(() =>
      Promise.resolve(
        ok({ path: getWorktreePathMock("/test/repo", "feature-branch") }),
      ),
    );
    addWorktreeMock.mock.mockImplementation(() => Promise.resolve());
    const result = await createWorktree("/test/repo", "feature-branch");

    strictEqual(isOk(result), true);
    if (isOk(result)) {
      deepStrictEqual(result.value, {
        message:
          "Created worktree 'feature-branch' at /test/repo/.git/phantom/worktrees/feature-branch",
        path: "/test/repo/.git/phantom/worktrees/feature-branch",
        copiedFiles: undefined,
        skippedFiles: undefined,
        copyError: undefined,
      });
    }

    const worktreeOptions = addWorktreeMock.mock.calls[0].arguments[0];
    strictEqual(
      worktreeOptions.path,
      "/test/repo/.git/phantom/worktrees/feature-branch",
    );
    strictEqual(worktreeOptions.branch, "feature-branch");
    strictEqual(worktreeOptions.commitish, "HEAD");
  });

  it("should create worktrees directory if it doesn't exist", async () => {
    resetMocks();
    accessMock.mock.mockImplementation(() =>
      Promise.reject(new Error("ENOENT")),
    );
    mkdirMock.mock.mockImplementation(() => Promise.resolve());
    validateWorktreeNameMock.mock.mockImplementation(() => ok(undefined));
    validateWorktreeDoesNotExistMock.mock.mockImplementation(() =>
      Promise.resolve(
        ok({ path: getWorktreePathMock("/test/repo", "feature-branch") }),
      ),
    );
    addWorktreeMock.mock.mockImplementation(() => Promise.resolve());
    await createWorktree("/test/repo", "new-feature");

    strictEqual(mkdirMock.mock.calls.length, 1);
    deepStrictEqual(mkdirMock.mock.calls[0].arguments, [
      "/test/repo/.git/phantom/worktrees",
      { recursive: true },
    ]);
  });

  it("should return error when worktree already exists", async () => {
    resetMocks();
    accessMock.mock.mockImplementation(() => Promise.resolve());
    validateWorktreeNameMock.mock.mockImplementation(() => ok(undefined));
    validateWorktreeDoesNotExistMock.mock.mockImplementation(() =>
      Promise.resolve(err(new WorktreeAlreadyExistsError("existing"))),
    );
    const result = await createWorktree("/test/repo", "existing");

    strictEqual(isErr(result), true);
    if (isErr(result)) {
      strictEqual(result.error instanceof WorktreeAlreadyExistsError, true);
      strictEqual(result.error.message, "Worktree 'existing' already exists");
    }
  });

  it("should use custom branch and commitish when provided", async () => {
    resetMocks();
    accessMock.mock.mockImplementation(() => Promise.resolve());
    validateWorktreeNameMock.mock.mockImplementation(() => ok(undefined));
    validateWorktreeDoesNotExistMock.mock.mockImplementation(() =>
      Promise.resolve(
        ok({ path: getWorktreePathMock("/test/repo", "feature-branch") }),
      ),
    );
    addWorktreeMock.mock.mockImplementation(() => Promise.resolve());
    await createWorktree("/test/repo", "feature", {
      branch: "custom-branch",
      commitish: "main",
    });

    const worktreeOptions2 = addWorktreeMock.mock.calls[0].arguments[0];
    strictEqual(worktreeOptions2.branch, "custom-branch");
    strictEqual(worktreeOptions2.commitish, "main");
  });

  it("should return error when git worktree add fails", async () => {
    resetMocks();
    accessMock.mock.mockImplementation(() => Promise.resolve());
    validateWorktreeNameMock.mock.mockImplementation(() => ok(undefined));
    validateWorktreeDoesNotExistMock.mock.mockImplementation(() =>
      Promise.resolve(
        ok({ path: getWorktreePathMock("/test/repo", "feature-branch") }),
      ),
    );
    addWorktreeMock.mock.mockImplementation(() =>
      Promise.reject(new Error("fatal: branch already exists")),
    );
    const result = await createWorktree("/test/repo", "bad-branch");

    strictEqual(isErr(result), true);
    if (isErr(result)) {
      strictEqual(result.error instanceof GitOperationError, true);
      strictEqual(
        result.error.message,
        "Git worktree add failed: fatal: branch already exists",
      );
    }
  });
});
