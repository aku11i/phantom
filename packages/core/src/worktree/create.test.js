import { deepStrictEqual, strictEqual } from "node:assert";
import { describe, it, mock } from "node:test";
import { err, isErr, isOk, ok } from "@aku11i/phantom-shared";
import { WorktreeAlreadyExistsError, WorktreeError } from "./errors.ts";

const accessMock = mock.fn();
const mkdirMock = mock.fn();
const validateWorktreeDoesNotExistMock = mock.fn();
const validateWorktreeNameMock = mock.fn();
const addWorktreeMock = mock.fn();
const getPhantomDirectoryMock = mock.fn((gitRoot, basePath) => {
  if (basePath) {
    // Simulate node.js path.join behavior for resolving relative paths
    if (basePath.startsWith("/")) {
      return basePath;
    }
    // For relative paths like "../phantom-external", resolve them correctly
    if (basePath === "../phantom-external") {
      return "/test/phantom-external";
    }
    return `${gitRoot}/${basePath}`;
  }
  return `${gitRoot}/.git/phantom/worktrees`;
});
const getWorktreePathMock = mock.fn((gitRoot, name, basePath) => {
  if (basePath) {
    if (basePath.startsWith("/")) {
      return `${basePath}/${name}`;
    }
    if (basePath === "../phantom-external") {
      return `/test/phantom-external/${name}`;
    }
    return `${gitRoot}/${basePath}/${name}`;
  }
  return `${gitRoot}/.git/phantom/worktrees/${name}`;
});
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

mock.module("@aku11i/phantom-git", {
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
    const result = await createWorktree("/test/repo", "feature-branch", {
      basePath: undefined,
    });

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
    strictEqual(worktreeOptions.base, "HEAD");
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
    await createWorktree("/test/repo", "new-feature", {
      basePath: undefined,
    });

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
    const result = await createWorktree("/test/repo", "existing", {
      basePath: undefined,
    });

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
      base: "main",
    });

    const worktreeOptions2 = addWorktreeMock.mock.calls[0].arguments[0];
    strictEqual(worktreeOptions2.branch, "custom-branch");
    strictEqual(worktreeOptions2.base, "main");
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
    const result = await createWorktree("/test/repo", "bad-branch", {
      basePath: undefined,
    });

    strictEqual(isErr(result), true);
    if (isErr(result)) {
      strictEqual(result.error instanceof WorktreeError, true);
      strictEqual(
        result.error.message,
        "worktree add failed: fatal: branch already exists",
      );
    }
  });

  describe("with basePath", () => {
    it("should create worktree with relative basePath", async () => {
      resetMocks();
      accessMock.mock.mockImplementation(() => Promise.resolve());
      mkdirMock.mock.mockImplementation(() => Promise.resolve());
      validateWorktreeNameMock.mock.mockImplementation(() => ok(undefined));
      validateWorktreeDoesNotExistMock.mock.mockImplementation(() =>
        Promise.resolve(
          ok({
            path: getWorktreePathMock(
              "/test/repo",
              "feature-branch",
              "../phantom-external",
            ),
          }),
        ),
      );
      addWorktreeMock.mock.mockImplementation(() => Promise.resolve());

      const result = await createWorktree("/test/repo", "feature-branch", {
        basePath: "../phantom-external",
      });

      strictEqual(isOk(result), true);
      if (isOk(result)) {
        deepStrictEqual(result.value, {
          message:
            "Created worktree 'feature-branch' at /test/phantom-external/feature-branch",
          path: "/test/phantom-external/feature-branch",
          copiedFiles: undefined,
          skippedFiles: undefined,
          copyError: undefined,
        });
      }

      strictEqual(getPhantomDirectoryMock.mock.callCount(), 1);
      deepStrictEqual(getPhantomDirectoryMock.mock.calls[0].arguments, [
        "/test/repo",
        "../phantom-external",
      ]);

      strictEqual(getWorktreePathMock.mock.callCount(), 2);
      deepStrictEqual(getWorktreePathMock.mock.calls[0].arguments, [
        "/test/repo",
        "feature-branch",
        "../phantom-external",
      ]);
    });

    it("should create worktree with absolute basePath", async () => {
      resetMocks();
      accessMock.mock.mockImplementation(() => Promise.resolve());
      mkdirMock.mock.mockImplementation(() => Promise.resolve());
      validateWorktreeNameMock.mock.mockImplementation(() => ok(undefined));
      validateWorktreeDoesNotExistMock.mock.mockImplementation(() =>
        Promise.resolve(
          ok({
            path: getWorktreePathMock(
              "/test/repo",
              "feature-branch",
              "/tmp/phantom-worktrees",
            ),
          }),
        ),
      );
      addWorktreeMock.mock.mockImplementation(() => Promise.resolve());

      const result = await createWorktree("/test/repo", "feature-branch", {
        basePath: "/tmp/phantom-worktrees",
      });

      strictEqual(isOk(result), true);
      if (isOk(result)) {
        deepStrictEqual(result.value, {
          message:
            "Created worktree 'feature-branch' at /tmp/phantom-worktrees/feature-branch",
          path: "/tmp/phantom-worktrees/feature-branch",
          copiedFiles: undefined,
          skippedFiles: undefined,
          copyError: undefined,
        });
      }

      strictEqual(getPhantomDirectoryMock.mock.callCount(), 1);
      deepStrictEqual(getPhantomDirectoryMock.mock.calls[0].arguments, [
        "/test/repo",
        "/tmp/phantom-worktrees",
      ]);
    });

    it("should pass basePath to validateWorktreeDoesNotExist", async () => {
      resetMocks();
      accessMock.mock.mockImplementation(() => Promise.resolve());
      mkdirMock.mock.mockImplementation(() => Promise.resolve());
      validateWorktreeNameMock.mock.mockImplementation(() => ok(undefined));
      validateWorktreeDoesNotExistMock.mock.mockImplementation(() =>
        Promise.resolve(
          ok({
            path: getWorktreePathMock(
              "/test/repo",
              "feature-branch",
              "../phantom-external",
            ),
          }),
        ),
      );
      addWorktreeMock.mock.mockImplementation(() => Promise.resolve());

      await createWorktree("/test/repo", "feature-branch", {
        basePath: "../phantom-external",
      });

      strictEqual(validateWorktreeDoesNotExistMock.mock.callCount(), 1);
      deepStrictEqual(
        validateWorktreeDoesNotExistMock.mock.calls[0].arguments,
        ["/test/repo", "feature-branch", "../phantom-external"],
      );
    });
  });
});
