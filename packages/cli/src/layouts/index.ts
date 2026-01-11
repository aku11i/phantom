import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface LayoutOptions {
  worktreePath: string;
  worktreeName: string;
  agentCommand?: string;
  agentArgs?: string[];
  noAgent?: boolean;
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
    agentCommand = "claude",
    agentArgs = [],
    noAgent = false,
  } = options;

  // Build the top pane content (agent or shell)
  let topPane: string;
  if (noAgent) {
    // Just a shell pane if agent is disabled
    topPane = `        pane size="50%" focus=true {
            name "shell"
        }`;
  } else {
    // Agent pane with command
    const argsLine =
      agentArgs.length > 0
        ? `\n            args ${agentArgs.map((a) => `"${a}"`).join(" ")}`
        : "";
    topPane = `        pane size="50%" focus=true {
            name "agent"
            command "${agentCommand}"${argsLine}
        }`;
  }

  // Generate a dynamic layout with the correct paths and commands
  // Top pane: agent (or shell if --no-agent)
  // Bottom pane: two shells side by side
  const layout = `// Phantom generated layout for ${worktreeName}
layout {
    cwd "${worktreePath}"

    pane split_direction="vertical" {
${topPane}
        pane size="50%" split_direction="horizontal" {
            pane {
                name "shell"
            }
            pane {
                name "shell2"
            }
        }
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
