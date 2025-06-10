import { chmod, readdir } from "node:fs/promises";
import { join } from "node:path";
import { build } from "esbuild";

const files = await readdir("src/bin");
const entryPoints = files
  .filter((file) => file.endsWith(".ts"))
  .map((file) => join("src/bin", file));

console.log("Building entry points:", entryPoints);

await build({
  entryPoints,
  bundle: true,
  outdir: "dist",
  format: "esm",
  platform: "node",
  target: "node22",
  sourcemap: true,
  external: ["node:*"],
});

// Make the output files executable
for (const entryPoint of entryPoints) {
  const outputFile = entryPoint
    .replace("src/bin/", "dist/")
    .replace(".ts", ".js");
  await chmod(outputFile, "755");
}

console.log("Build completed successfully!");
