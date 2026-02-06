import { describe, expect, it } from "vitest";
import fs from "fs/promises";
import os from "os";
import path from "path";
import { createApp } from "../src/server";

const makeTempDir = async () =>
  await fs.mkdtemp(path.join(os.tmpdir(), "cps-cli-"));

type MockResponse = {
  statusCode: number;
  body: unknown;
  status: (code: number) => MockResponse;
  json: (payload: unknown) => MockResponse;
};

const createMockResponse = (): MockResponse => ({
  statusCode: 200,
  body: null,
  status(code: number) {
    this.statusCode = code;
    return this;
  },
  json(payload: unknown) {
    this.body = payload;
    return this;
  }
});

const getRouteHandler = (
  app: any,
  method: "get" | "post" | "delete" | "put",
  routePath: string
) => {
  const router = app?._router;
  if (!router?.stack) {
    throw new Error("Router stack not found.");
  }

  const layer = router.stack.find(
    (item: any) => item.route?.path === routePath && item.route?.methods?.[method]
  );
  if (!layer?.route?.stack?.[0]?.handle) {
    throw new Error(`Route handler not found for ${method.toUpperCase()} ${routePath}`);
  }

  return layer.route.stack[0].handle as (
    req: Record<string, unknown>,
    res: MockResponse
  ) => Promise<void> | void;
};

