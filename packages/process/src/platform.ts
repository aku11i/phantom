import { platform } from "node:os";

/**
 * Get the appropriate clipboard command for the current platform
 */
export function getClipboardCommand(): string {
  const os = platform();
  switch (os) {
    case "darwin":
      return "pbcopy";
    case "linux":
      return "xclip -selection clipboard";
    case "win32":
      return "clip";
    default:
      return "pbcopy"; // fallback to macOS
  }
}

/**
 * Get the appropriate file manager command for the current platform
 */
export function getFileManagerCommand(): string {
  const os = platform();
  switch (os) {
    case "darwin":
      return "open";
    case "linux":
      return "xdg-open";
    case "win32":
      return "explorer";
    default:
      return "open"; // fallback to macOS
  }
}
