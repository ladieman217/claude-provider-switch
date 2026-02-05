import { describe, expect, it } from "vitest";
import request from "supertest";
import fs from "fs/promises";
import os from "os";
import path from "path";
import { createApp } from "../src/server";

const makeTempDir = async () =>
  await fs.mkdtemp(path.join(os.tmpdir(), "cps-cli-"));

describe("server api", () => {
  it("creates, lists, and deletes providers", async () => {
    const tempDir = await makeTempDir();
    const app = await createApp({ configDir: path.join(tempDir, "config") });

    await request(app)
      .post("/api/providers")
      .send({ name: "local", baseUrl: "https://example.com" })
      .expect(201);

    const listResponse = await request(app).get("/api/providers");
    expect(listResponse.body.providers.some((p: { name: string }) => p.name === "local")).toBe(true);

    await request(app).delete("/api/providers/local").expect(200);
  });

  it("sets current provider and applies settings", async () => {
    const tempDir = await makeTempDir();
    const configDir = path.join(tempDir, "config");
    const claudeDir = path.join(tempDir, "claude");
    const claudeSettingsPath = path.join(claudeDir, "settings.json");

    const app = await createApp({ configDir, claudeDir, claudeSettingsPath });

    await request(app)
      .post("/api/providers")
      .send({
        name: "local",
        baseUrl: "https://example.com",
        authToken: "token",
        model: "model"
      })
      .expect(201);

    await request(app).post("/api/current").send({ name: "local" }).expect(200);

    const settings = JSON.parse(await fs.readFile(claudeSettingsPath, "utf8"));
    expect(settings.env.ANTHROPIC_BASE_URL).toBe("https://example.com");
    expect(settings.env.ANTHROPIC_AUTH_TOKEN).toBe("token");
    expect(settings.env.ANTHROPIC_MODEL).toBe("model");
  });
});
