import { deepStrictEqual } from "node:assert";
import { describe, it, mock } from "node:test";

describe("validateWorktreeExists", () => {
  let readdirMock: ReturnType<typeof mock.fn>;
  let statMock: ReturnType<typeof mock.fn>;

  it("should return exists true when worktree directory exists", async () => {
    readdirMock = mock.fn(() =>
      Promise.resolve(["my-feature", "other-feature"]),
    );
    statMock = mock.fn(() => Promise.resolve({ isDirectory: () => true }));

    mock.module("node:fs/promises", {
      namedExports: {
        readdir: readdirMock,
        stat: statMock,
      },
    });

    mock.module("../paths.ts", {
      namedExports: {
        getPhantomDirectory: mock.fn(
          (gitRoot: string) => `${gitRoot}/.git/phantom/worktrees`,
        ),
        getWorktreePath: mock.fn(
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

  it("should return exists false when worktree directory does not exist", async () => {
    readdirMock = mock.fn(() => Promise.resolve(["other-feature"]));

    mock.module("node:fs/promises", {
      namedExports: {
        readdir: readdirMock,
        stat: statMock,
      },
    });

    mock.module("../paths.ts", {
      namedExports: {
        getPhantomDirectory: mock.fn(
          (gitRoot: string) => `${gitRoot}/.git/phantom/worktrees`,
        ),
        getWorktreePath: mock.fn(
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

  it("should return exists false when phantom directory does not exist", async () => {
    readdirMock = mock.fn(() => Promise.reject(new Error("ENOENT")));

    mock.module("node:fs/promises", {
      namedExports: {
        readdir: readdirMock,
        stat: statMock,
      },
    });

    mock.module("../paths.ts", {
      namedExports: {
        getPhantomDirectory: mock.fn(
          (gitRoot: string) => `${gitRoot}/.git/phantom/worktrees`,
        ),
        getWorktreePath: mock.fn(
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
  let readdirMock: ReturnType<typeof mock.fn>;

  it("should return exists false when worktree does not exist", async () => {
    readdirMock = mock.fn(() => Promise.resolve(["other-feature"]));

    mock.module("node:fs/promises", {
      namedExports: {
        readdir: readdirMock,
      },
    });

    mock.module("../paths.ts", {
      namedExports: {
        getPhantomDirectory: mock.fn(
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

  it("should return exists true when worktree already exists", async () => {
    readdirMock = mock.fn(() =>
      Promise.resolve(["existing-feature", "other-feature"]),
    );

    mock.module("node:fs/promises", {
      namedExports: {
        readdir: readdirMock,
      },
    });

    mock.module("../paths.ts", {
      namedExports: {
        getPhantomDirectory: mock.fn(
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

  it("should handle phantom directory not existing", async () => {
    readdirMock = mock.fn(() => Promise.reject(new Error("ENOENT")));

    mock.module("node:fs/promises", {
      namedExports: {
        readdir: readdirMock,
      },
    });

    mock.module("../paths.ts", {
      namedExports: {
        getPhantomDirectory: mock.fn(
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
