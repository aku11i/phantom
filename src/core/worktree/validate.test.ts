import { deepStrictEqual } from "node:assert";
import { describe, it } from "node:test";

describe("validateWorktreeExists", () => {
  it("should return exists true when worktree directory exists", async (t) => {
    const readdirMock = t.mock.fn(() =>
      Promise.resolve(["my-feature", "other-feature"]),
    );
    const statMock = t.mock.fn(() =>
      Promise.resolve({ isDirectory: () => true }),
    );

    t.mock.module("node:fs/promises", {
      namedExports: {
        readdir: readdirMock,
        stat: statMock,
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

    const { validateWorktreeExists } = await import("./validate.ts");
    const result = await validateWorktreeExists("/test/repo", "my-feature");

    deepStrictEqual(result, {
      exists: true,
      path: "/test/repo/.git/phantom/worktrees/my-feature",
    });
  });

  it("should return exists false when worktree directory does not exist", async (t) => {
    const readdirMock = t.mock.fn(() => Promise.resolve(["other-feature"]));

    t.mock.module("node:fs/promises", {
      namedExports: {
        readdir: readdirMock,
        stat: t.mock.fn(),
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

    const { validateWorktreeExists } = await import("./validate.ts");
    const result = await validateWorktreeExists("/test/repo", "non-existent");

    deepStrictEqual(result, {
      exists: false,
      message: "Worktree 'non-existent' not found",
    });
  });

  it("should return exists false when phantom directory does not exist", async (t) => {
    const readdirMock = t.mock.fn(() => Promise.reject(new Error("ENOENT")));

    t.mock.module("node:fs/promises", {
      namedExports: {
        readdir: readdirMock,
        stat: t.mock.fn(),
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

    const { validateWorktreeExists } = await import("./validate.ts");
    const result = await validateWorktreeExists("/test/repo", "any");

    deepStrictEqual(result, {
      exists: false,
      message: "Worktree 'any' not found",
    });
  });
});

describe("validateWorktreeDoesNotExist", () => {
  it("should return exists false when worktree does not exist", async (t) => {
    const readdirMock = t.mock.fn(() => Promise.resolve(["other-feature"]));

    t.mock.module("node:fs/promises", {
      namedExports: {
        readdir: readdirMock,
      },
    });

    t.mock.module("../paths.ts", {
      namedExports: {
        getPhantomDirectory: t.mock.fn(
          (gitRoot: string) => `${gitRoot}/.git/phantom/worktrees`,
        ),
      },
    });

    const { validateWorktreeDoesNotExist } = await import("./validate.ts");
    const result = await validateWorktreeDoesNotExist(
      "/test/repo",
      "new-feature",
    );

    deepStrictEqual(result, {
      exists: false,
    });
  });

  it("should return exists true when worktree already exists", async (t) => {
    const readdirMock = t.mock.fn(() =>
      Promise.resolve(["existing-feature", "other-feature"]),
    );

    t.mock.module("node:fs/promises", {
      namedExports: {
        readdir: readdirMock,
      },
    });

    t.mock.module("../paths.ts", {
      namedExports: {
        getPhantomDirectory: t.mock.fn(
          (gitRoot: string) => `${gitRoot}/.git/phantom/worktrees`,
        ),
      },
    });

    const { validateWorktreeDoesNotExist } = await import("./validate.ts");
    const result = await validateWorktreeDoesNotExist(
      "/test/repo",
      "existing-feature",
    );

    deepStrictEqual(result, {
      exists: true,
      message: "Worktree 'existing-feature' already exists",
    });
  });

  it("should handle phantom directory not existing", async (t) => {
    const readdirMock = t.mock.fn(() => Promise.reject(new Error("ENOENT")));

    t.mock.module("node:fs/promises", {
      namedExports: {
        readdir: readdirMock,
      },
    });

    t.mock.module("../paths.ts", {
      namedExports: {
        getPhantomDirectory: t.mock.fn(
          (gitRoot: string) => `${gitRoot}/.git/phantom/worktrees`,
        ),
      },
    });

    const { validateWorktreeDoesNotExist } = await import("./validate.ts");
    const result = await validateWorktreeDoesNotExist(
      "/test/repo",
      "new-feature",
    );

    deepStrictEqual(result, {
      exists: false,
    });
  });
});
