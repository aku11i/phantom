import childProcess from "node:child_process";
import { promisify } from "node:util";
import { getPhantomDirectory, getWorktreePath } from "../core/paths.ts";
import {
  listValidWorktrees,
  validatePhantomDirectoryExists,
} from "../core/worktree/validate.ts";
import { getGitRoot } from "../git/libs/get-git-root.ts";

const execAsync = promisify(childProcess.exec);

export interface WorktreeInfo {
  name: string;
  branch: string;
  status: "clean" | "dirty";
  changedFiles?: number;
}

export async function listWorktrees(): Promise<{
  success: boolean;
  message?: string;
  worktrees?: WorktreeInfo[];
}> {
  try {
    const gitRoot = await getGitRoot();
    const worktreesPath = getPhantomDirectory(gitRoot);

    // Check if worktrees directory exists
    if (!(await validatePhantomDirectoryExists(gitRoot))) {
      return {
        success: true,
        worktrees: [],
        message: "No worktrees found (worktrees directory doesn't exist)",
      };
    }

    // Get list of valid worktrees
    const worktreeNames = await listValidWorktrees(gitRoot);

    if (worktreeNames.length === 0) {
      return {
        success: true,
        worktrees: [],
        message: "No worktrees found",
      };
    }

    // Get detailed information for each worktree
    const worktrees: WorktreeInfo[] = await Promise.all(
      worktreeNames.map(async (name) => {
        const worktreePath = getWorktreePath(gitRoot, name);

        // Get current branch
        let branch = "unknown";
        try {
          const { stdout } = await execAsync("git branch --show-current", {
            cwd: worktreePath,
          });
          branch = stdout.trim() || "detached HEAD";
        } catch {
          branch = "unknown";
        }

        // Get working directory status
        let status: "clean" | "dirty" = "clean";
        let changedFiles: number | undefined;
        try {
          const { stdout } = await execAsync("git status --porcelain", {
            cwd: worktreePath,
          });
          const changes = stdout.trim();
          if (changes) {
            status = "dirty";
            changedFiles = changes.split("\n").length;
          }
        } catch {
          // If git status fails, assume unknown status
          status = "clean";
        }

        return {
          name,
          branch,
          status,
          changedFiles,
        };
      }),
    );

    return {
      success: true,
      worktrees,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      message: `Error listing worktrees: ${errorMessage}`,
    };
  }
}

export async function listHandler(): Promise<void> {
  const result = await listWorktrees();

  if (!result.success) {
    console.error(result.message);
    return;
  }

  if (!result.worktrees || result.worktrees.length === 0) {
    console.log(result.message || "No worktrees found");
    return;
  }

  console.log("Worktrees:");
  for (const worktree of result.worktrees) {
    const statusText =
      worktree.status === "clean"
        ? "[clean]"
        : `[dirty: ${worktree.changedFiles} files]`;

    console.log(
      `  ${worktree.name.padEnd(20)} (branch: ${worktree.branch.padEnd(20)}) ${statusText}`,
    );
  }

  console.log(`\nTotal: ${result.worktrees.length} worktrees`);
}
