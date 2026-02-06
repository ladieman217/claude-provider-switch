import { describe, expect, it } from "vitest";
import fs from "fs/promises";
import os from "os";
import path from "path";
import type { Server } from "http";
import { startServer } from "../src/server";

const runHttpTests = process.env.CPS_ENABLE_HTTP_TESTS === "1";
const describeHttp = runHttpTests ? describe : describe.skip;

const makeTempDir = async () =>
  await fs.mkdtemp(path.join(os.tmpdir(), "cps-cli-http-"));

const readJson = async (response: Response) => await response.json();

const waitForListening = async (server: Server): Promise<void> =>
  await new Promise<void>((resolve, reject) => {
    if (server.listening) {
      resolve();
      return;
    }

    const onListening = () => {
      server.off("error", onError);
      resolve();
    };
    const onError = (error: Error) => {
      server.off("listening", onListening);
      reject(error);
    };

    server.once("listening", onListening);
    server.once("error", onError);
  });

describeHttp("server http integration", () => {
  it("serves API over real HTTP and applies provider to settings", async () => {
    const tempDir = await makeTempDir();
    const configDir = path.join(tempDir, "config");
    const configPath = path.join(configDir, "config.json");
    const claudeDir = path.join(tempDir, "claude");
    const claudeSettingsPath = path.join(claudeDir, "settings.json");

    const server = await startServer(
      { configDir, configPath, claudeDir, claudeSettingsPath },
      0
    );

    try {
      try {
        await waitForListening(server);
      } catch (error) {
        const code = (error as NodeJS.ErrnoException).code;
        if (code === "EPERM" || code === "EACCES") {
          return;
        }
        throw error;
      }

      const address = server.address();
      if (!address || typeof address === "string") {
        throw new Error("Failed to resolve server address.");
      }
      const baseUrl = `http://127.0.0.1:${address.port}`;

      const createRes = await fetch(`${baseUrl}/api/providers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "local",
          baseUrl: "https://example.com",
          authToken: "secret-token",
          model: "test-model"
        })
      });
      expect(createRes.status).toBe(201);

      const listRes = await fetch(`${baseUrl}/api/providers`);
      expect(listRes.status).toBe(200);
      const listBody = (await readJson(listRes)) as {
        providers: Array<{ name: string; authToken?: string }>;
      };
      const local = listBody.providers.find((provider) => provider.name === "local");
      expect(local).toBeTruthy();
      expect(local?.authToken).toBe("***");

      const setCurrentRes = await fetch(`${baseUrl}/api/current`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "local" })
      });
      expect(setCurrentRes.status).toBe(200);

      const settings = JSON.parse(await fs.readFile(claudeSettingsPath, "utf8"));
      expect(settings.env.ANTHROPIC_BASE_URL).toBe("https://example.com");
      expect(settings.env.ANTHROPIC_AUTH_TOKEN).toBe("secret-token");
      expect(settings.env.ANTHROPIC_MODEL).toBe("test-model");
    } finally {
      if (server.listening) {
        await new Promise<void>((resolve, reject) => {
          server.close((error) => {
            if (error) {
              reject(error);
              return;
            }
            resolve();
          });
        });
      }
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });
});
