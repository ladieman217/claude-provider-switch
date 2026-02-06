import { describe, expect, it } from "vitest";
import { restoreClaudeSettingsBackup } from "../src/core/claudeSettings";
import {
  sanitizeProviderForResponse,
  sanitizeProvidersForResponse
} from "../src/server";

describe("security hardening", () => {
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
});
