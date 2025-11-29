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
  it("should return empty array when no phantom worktrees exist", async () => {
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
      deepStrictEqual(result.value.worktrees, []);
      deepStrictEqual(result.value.message, "No worktrees found");
    }

    execFileMock.mock.resetCalls();
  });

  it("should list worktrees with clean status", async () => {
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
          directoryName: "feature-1",
          name: "feature-1",
          path: "/test/repo/.git/phantom/worktrees/feature-1",
          branch: "feature-1",
          isClean: true,
        },
        {
          directoryName: "feature-2",
          name: "feature-2",
          path: "/test/repo/.git/phantom/worktrees/feature-2",
          branch: "feature-2",
          isClean: true,
        },
      ]);
    }

    execFileMock.mock.resetCalls();
  });

  it("should handle worktrees with dirty status", async () => {
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
          directoryName: "dirty-feature",
          name: "dirty-feature",
          path: "/test/repo/.git/phantom/worktrees/dirty-feature",
          branch: "dirty-feature",
          isClean: false,
        },
      ]);
    }

    execFileMock.mock.resetCalls();
  });

  it("should handle detached HEAD state", async () => {
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
          name: "(detached HEAD)",
          directoryName: "detached",
          path: "/test/repo/.git/phantom/worktrees/detached",
          branch: "(detached HEAD)",
          isClean: true,
        },
      ]);
    }

    execFileMock.mock.resetCalls();
  });

  it("should filter out non-phantom worktrees", async () => {
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
          directoryName: "phantom-feature",
          name: "phantom-feature",
          path: "/test/repo/.git/phantom/worktrees/phantom-feature",
          branch: "phantom-feature",
          isClean: true,
        },
      ]);
    }

    execFileMock.mock.resetCalls();
  });
});
