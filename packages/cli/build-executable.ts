import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";

const entryPoint = join("src", "bin", "phantom.ts");
const outputPath = join("dist", "phantom");
const bunExecutable = "bun";

await mkdir("dist", { recursive: true });

console.log(`Building phantom single executable with ${bunExecutable}...`);

await new Promise<void>((resolve, reject) => {
  const args = [
    "build",
    entryPoint,
    "--compile",
    "--target",
    "bun",
    "--minify",
    "--outfile",
    outputPath,
  ];

  const child = spawn(bunExecutable, args, { stdio: "inherit" });

  child.on("error", (error) => {
    reject(
      new Error(
        `Failed to start Bun. Ensure Bun is installed and on your PATH (${error.message}).`,
      ),
    );
  });

  child.on("exit", (code, signal) => {
    if (code === 0) {
      resolve();
      return;
    }

    if (code === null) {
      reject(new Error(`bun build terminated by signal ${signal ?? "unknown"}`));
      return;
    }

    reject(new Error(`bun build exited with code ${code}`));
  });
});

console.log(`Executable built at ${outputPath}`);
