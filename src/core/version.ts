import packageJson from "../../package.json" with { type: "json" };

export function getVersion(): string {
  return packageJson.version;
}
