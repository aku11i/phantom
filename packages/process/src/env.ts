export function getPhantomEnv(
  worktreeName: string,
  worktreePath: string,
): Record<string, string> {
  return {
    PHANTOM: "1",
    PHANTOM_NAME: worktreeName,
    PHANTOM_PATH: worktreePath,
  };
}
