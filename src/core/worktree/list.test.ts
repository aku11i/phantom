import { ok as assertOk, deepStrictEqual } from "node:assert";
import { describe, it, mock } from "node:test";

describe("listWorktrees", () => {
  it("should return empty array when no phantom worktrees exist", async () => {
    const execFileMock = mock.fn(
      (_cmd: string, _args: string[], _options: Record<string, unknown>) => {
        if (_args.includes("worktree") && _args.includes("list")) {
          return Promise.resolve({
            stdout:
              "worktree /test/repo\nHEAD abc123\nbranch refs/heads/main\n\n",
            stderr: "",
          });
        }
        return Promise.resolve({ stdout: "", stderr: "" });
      },
    );

    mock.module("node:child_process", {
      namedExports: {
        execFile: (
          cmd: string,
          args: string[],
          options: Record<string, unknown>,
          callback: (
            error: Error | null,
            result?: { stdout: string; stderr: string },
          ) => void,
        ) => {
          const result = execFileMock(cmd, args, options);
          if (callback) {
            result.then(
              (res: { stdout: string; stderr: string }) => callback(null, res),
              (err: Error) => callback(err),
            );
          }
          return {};
        },
      },
    });

    mock.module("node:util", {
      namedExports: {
        promisify: () => execFileMock,
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

    assertOk(result.ok);
    if (result.ok) {
      deepStrictEqual(result.value.worktrees, []);
      deepStrictEqual(result.value.message, "No worktrees found");
    }
  });

  it("should list worktrees with clean status", async () => {
    const execFileMock = mock.fn(
      (_cmd: string, _args: string[], _options: Record<string, unknown>) => {
        if (_args.includes("worktree") && _args.includes("list")) {
          return Promise.resolve({
            stdout: `worktree /test/repo
HEAD abc123
branch refs/heads/main

worktree /test/repo/.git/phantom/worktrees/feature-1
HEAD def456
branch refs/heads/feature-1

worktree /test/repo/.git/phantom/worktrees/feature-2
HEAD ghi789
branch refs/heads/feature-2
`,
            stderr: "",
          });
        }
        if (_args.includes("status") && _args.includes("--porcelain")) {
          return Promise.resolve({ stdout: "", stderr: "" });
        }
        return Promise.resolve({ stdout: "", stderr: "" });
      },
    );

    mock.module("node:child_process", {
      namedExports: {
        execFile: (
          cmd: string,
          args: string[],
          options: Record<string, unknown>,
          callback: (
            error: Error | null,
            result?: { stdout: string; stderr: string },
          ) => void,
        ) => {
          const result = execFileMock(cmd, args, options);
          if (callback) {
            result.then(
              (res: { stdout: string; stderr: string }) => callback(null, res),
              (err: Error) => callback(err),
            );
          }
          return {};
        },
      },
    });

    mock.module("node:util", {
      namedExports: {
        promisify: () => execFileMock,
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

    assertOk(result.ok);
    if (result.ok) {
      deepStrictEqual(result.value.worktrees, [
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
    }
  });

  it("should handle worktrees with dirty status", async () => {
    const execFileMock = mock.fn(
      (_cmd: string, _args: string[], _options: Record<string, unknown>) => {
        if (_args.includes("worktree") && _args.includes("list")) {
          return Promise.resolve({
            stdout: `worktree /test/repo
HEAD abc123
branch refs/heads/main

worktree /test/repo/.git/phantom/worktrees/dirty-feature
HEAD def456
branch refs/heads/dirty-feature
`,
            stderr: "",
          });
        }
        if (_args.includes("status") && _args.includes("--porcelain")) {
          return Promise.resolve({ stdout: "M file.txt\n", stderr: "" });
        }
        return Promise.resolve({ stdout: "", stderr: "" });
      },
    );

    mock.module("node:child_process", {
      namedExports: {
        execFile: (
          cmd: string,
          args: string[],
          options: Record<string, unknown>,
          callback: (
            error: Error | null,
            result?: { stdout: string; stderr: string },
          ) => void,
        ) => {
          const result = execFileMock(cmd, args, options);
          if (callback) {
            result.then(
              (res: { stdout: string; stderr: string }) => callback(null, res),
              (err: Error) => callback(err),
            );
          }
          return {};
        },
      },
    });

    mock.module("node:util", {
      namedExports: {
        promisify: () => execFileMock,
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

    assertOk(result.ok);
    if (result.ok) {
      deepStrictEqual(result.value.worktrees, [
        {
          name: "dirty-feature",
          path: "/test/repo/.git/phantom/worktrees/dirty-feature",
          branch: "dirty-feature",
          isClean: false,
        },
      ]);
    }
  });

  it("should handle detached HEAD state", async () => {
    const execFileMock = mock.fn(
      (_cmd: string, _args: string[], _options: Record<string, unknown>) => {
        if (_args.includes("worktree") && _args.includes("list")) {
          return Promise.resolve({
            stdout: `worktree /test/repo
HEAD abc123
branch refs/heads/main

worktree /test/repo/.git/phantom/worktrees/detached
HEAD def456
detached
`,
            stderr: "",
          });
        }
        if (_args.includes("status") && _args.includes("--porcelain")) {
          return Promise.resolve({ stdout: "", stderr: "" });
        }
        return Promise.resolve({ stdout: "", stderr: "" });
      },
    );

    mock.module("node:child_process", {
      namedExports: {
        execFile: (
          cmd: string,
          args: string[],
          options: Record<string, unknown>,
          callback: (
            error: Error | null,
            result?: { stdout: string; stderr: string },
          ) => void,
        ) => {
          const result = execFileMock(cmd, args, options);
          if (callback) {
            result.then(
              (res: { stdout: string; stderr: string }) => callback(null, res),
              (err: Error) => callback(err),
            );
          }
          return {};
        },
      },
    });

    mock.module("node:util", {
      namedExports: {
        promisify: () => execFileMock,
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

    assertOk(result.ok);
    if (result.ok) {
      deepStrictEqual(result.value.worktrees, [
        {
          name: "detached",
          path: "/test/repo/.git/phantom/worktrees/detached",
          branch: "(detached HEAD)",
          isClean: true,
        },
      ]);
    }
  });

  it("should filter out non-phantom worktrees", async () => {
    const execFileMock = mock.fn(
      (_cmd: string, _args: string[], _options: Record<string, unknown>) => {
        if (_args.includes("worktree") && _args.includes("list")) {
          return Promise.resolve({
            stdout: `worktree /test/repo
HEAD abc123
branch refs/heads/main

worktree /test/repo/.git/phantom/worktrees/phantom-feature
HEAD def456
branch refs/heads/phantom-feature

worktree /test/repo/other-worktree
HEAD ghi789
branch refs/heads/other-feature
`,
            stderr: "",
          });
        }
        if (_args.includes("status") && _args.includes("--porcelain")) {
          return Promise.resolve({ stdout: "", stderr: "" });
        }
        return Promise.resolve({ stdout: "", stderr: "" });
      },
    );

    mock.module("node:child_process", {
      namedExports: {
        execFile: (
          cmd: string,
          args: string[],
          options: Record<string, unknown>,
          callback: (
            error: Error | null,
            result?: { stdout: string; stderr: string },
          ) => void,
        ) => {
          const result = execFileMock(cmd, args, options);
          if (callback) {
            result.then(
              (res: { stdout: string; stderr: string }) => callback(null, res),
              (err: Error) => callback(err),
            );
          }
          return {};
        },
      },
    });

    mock.module("node:util", {
      namedExports: {
        promisify: () => execFileMock,
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

    assertOk(result.ok);
    if (result.ok) {
      deepStrictEqual(result.value.worktrees, [
        {
          name: "phantom-feature",
          path: "/test/repo/.git/phantom/worktrees/phantom-feature",
          branch: "phantom-feature",
          isClean: true,
        },
      ]);
    }
  });
});
