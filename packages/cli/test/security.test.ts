import { execFile } from "child_process";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { restoreClaudeSettingsBackup } from "../src/core/claudeSettings";
import { openBrowser } from "../src/browser";
import {
  sanitizeProviderForResponse,
  sanitizeProvidersForResponse
} from "../src/server";

vi.mock("child_process", () => ({
  execFile: vi.fn((_command, _args, callback) => {
    callback(null, "", "");
  })
}));

describe("security hardening", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects path traversal backup names on restore", async () => {
    await expect(
      restoreClaudeSettingsBackup("settings.backup-../../../../etc/passwd", {
        claudeDir: "/tmp/cps-cli-security",
        claudeSettingsPath: "/tmp/cps-cli-security/settings.json"
      })
    ).rejects.toThrow("Invalid backup name.");
  });

  it("masks auth token in API response helpers", () => {
    const provider = {
      name: "local",
      baseUrl: "https://example.com",
      authToken: "secret-token",
      model: "test-model",
      preset: false
    };

    const single = sanitizeProviderForResponse(provider);
    const list = sanitizeProvidersForResponse([provider]);

    expect(single.authToken).toBe("***");
    expect(list[0]?.authToken).toBe("***");
    expect(provider.authToken).toBe("secret-token");
  });

  it("opens browser URLs without invoking a shell", async () => {
    await openBrowser("http://localhost:8787/?next=a;b");

    expect(execFile).toHaveBeenCalledTimes(1);
    expect(execFile).toHaveBeenCalledWith(
      process.platform === "darwin"
        ? "open"
        : process.platform === "win32"
          ? "cmd.exe"
          : "xdg-open",
      process.platform === "win32"
        ? ["/c", "start", "", "http://localhost:8787/?next=a;b"]
        : ["http://localhost:8787/?next=a;b"],
      expect.any(Function)
    );
  });

  it("rejects non-http browser URLs before spawning a process", async () => {
    await expect(openBrowser("file:///tmp/index.html")).rejects.toThrow(
      "Browser URL must use http or https."
    );
    expect(execFile).not.toHaveBeenCalled();
  });
});
