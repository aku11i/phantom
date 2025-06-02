import { exec } from "node:child_process";
import { access, readdir } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";
import { getGitRoot } from "../../git/libs/get-git-root.ts";

const execAsync = promisify(exec);

export interface PhantomInfo {
  name: string;
  branch: string;
  status: "clean" | "dirty";
  changedFiles?: number;
}

export async function listPhantoms(): Promise<{
  success: boolean;
  message?: string;
  phantoms?: PhantomInfo[];
}> {
  try {
    const gitRoot = await getGitRoot();
    const phantomsPath = join(gitRoot, ".git", "phantom", "phantoms");

    // Check if phantoms directory exists
    try {
      await access(phantomsPath);
    } catch {
      return {
        success: true,
        phantoms: [],
        message: "No phantoms found (phantoms directory doesn't exist)",
      };
    }

    // Read phantoms directory
    let phantomNames: string[];
    try {
      const entries = await readdir(phantomsPath);
      // Filter entries to only include directories
      const validEntries = await Promise.all(
        entries.map(async (entry) => {
          try {
            const entryPath = join(phantomsPath, entry);
            await access(entryPath);
            return entry;
          } catch {
            return null;
          }
        }),
      );
      phantomNames = validEntries.filter(
        (entry): entry is string => entry !== null,
      );
    } catch {
      return {
        success: true,
        phantoms: [],
        message: "No phantoms found (unable to read phantoms directory)",
      };
    }

    if (phantomNames.length === 0) {
      return {
        success: true,
        phantoms: [],
        message: "No phantoms found",
      };
    }

    // Get detailed information for each phantom
    const phantoms: PhantomInfo[] = await Promise.all(
      phantomNames.map(async (name) => {
        const phantomPath = join(phantomsPath, name);

        // Get current branch
        let branch = "unknown";
        try {
          const { stdout } = await execAsync("git branch --show-current", {
            cwd: phantomPath,
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
            cwd: phantomPath,
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
      phantoms,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      message: `Error listing phantoms: ${errorMessage}`,
    };
  }
}

export async function phantomsListHandler(): Promise<void> {
  const result = await listPhantoms();

  if (!result.success) {
    console.error(result.message);
    return;
  }

  if (!result.phantoms || result.phantoms.length === 0) {
    console.log(result.message || "No phantoms found");
    return;
  }

  console.log("Phantoms:");
  for (const phantom of result.phantoms) {
    const statusText =
      phantom.status === "clean"
        ? "[clean]"
        : `[dirty: ${phantom.changedFiles} files]`;

    console.log(
      `  ${phantom.name.padEnd(20)} (branch: ${phantom.branch.padEnd(20)}) ${statusText}`,
    );
  }

  console.log(`\nTotal: ${result.phantoms.length} phantoms`);
}
