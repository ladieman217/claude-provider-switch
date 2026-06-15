import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

const assertSafeBrowserUrl = (url: string) => {
  const parsed = new URL(url);
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Browser URL must use http or https.");
  }
};

export const openBrowser = async (url: string) => {
  assertSafeBrowserUrl(url);

  const platform = process.platform;
  const command =
    platform === "darwin" ? "open" : platform === "win32" ? "cmd.exe" : "xdg-open";
  const args =
    platform === "win32" ? ["/c", "start", "", url] : [url];

  try {
    await execFileAsync(command, args);
  } catch {
    // Silently fail - opening browser is not critical
  }
};