describe("server api", () => {
  it("creates, lists, and deletes providers", async () => {
    const tempDir = await makeTempDir();
    const configDir = path.join(tempDir, "config");
    const configPath = path.join(configDir, "config.json");
    const app = await createApp({ configDir, configPath });
    const postProviders = getRouteHandler(app, "post", "/api/providers");
    const getProviders = getRouteHandler(app, "get", "/api/providers");
    const deleteProvider = getRouteHandler(app, "delete", "/api/providers/:name");

    const createRes = createMockResponse();
    await postProviders(
      {
        body: {
          name: "local",
          baseUrl: "https://example.com",
          authToken: "token"
        },
        params: {}
      },
      createRes
    );
    expect(createRes.statusCode).toBe(201);

    const listRes = createMockResponse();
    await getProviders({ body: {}, params: {} }, listRes);
    expect(listRes.statusCode).toBe(200);
    const listedLocal = (
      listRes.body as { providers: Array<{ id?: string; name: string }> }
    ).providers.find((p) => p.name === "local");
    expect(listedLocal).toBeTruthy();
    expect(listedLocal?.id).toBeTruthy();

    const deleteRes = createMockResponse();
    await deleteProvider({ body: {}, params: { name: "local" } }, deleteRes);
    expect(deleteRes.statusCode).toBe(200);
  });

  it("sets current provider and applies settings", async () => {
    const tempDir = await makeTempDir();
    const configDir = path.join(tempDir, "config");
    const configPath = path.join(configDir, "config.json");
    const claudeDir = path.join(tempDir, "claude");
    const claudeSettingsPath = path.join(claudeDir, "settings.json");

    const app = await createApp({
      configDir,
      configPath,
      claudeDir,
      claudeSettingsPath
    });
    const postProviders = getRouteHandler(app, "post", "/api/providers");
    const getProviders = getRouteHandler(app, "get", "/api/providers");
    const postCurrent = getRouteHandler(app, "post", "/api/current");

    const createRes = createMockResponse();
    await postProviders(
      {
        body: {
        name: "local",
        baseUrl: "https://example.com",
        authToken: "token"
        },
        params: {}
      },
      createRes
    );
    expect(createRes.statusCode).toBe(201);

    const listRes = createMockResponse();
    await getProviders({ body: {}, params: {} }, listRes);
    expect(listRes.statusCode).toBe(200);
    const local = (
      listRes.body as { providers: Array<{ id?: string; name: string }> }
    ).providers.find((provider) => provider.name === "local");
    expect(local?.id).toBeTruthy();

    const setCurrentRes = createMockResponse();
    await postCurrent({ body: { name: local?.id }, params: {} }, setCurrentRes);
    expect(setCurrentRes.statusCode).toBe(200);

    const settings = JSON.parse(await fs.readFile(claudeSettingsPath, "utf8"));
    expect(settings.env.ANTHROPIC_BASE_URL).toBe("https://example.com");
    expect(settings.env.ANTHROPIC_AUTH_TOKEN).toBe("token");
    expect(settings.env.ANTHROPIC_MODEL).toBeUndefined();
    expect(settings.env.API_TIMEOUT_MS).toBe("3000000");
    expect(settings.env.CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC).toBe("1");
  });

  it("accepts user-defined provider id", async () => {
    const tempDir = await makeTempDir();
    const configDir = path.join(tempDir, "config");
    const configPath = path.join(configDir, "config.json");
    const app = await createApp({ configDir, configPath });
    const postProviders = getRouteHandler(app, "post", "/api/providers");
    const getProviders = getRouteHandler(app, "get", "/api/providers");

    const createRes = createMockResponse();
    await postProviders(
      {
        body: {
          id: "team-prod",
          name: "Team Prod Provider",
          baseUrl: "https://example.com",
          authToken: "token"
        },
        params: {}
      },
      createRes
    );
    expect(createRes.statusCode).toBe(201);

    const listRes = createMockResponse();
    await getProviders({ body: {}, params: {} }, listRes);
    expect(listRes.statusCode).toBe(200);
    const created = (
      listRes.body as { providers: Array<{ id?: string; name: string }> }
    ).providers.find((provider) => provider.name === "team prod provider");
    expect(created?.id).toBe("team-prod");
  });

  it("rejects duplicate user-defined provider id", async () => {
    const tempDir = await makeTempDir();
    const configDir = path.join(tempDir, "config");
    const configPath = path.join(configDir, "config.json");
    const app = await createApp({ configDir, configPath });
    const postProviders = getRouteHandler(app, "post", "/api/providers");

    const firstRes = createMockResponse();
    await postProviders(
      {
        body: {
          id: "team-prod",
          name: "Provider A",
          baseUrl: "https://a.example.com",
          authToken: "token-a"
        },
        params: {}
      },
      firstRes
    );
    expect(firstRes.statusCode).toBe(201);

    const secondRes = createMockResponse();
    await postProviders(
      {
        body: {
          id: "team-prod",
          name: "Provider B",
          baseUrl: "https://b.example.com",
          authToken: "token-b"
        },
        params: {}
      },
      secondRes
    );
    expect(secondRes.statusCode).toBe(400);
    expect((secondRes.body as { error: string }).error).toContain(
      "already exists"
    );
  });

  it("does not keep nonessential traffic flag for anthropic preset", async () => {
    const tempDir = await makeTempDir();
    const configDir = path.join(tempDir, "config");
    const configPath = path.join(configDir, "config.json");
    const claudeDir = path.join(tempDir, "claude");
    const claudeSettingsPath = path.join(claudeDir, "settings.json");

    await fs.mkdir(claudeDir, { recursive: true });
    await fs.writeFile(
      claudeSettingsPath,
      JSON.stringify(
        {
          env: {
            CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: "1",
            API_TIMEOUT_MS: "1000"
          }
        },
        null,
        2
      )
    );

    const app = await createApp({
      configDir,
      configPath,
      claudeDir,
      claudeSettingsPath
    });
    const postCurrent = getRouteHandler(app, "post", "/api/current");

    const setCurrentRes = createMockResponse();
    await postCurrent({ body: { name: "anthropic" }, params: {} }, setCurrentRes);
    expect(setCurrentRes.statusCode).toBe(200);

    const settings = JSON.parse(await fs.readFile(claudeSettingsPath, "utf8"));
    expect(settings.env.CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC).toBeUndefined();
    expect(settings.env.API_TIMEOUT_MS).toBe("3000000");
  });
});
