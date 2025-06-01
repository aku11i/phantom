import { exec } from "node:child_process";
import { access, readdir } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";
import { getGitRoot } from "../../git/libs/get-git-root.ts";

const execAsync = promisify(exec);

export interface RuinInfo {
  name: string;
  branch: string;
  status: "clean" | "dirty";
  changedFiles?: number;
}

export async function listRuins(): Promise<{
  success: boolean;
  message?: string;
  ruins?: RuinInfo[];
}> {
  try {
    const gitRoot = await getGitRoot();
    const ruinsPath = join(gitRoot, ".git", "phantom", "ruins");

    // Check if ruins directory exists
    try {
      await access(ruinsPath);
    } catch {
      return {
        success: true,
        ruins: [],
        message: "No ruins found (ruins directory doesn't exist)",
      };
    }

    // Read ruins directory
    let ruinNames: string[];
    try {
      const entries = await readdir(ruinsPath);
      // Filter entries to only include directories
      const validEntries = await Promise.all(
        entries.map(async (entry) => {
          try {
            const entryPath = join(ruinsPath, entry);
            await access(entryPath);
            return entry;
          } catch {
            return null;
          }
        }),
      );
      ruinNames = validEntries.filter(
        (entry): entry is string => entry !== null,
      );
    } catch {
      return {
        success: true,
        ruins: [],
        message: "No ruins found (unable to read ruins directory)",
      };
    }

    if (ruinNames.length === 0) {
      return {
        success: true,
        ruins: [],
        message: "No ruins found",
      };
    }

    // Get detailed information for each ruin
    const ruins: RuinInfo[] = await Promise.all(
      ruinNames.map(async (name) => {
        const ruinPath = join(ruinsPath, name);

        // Get current branch
        let branch = "unknown";
        try {
          const { stdout } = await execAsync("git branch --show-current", {
            cwd: ruinPath,
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
            cwd: ruinPath,
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
      ruins,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      message: `Error listing ruins: ${errorMessage}`,
    };
  }
}

export async function ruinsListHandler(): Promise<void> {
  const result = await listRuins();

  if (!result.success) {
    console.error(result.message);
    return;
  }

  if (!result.ruins || result.ruins.length === 0) {
    console.log(result.message || "No ruins found");
    return;
  }

  console.log("Ruins:");
  for (const ruin of result.ruins) {
    const statusText =
      ruin.status === "clean"
        ? "[clean]"
        : `[dirty: ${ruin.changedFiles} files]`;

    console.log(
      `  ${ruin.name.padEnd(20)} (branch: ${ruin.branch.padEnd(20)}) ${statusText}`,
    );
  }

  console.log(`\nTotal: ${result.ruins.length} ruins`);
}
