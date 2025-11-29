import { execFile } from "node:child_process";
import { mkdir, readFile, readdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const entryPoint = join("src", "bin", "phantom.ts");
const distDir = "dist";
const outputDir = "output";
const binaryName = "phantom";
const bunExecutable = "bun";
const targets: {
  bunTarget: string;
  os: "linux" | "darwin" | "windows";
  arch: "x64" | "arm64";
  binaryFileName: string;
  archiveExtension: "tar.gz" | "zip";
}[] = [
  {
    bunTarget: "bun-linux-x64",
    os: "linux",
    arch: "x64",
    binaryFileName: binaryName,
    archiveExtension: "tar.gz",
  },
  {
    bunTarget: "bun-linux-arm64",
    os: "linux",
    arch: "arm64",
    binaryFileName: binaryName,
    archiveExtension: "tar.gz",
  },
  {
    bunTarget: "bun-darwin-arm64",
    os: "darwin",
    arch: "arm64",
    binaryFileName: binaryName,
    archiveExtension: "tar.gz",
  },
  {
    bunTarget: "bun-darwin-x64",
    os: "darwin",
    arch: "x64",
    binaryFileName: binaryName,
    archiveExtension: "tar.gz",
  },
  {
    bunTarget: "bun-windows-x64",
    os: "windows",
    arch: "x64",
    binaryFileName: `${binaryName}.exe`,
    archiveExtension: "zip",
  },
];
const packageJson = JSON.parse(await readFile("package.json", "utf8")) as {
  version?: string;
};
const version = packageJson.version ?? "dev";

await mkdir(distDir, { recursive: true });
await mkdir(outputDir, { recursive: true });
const outputEntries = await readdir(outputDir);
for (const entry of outputEntries) {
  if (entry === ".keep") {
    continue;
  }
  await rm(join(outputDir, entry), { recursive: true, force: true });
}

for (const target of targets) {
  console.log(
    `Building phantom single executable with ${bunExecutable} (${target.bunTarget})...`,
  );
  const binaryPath = join(distDir, target.binaryFileName);
  await execFileAsync(
    bunExecutable,
    [
      "build",
      entryPoint,
      "--compile",
      `--target=${target.bunTarget}`,
      "--minify",
      "--outfile",
      binaryPath,
    ],
    { stdio: "inherit" },
  );
  console.log(
    `Executable built at ${binaryPath} for ${target.os}/${target.arch}`,
  );

  const archiveName = `phantom-${target.os}-${target.arch}-${version}.${target.archiveExtension}`;
  const archivePath = join(outputDir, archiveName);
  console.log(`Packing ${archiveName}...`);
  if (target.archiveExtension === "zip") {
    await execFileAsync(
      "zip",
      ["-j", archivePath, join(distDir, target.binaryFileName)],
      { stdio: "inherit" },
    );
  } else {
    await execFileAsync(
      "tar",
      ["-czf", archivePath, "-C", distDir, target.binaryFileName],
      { stdio: "inherit" },
    );
  }
  console.log(`Packaged ${archivePath}`);
}
