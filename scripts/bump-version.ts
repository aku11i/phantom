import { spawnSync } from "node:child_process";
import { appendFileSync, readFileSync } from "node:fs";
import process from "node:process";
import { parseArgs } from "node:util";

const { values } = parseArgs({
  options: {
    "release-type": { type: "string" },
  },
});

const releaseType = values["release-type"]?.trim() ?? "patch";
const allowedReleaseTypes = new Set([
  "patch",
  "minor",
  "major",
  "prepatch",
  "preminor",
  "premajor",
  "prerelease",
]);

if (!allowedReleaseTypes.has(releaseType)) {
  throw new Error(
    `Unsupported release type '${releaseType}'. Supported types: ${[...allowedReleaseTypes].join(", ")}`,
  );
}

const packageJson = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8"),
);
const currentVersion = (packageJson?.version as string | undefined)?.trim();

if (!currentVersion) {
  throw new Error("package.json version is missing or empty");
}

const isPrereleaseVersion = currentVersion.includes("-");

if (releaseType === "prerelease" && !isPrereleaseVersion) {
  throw new Error(
    "Cannot bump prerelease: current version is not a prerelease",
  );
}

const bumpArgument = releaseType;

const sharedArgs = ["version", bumpArgument, "--no-git-tag-version"];
const pnpmCommand = ["pnpm", "-r", "exec", "npm", ...sharedArgs];
const npmCommand = ["npm", ...sharedArgs];

function run(command: string[]) {
  const result = spawnSync(command[0], command.slice(1), { stdio: "inherit" });

  if (result.status !== 0) {
    throw new Error(
      `Command '${command.join(" ")}' failed with exit code ${result.status ?? "unknown"}`,
    );
  }
}

run(pnpmCommand);
run(npmCommand);

const outputPath = process.env.GITHUB_OUTPUT;

if (outputPath) {
  appendFileSync(outputPath, `bump_type=${bumpArgument}\n`);
} else {
  console.log(`bump_type=${bumpArgument}`);
}
