import { deepStrictEqual, strictEqual } from "node:assert";
import { describe, it } from "node:test";
import type { AddWorktreeOptions } from "../git/libs/add-worktree.ts";
import { err, isErr, isOk, ok } from "../types/result.ts";
import { GitOperationError, WorktreeAlreadyExistsError } from "./errors.ts";

describe("createWorktree", () => {
  it("should create worktree successfully", async (t) => {
    const accessMock = t.mock.fn(() => Promise.resolve());
    const mkdirMock = t.mock.fn(() => Promise.resolve());
    const validateMock = t.mock.fn(() => Promise.resolve({ exists: false }));
    const addWorktreeMock = t.mock.fn(() => Promise.resolve());

    t.mock.module("node:fs/promises", {
      namedExports: {
        access: accessMock,
        mkdir: mkdirMock,
      },
    });

    t.mock.module("./validate.ts", {
      namedExports: {
        validateWorktreeDoesNotExist: validateMock,
        validateWorktreeName: t.mock.fn(() => ok(undefined)),
      },
    });

    t.mock.module("../git/libs/add-worktree.ts", {
      namedExports: {
        addWorktree: addWorktreeMock,
      },
    });

    t.mock.module("../paths.ts", {
      namedExports: {
        getPhantomDirectory: t.mock.fn(
          (gitRoot: string) => `${gitRoot}/.git/phantom/worktrees`,
        ),
        getWorktreePath: t.mock.fn(
          (gitRoot: string, name: string) =>
            `${gitRoot}/.git/phantom/worktrees/${name}`,
        ),
      },
    });

    const { createWorktree } = await import("./create.ts");
    const result = await createWorktree("/test/repo", "feature-branch");

    strictEqual(isOk(result), true);
    if (isOk(result)) {
      deepStrictEqual(result.value, {
        message:
          "Created worktree 'feature-branch' at /test/repo/.git/phantom/worktrees/feature-branch",
        path: "/test/repo/.git/phantom/worktrees/feature-branch",
      });
    }

    const worktreeOptions = (addWorktreeMock.mock.calls[0] as any)
      ?.arguments[0] as AddWorktreeOptions;
    strictEqual(
      worktreeOptions.path,
      "/test/repo/.git/phantom/worktrees/feature-branch",
    );
    strictEqual(worktreeOptions.branch, "feature-branch");
    strictEqual(worktreeOptions.commitish, "HEAD");
  });

  it("should create worktrees directory if it doesn't exist", async (t) => {
    const accessMock = t.mock.fn(() => Promise.reject(new Error("ENOENT")));
    const mkdirMock = t.mock.fn(() => Promise.resolve());
    const validateMock = t.mock.fn(() => Promise.resolve({ exists: false }));
    const addWorktreeMock = t.mock.fn(() => Promise.resolve());

    t.mock.module("node:fs/promises", {
      namedExports: {
        access: accessMock,
        mkdir: mkdirMock,
      },
    });

    t.mock.module("./validate.ts", {
      namedExports: {
        validateWorktreeDoesNotExist: validateMock,
        validateWorktreeName: t.mock.fn(() => ok(undefined)),
      },
    });

    t.mock.module("../git/libs/add-worktree.ts", {
      namedExports: {
        addWorktree: addWorktreeMock,
      },
    });

    t.mock.module("../paths.ts", {
      namedExports: {
        getPhantomDirectory: t.mock.fn(
          (gitRoot: string) => `${gitRoot}/.git/phantom/worktrees`,
        ),
        getWorktreePath: t.mock.fn(
          (gitRoot: string, name: string) =>
            `${gitRoot}/.git/phantom/worktrees/${name}`,
        ),
      },
    });

    const { createWorktree } = await import("./create.ts");
    await createWorktree("/test/repo", "new-feature");

    strictEqual(mkdirMock.mock.calls.length, 1);
    deepStrictEqual((mkdirMock.mock.calls[0] as any)?.arguments, [
      "/test/repo/.git/phantom/worktrees",
      { recursive: true },
    ]);
  });

  it("should return error when worktree already exists", async (t) => {
    const accessMock = t.mock.fn(() => Promise.resolve());
    const validateMock = t.mock.fn(() =>
      Promise.resolve({
        exists: true,
        message: "Worktree 'existing' already exists",
      }),
    );

    t.mock.module("node:fs/promises", {
      namedExports: {
        access: accessMock,
      },
    });

    t.mock.module("./validate.ts", {
      namedExports: {
        validateWorktreeDoesNotExist: validateMock,
        validateWorktreeName: t.mock.fn(() => ok(undefined)),
      },
    });

    t.mock.module("../paths.ts", {
      namedExports: {
        getPhantomDirectory: t.mock.fn(
          (gitRoot: string) => `${gitRoot}/.git/phantom/worktrees`,
        ),
        getWorktreePath: t.mock.fn(
          (gitRoot: string, name: string) =>
            `${gitRoot}/.git/phantom/worktrees/${name}`,
        ),
      },
    });

    const { createWorktree } = await import("./create.ts");
    const result = await createWorktree("/test/repo", "existing");

    strictEqual(isErr(result), true);
    if (isErr(result)) {
      strictEqual(result.error instanceof WorktreeAlreadyExistsError, true);
      strictEqual(result.error.message, "Worktree 'existing' already exists");
    }
  });

  it("should use custom branch and commitish when provided", async (t) => {
    const accessMock = t.mock.fn(() => Promise.resolve());
    const validateMock = t.mock.fn(() => Promise.resolve({ exists: false }));
    const addWorktreeMock = t.mock.fn(() => Promise.resolve());

    t.mock.module("node:fs/promises", {
      namedExports: {
        access: accessMock,
      },
    });

    t.mock.module("./validate.ts", {
      namedExports: {
        validateWorktreeDoesNotExist: validateMock,
        validateWorktreeName: t.mock.fn(() => ok(undefined)),
      },
    });

    t.mock.module("../git/libs/add-worktree.ts", {
      namedExports: {
        addWorktree: addWorktreeMock,
      },
    });

    t.mock.module("../paths.ts", {
      namedExports: {
        getPhantomDirectory: t.mock.fn(
          (gitRoot: string) => `${gitRoot}/.git/phantom/worktrees`,
        ),
        getWorktreePath: t.mock.fn(
          (gitRoot: string, name: string) =>
            `${gitRoot}/.git/phantom/worktrees/${name}`,
        ),
      },
    });

    const { createWorktree } = await import("./create.ts");
    await createWorktree("/test/repo", "feature", {
      branch: "custom-branch",
      commitish: "main",
    });

    const worktreeOptions2 = (addWorktreeMock.mock.calls[0] as any)
      ?.arguments[0] as AddWorktreeOptions;
    strictEqual(worktreeOptions2.branch, "custom-branch");
    strictEqual(worktreeOptions2.commitish, "main");
  });

  it("should return error when git worktree add fails", async (t) => {
    const accessMock = t.mock.fn(() => Promise.resolve());
    const validateMock = t.mock.fn(() => Promise.resolve({ exists: false }));
    const addWorktreeMock = t.mock.fn(() =>
      Promise.reject(new Error("fatal: branch already exists")),
    );

    t.mock.module("node:fs/promises", {
      namedExports: {
        access: accessMock,
      },
    });

    t.mock.module("./validate.ts", {
      namedExports: {
        validateWorktreeDoesNotExist: validateMock,
        validateWorktreeName: t.mock.fn(() => ok(undefined)),
      },
    });

    t.mock.module("../git/libs/add-worktree.ts", {
      namedExports: {
        addWorktree: addWorktreeMock,
      },
    });

    t.mock.module("../paths.ts", {
      namedExports: {
        getPhantomDirectory: t.mock.fn(
          (gitRoot: string) => `${gitRoot}/.git/phantom/worktrees`,
        ),
        getWorktreePath: t.mock.fn(
          (gitRoot: string, name: string) =>
            `${gitRoot}/.git/phantom/worktrees/${name}`,
        ),
      },
    });

    const { createWorktree } = await import("./create.ts");
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
