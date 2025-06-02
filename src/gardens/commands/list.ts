import { exec } from "node:child_process";
import { join } from "node:path";
import { promisify } from "node:util";
import { getGitRoot } from "../../git/libs/get-git-root.ts";
import { getWorktrees } from "../../git/libs/get-worktrees.ts";

const execAsync = promisify(exec);

export interface GardenInfo {
  name: string;
  branch: string;
  status: "clean" | "dirty";
  changedFiles?: number;
}

export async function listGardens(): Promise<{
  success: boolean;
  message?: string;
  gardens?: GardenInfo[];
}> {
  try {
    const gitRoot = await getGitRoot();
    const gardensPath = join(gitRoot, ".git", "phantom", "gardens");

    // Get all worktrees
    let worktrees: Awaited<ReturnType<typeof getWorktrees>>;
    try {
      worktrees = await getWorktrees();
    } catch (error) {
      return {
        success: false,
        message: `Error running git worktree list: ${error instanceof Error ? error.message : String(error)}`,
      };
    }

    // Filter worktrees to only include gardens
    const gardenWorktrees = worktrees.filter((wt) =>
      wt.path.includes("/.git/phantom/gardens/"),
    );

    if (gardenWorktrees.length === 0) {
      return {
        success: true,
        gardens: [],
        message: "No gardens found",
      };
    }

    // Get detailed information for each garden
    const gardens: GardenInfo[] = await Promise.all(
      gardenWorktrees.map(async (worktree) => {
        // Extract garden name from path
        const gardenPathMatch = worktree.path.match(
          /\.git\/phantom\/gardens\/(.+)$/,
        );
        const name = gardenPathMatch ? gardenPathMatch[1] : "unknown";

        // Get working directory status
        let status: "clean" | "dirty" = "clean";
        let changedFiles: number | undefined;
        try {
          const { stdout } = await execAsync("git status --porcelain", {
            cwd: worktree.path,
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
          branch: worktree.isDetached
            ? "detached HEAD"
            : worktree.branch || "unknown",
          status,
          changedFiles,
        };
      }),
    );

    return {
      success: true,
      gardens,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      message: `Error listing gardens: ${errorMessage}`,
    };
  }
}

export async function gardensListHandler(): Promise<void> {
  const result = await listGardens();

  if (!result.success) {
    console.error(result.message);
    return;
  }

  if (!result.gardens || result.gardens.length === 0) {
    console.log(result.message || "No gardens found");
    return;
  }

  console.log("Gardens:");
  for (const garden of result.gardens) {
    const statusText =
      garden.status === "clean"
        ? "[clean]"
        : `[dirty: ${garden.changedFiles} files]`;

    console.log(
      `  ${garden.name.padEnd(20)} (branch: ${garden.branch.padEnd(20)}) ${statusText}`,
    );
  }

  console.log(`\nTotal: ${result.gardens.length} gardens`);
}
