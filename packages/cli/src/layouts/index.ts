import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface LayoutOptions {
  worktreePath: string;
  worktreeName: string;
  claudeCommand?: string;
  claudeArgs?: string[];
  noClaude?: boolean;
}

export async function getDefaultLayoutPath(): Promise<string> {
  return path.join(__dirname, "default.kdl");
}

export async function createTemporaryLayout(
  options: LayoutOptions,
): Promise<string> {
  const {
    worktreePath,
    worktreeName,
    claudeCommand = "claude",
    claudeArgs = [],
    noClaude = false,
  } = options;

  // Build the Claude pane content
  let claudePane: string;
  if (noClaude) {
    // Just a shell pane if Claude is disabled
    claudePane = `        pane size="50%" focus=true {
            name "shell2"
        }`;
  } else {
    // Claude pane with command
    const argsLine =
      claudeArgs.length > 0
        ? `\n            args ${claudeArgs.map((a) => `"${a}"`).join(" ")}`
        : "";
    claudePane = `        pane size="50%" focus=true {
            name "claude"
            command "${claudeCommand}"${argsLine}
        }`;
  }

  // Generate a dynamic layout with the correct paths and commands
  const layout = `// Phantom generated layout for ${worktreeName}
layout {
    cwd "${worktreePath}"

    pane split_direction="vertical" {
        pane size="50%" {
            name "shell"
        }
${claudePane}
    }
}
`;

  // Write to a temporary file
  const tempDir = os.tmpdir();
  const tempFile = path.join(
    tempDir,
    `phantom-${worktreeName}-${Date.now()}.kdl`,
  );
  await fs.writeFile(tempFile, layout, "utf-8");

  return tempFile;
}

export async function cleanupTemporaryLayout(
  layoutPath: string,
): Promise<void> {
  try {
    if (layoutPath.includes(os.tmpdir())) {
      await fs.unlink(layoutPath);
    }
  } catch {
    // Ignore cleanup errors
  }
}
