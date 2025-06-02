import packageJson from "../../../package.json" with { type: "json" };

export function getVersion(): string {
  return packageJson.version;
}

export function versionHandler(): void {
  const version = getVersion();
  console.log(`Phantom v${version}`);
}
