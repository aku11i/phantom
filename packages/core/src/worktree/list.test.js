import { deepStrictEqual, ok } from "node:assert";
import { describe, it, mock } from "node:test";

const execFileMock = mock.fn();

const getWorktreePathFromDirectoryMock = mock.fn((worktreeDirectory, name) => {
  return `${worktreeDirectory}/${name}`;
});

mock.module("node:child_process", {
  namedExports: {
    execFile: (cmd, args, options, callback) => {
      const result = execFileMock(cmd, args, options);
      if (callback) {
        result.then(
          (res) => callback(null, res),
          (err) => callback(err),
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
    getWorktreePathFromDirectory: getWorktreePathFromDirectoryMock,
  },
});

const { listWorktrees } = await import("./list.ts");

describe("listWorktrees", () => {
  it("should list all git worktrees", async () => {
    const cwdMock = mock.method(process, "cwd", () => "/test/repo");
    execFileMock.mock.mockImplementation((_cmd, _args, _options) => {
      if (_args.includes("worktree") && _args.includes("list")) {
        return Promise.resolve({
          stdout:
            "worktree /test/repo\nHEAD abc123\nbranch refs/heads/main\n\n",
          stderr: "",
        });
      }
      return Promise.resolve({ stdout: "", stderr: "" });
    });

    const result = await listWorktrees(
      "/test/repo",
      "/test/repo/.git/phantom/worktrees",
    );

    ok(result.ok);
    if (result.ok) {
      deepStrictEqual(result.value.worktrees, [
        {
          name: "main",
          path: "/test/repo",
          branch: "main",
          isClean: true,
        },
      ]);
      deepStrictEqual(result.value.message, undefined);
    }

    cwdMock.mock.restore();
    execFileMock.mock.resetCalls();
  });

  it("should list worktrees with clean status", async () => {
    const cwdMock = mock.method(process, "cwd", () => "/test/repo");
    execFileMock.mock.mockImplementation((_cmd, _args, _options) => {
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
    });

    const result = await listWorktrees(
      "/test/repo",
      "/test/repo/.git/phantom/worktrees",
    );

    ok(result.ok);
    if (result.ok) {
      deepStrictEqual(result.value.worktrees, [
        {
          name: "main",
          path: "/test/repo",
          branch: "main",
          isClean: true,
        },
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

    cwdMock.mock.restore();
    execFileMock.mock.resetCalls();
  });

  it("should handle worktrees with dirty status", async () => {
    const cwdMock = mock.method(process, "cwd", () => "/test/repo");
    let statusCallCount = 0;
    execFileMock.mock.mockImplementation((_cmd, _args, _options) => {
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
        statusCallCount += 1;
        if (statusCallCount === 1) {
          return Promise.resolve({ stdout: "", stderr: "" });
        }

        return Promise.resolve({ stdout: "M file.txt\n", stderr: "" });
      }
      return Promise.resolve({ stdout: "", stderr: "" });
    });

    const result = await listWorktrees(
      "/test/repo",
      "/test/repo/.git/phantom/worktrees",
    );

    ok(result.ok);
    if (result.ok) {
      deepStrictEqual(result.value.worktrees, [
        {
          name: "main",
          path: "/test/repo",
          branch: "main",
          isClean: true,
        },
        {
          name: "dirty-feature",
          path: "/test/repo/.git/phantom/worktrees/dirty-feature",
          branch: "dirty-feature",
          isClean: false,
        },
      ]);
    }

    cwdMock.mock.restore();
    execFileMock.mock.resetCalls();
  });

  it("should handle detached HEAD state", async () => {
    const cwdMock = mock.method(process, "cwd", () => "/test/repo");
    execFileMock.mock.mockImplementation((_cmd, _args, _options) => {
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
    });

    const result = await listWorktrees(
      "/test/repo",
      "/test/repo/.git/phantom/worktrees",
    );

    ok(result.ok);
    if (result.ok) {
      deepStrictEqual(result.value.worktrees, [
        {
          name: "main",
          path: "/test/repo",
          branch: "main",
          isClean: true,
        },
        {
          name: "(detached HEAD)",
          path: "/test/repo/.git/phantom/worktrees/detached",
          branch: "(detached HEAD)",
          isClean: true,
        },
      ]);
    }

    cwdMock.mock.restore();
    execFileMock.mock.resetCalls();
  });

  it("should include all git worktrees", async () => {
    const cwdMock = mock.method(process, "cwd", () => "/test/repo");
    execFileMock.mock.mockImplementation((_cmd, _args, _options) => {
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
    });

    const result = await listWorktrees(
      "/test/repo",
      "/test/repo/.git/phantom/worktrees",
    );

    ok(result.ok);
    if (result.ok) {
      deepStrictEqual(result.value.worktrees, [
        {
          name: "main",
          path: "/test/repo",
          branch: "main",
          isClean: true,
        },
        {
          name: "phantom-feature",
          path: "/test/repo/.git/phantom/worktrees/phantom-feature",
          branch: "phantom-feature",
          isClean: true,
        },
        {
          name: "other-feature",
          path: "/test/repo/other-worktree",
          branch: "other-feature",
          isClean: true,
        },
      ]);
    }

    cwdMock.mock.restore();
    execFileMock.mock.resetCalls();
  });
});
