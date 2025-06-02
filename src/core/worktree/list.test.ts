import { deepStrictEqual } from "node:assert";
import { describe, it, mock } from "node:test";

describe("listWorktrees", () => {
  let readdirMock: ReturnType<typeof mock.fn>;
  let statMock: ReturnType<typeof mock.fn>;
  let execMock: ReturnType<typeof mock.fn>;

  it("should return empty array when worktrees directory doesn't exist", async () => {
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

    const { listWorktrees } = await import("./list.ts");
    const result = await listWorktrees("/test/repo");

    deepStrictEqual(result, []);
  });

  it("should return empty array when worktrees directory is empty", async () => {
    readdirMock = mock.fn(() => Promise.resolve([]));

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

    const { listWorktrees } = await import("./list.ts");
    const result = await listWorktrees("/test/repo");

    deepStrictEqual(result, []);
  });

  it("should list worktrees with clean status", async () => {
    readdirMock = mock.fn(() => Promise.resolve(["feature-1", "feature-2"]));
    statMock = mock.fn(() => Promise.resolve({ isDirectory: () => true }));
    execMock = mock.fn((cmd: string) => {
      if (cmd.includes("git -C") && cmd.includes("status --porcelain")) {
        return Promise.resolve({ stdout: "", stderr: "" });
      }
      if (cmd.includes("git -C") && cmd.includes("branch --show-current")) {
        if (cmd.includes("feature-1")) {
          return Promise.resolve({ stdout: "feature-1\n", stderr: "" });
        }
        return Promise.resolve({ stdout: "feature-2\n", stderr: "" });
      }
      return Promise.resolve({ stdout: "", stderr: "" });
    });

    mock.module("node:fs/promises", {
      namedExports: {
        readdir: readdirMock,
        stat: statMock,
      },
    });

    mock.module("node:child_process", {
      namedExports: {
        exec: execMock,
      },
    });

    mock.module("node:util", {
      namedExports: {
        promisify: (fn: unknown) => fn,
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

    const { listWorktrees } = await import("./list.ts");
    const result = await listWorktrees("/test/repo");

    deepStrictEqual(result, [
      {
        name: "feature-1",
        path: "/test/repo/.git/phantom/worktrees/feature-1",
        branch: "feature-1",
        isClean: true,
      },
      {
        name: "feature-2",
        path: "/test/repo/.git/phantom/worktrees/feature-2",
        branch: "feature-2",
        isClean: true,
      },
    ]);
  });

  it("should handle worktrees with dirty status", async () => {
    readdirMock = mock.fn(() => Promise.resolve(["dirty-feature"]));
    statMock = mock.fn(() => Promise.resolve({ isDirectory: () => true }));
    execMock = mock.fn((cmd: string) => {
      if (cmd.includes("git -C") && cmd.includes("status --porcelain")) {
        return Promise.resolve({ stdout: "M file.txt\n", stderr: "" });
      }
      if (cmd.includes("git -C") && cmd.includes("branch --show-current")) {
        return Promise.resolve({ stdout: "dirty-feature\n", stderr: "" });
      }
      return Promise.resolve({ stdout: "", stderr: "" });
    });

    mock.module("node:fs/promises", {
      namedExports: {
        readdir: readdirMock,
        stat: statMock,
      },
    });

    mock.module("node:child_process", {
      namedExports: {
        exec: execMock,
      },
    });

    mock.module("node:util", {
      namedExports: {
        promisify: (fn: unknown) => fn,
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

    const { listWorktrees } = await import("./list.ts");
    const result = await listWorktrees("/test/repo");

    deepStrictEqual(result, [
      {
        name: "dirty-feature",
        path: "/test/repo/.git/phantom/worktrees/dirty-feature",
        branch: "dirty-feature",
        isClean: false,
      },
    ]);
  });

  it("should skip non-directory entries", async () => {
    readdirMock = mock.fn(() =>
      Promise.resolve(["file.txt", "valid-worktree"]),
    );
    statMock = mock.fn((path: string) => {
      if (path.includes("file.txt")) {
        return Promise.resolve({ isDirectory: () => false });
      }
      return Promise.resolve({ isDirectory: () => true });
    });
    execMock = mock.fn((cmd: string) => {
      if (cmd.includes("status --porcelain")) {
        return Promise.resolve({ stdout: "", stderr: "" });
      }
      if (cmd.includes("branch --show-current")) {
        return Promise.resolve({ stdout: "valid-worktree\n", stderr: "" });
      }
      return Promise.resolve({ stdout: "", stderr: "" });
    });

    mock.module("node:fs/promises", {
      namedExports: {
        readdir: readdirMock,
        stat: statMock,
      },
    });

    mock.module("node:child_process", {
      namedExports: {
        exec: execMock,
      },
    });

    mock.module("node:util", {
      namedExports: {
        promisify: (fn: unknown) => fn,
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

    const { listWorktrees } = await import("./list.ts");
    const result = await listWorktrees("/test/repo");

    deepStrictEqual(result, [
      {
        name: "valid-worktree",
        path: "/test/repo/.git/phantom/worktrees/valid-worktree",
        branch: "valid-worktree",
        isClean: true,
      },
    ]);
  });

  it("should handle detached HEAD state", async () => {
    readdirMock = mock.fn(() => Promise.resolve(["detached"]));
    statMock = mock.fn(() => Promise.resolve({ isDirectory: () => true }));
    execMock = mock.fn((cmd: string) => {
      if (cmd.includes("status --porcelain")) {
        return Promise.resolve({ stdout: "", stderr: "" });
      }
      if (cmd.includes("branch --show-current")) {
        return Promise.resolve({ stdout: "", stderr: "" });
      }
      return Promise.resolve({ stdout: "", stderr: "" });
    });

    mock.module("node:fs/promises", {
      namedExports: {
        readdir: readdirMock,
        stat: statMock,
      },
    });

    mock.module("node:child_process", {
      namedExports: {
        exec: execMock,
      },
    });

    mock.module("node:util", {
      namedExports: {
        promisify: (fn: unknown) => fn,
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

    const { listWorktrees } = await import("./list.ts");
    const result = await listWorktrees("/test/repo");

    deepStrictEqual(result, [
      {
        name: "detached",
        path: "/test/repo/.git/phantom/worktrees/detached",
        branch: "(detached HEAD)",
        isClean: true,
      },
    ]);
  });
});
