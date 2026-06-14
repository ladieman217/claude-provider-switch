import { describe, expect, it } from "vitest";
import fs from "fs/promises";
import os from "os";
import path from "path";
import request from "supertest";
import { restoreClaudeSettingsBackup } from "../src/core/claudeSettings";
import {
  createApp,
  sanitizeProviderForResponse,
  sanitizeProvidersForResponse
} from "../src/server";

const makeAppWithTempDirs = async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "cps-guard-"));
  const app = await createApp({
    configDir: path.join(tempDir, "config"),
    configPath: path.join(tempDir, "config", "config.json"),
    claudeDir: path.join(tempDir, "claude"),
    claudeSettingsPath: path.join(tempDir, "claude", "settings.json")
  });
  return { app, tempDir };
};

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

  it("allows GET on the loopback host without an origin", async () => {
    const { app, tempDir } = await makeAppWithTempDirs();
    try {
      const res = await request(app)
        .get("/api/providers")
        .set("Host", "localhost:8787");
      expect(res.status).toBe(200);
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  it("rejects requests with a forged (DNS-rebinding) host", async () => {
    const { app, tempDir } = await makeAppWithTempDirs();
    try {
      const res = await request(app)
        .get("/api/providers")
        .set("Host", "attacker.example.com");
      expect(res.status).toBe(403);
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  it("rejects cross-site mutations (CSRF) with a foreign origin", async () => {
    const { app, tempDir } = await makeAppWithTempDirs();
    try {
      const res = await request(app)
        .post("/api/providers")
        .set("Host", "localhost:8787")
        .set("Origin", "https://attacker.example.com")
        .send({ name: "evil", baseUrl: "https://evil.com", authToken: "x" });
      expect(res.status).toBe(403);
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  it("rejects mutations with no origin header", async () => {
    const { app, tempDir } = await makeAppWithTempDirs();
    try {
      const res = await request(app)
        .post("/api/providers")
        .set("Host", "localhost:8787")
        .send({ name: "evil", baseUrl: "https://evil.com", authToken: "x" });
      expect(res.status).toBe(403);
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  it("allows same-origin mutations from the loopback UI", async () => {
    const { app, tempDir } = await makeAppWithTempDirs();
    try {
      const res = await request(app)
        .post("/api/providers")
        .set("Host", "localhost:8787")
        .set("Origin", "http://localhost:8787")
        .send({
          name: "local",
          baseUrl: "https://example.com",
          authToken: "secret-token"
        });
      expect(res.status).toBe(201);
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });
});
