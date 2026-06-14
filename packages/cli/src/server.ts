import express from "express";
import path from "path";
import fs from "fs/promises";
import type { Server } from "http";
import {
  addProvider,
  assertProviderHasAuthToken,
  applyProviderToClaudeSettings,
  collectCustomEnvKeysToClear,
  collectProviderCustomEnvKeys,
  DEFAULT_PRESETS,
  ensureConfig,
  findProviderById,
  findProviderByReference,
  listClaudeSettingsBackups,
  removeProviderById,
  restoreClaudeSettingsBackup,
  saveConfig,
  setCurrentProvider,
  updateProviderById
} from "./core";
import type { PathsOptions, ProviderConfig } from "./core";

// Logger utility
const logger = {
  info: (message: string) => console.log(`[cps] ${message}`),
  error: (message: string) => console.error(`[cps] ${message}`),
  request: (method: string, path: string, statusCode: number, duration: number) => {
    const status = statusCode >= 400 ? "✗" : "✓";
    console.log(`[cps] ${status} ${method} ${path} ${statusCode} (${duration}ms)`);
  }
};

export type ServerOptions = PathsOptions & {
  uiDistPath?: string;
};

export const sanitizeProviderForResponse = (
  provider: ProviderConfig
): ProviderConfig => ({
  ...provider,
  authToken: provider.authToken ? "***" : ""
});

export const sanitizeProvidersForResponse = (
  providers: ProviderConfig[]
): ProviderConfig[] => providers.map(sanitizeProviderForResponse);

const loadConfig = async (options: PathsOptions) => ensureConfig(options);

const ALLOWED_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

const extractHostname = (hostHeader: string): string => {
  const value = hostHeader.trim();
  // IPv6 literal: [::1]:port
  if (value.startsWith("[")) {
    const end = value.indexOf("]");
    return end === -1 ? value : value.slice(0, end + 1);
  }
  const colon = value.lastIndexOf(":");
  return colon === -1 ? value : value.slice(0, colon);
};

const isAllowedHost = (hostHeader?: string): boolean => {
  if (!hostHeader) {
    return false;
  }
  return ALLOWED_HOSTNAMES.has(extractHostname(hostHeader));
};

const isAllowedOrigin = (origin?: string): boolean => {
  if (!origin) {
    return false;
  }
  try {
    return ALLOWED_HOSTNAMES.has(new URL(origin).hostname);
  } catch {
    return false;
  }
};

// Guards a localhost-only API that mutates secrets against CSRF / DNS rebinding.
// Host check blocks DNS-rebinding (attacker domain as Host); Origin check blocks
// cross-site requests from a malicious page to the loopback server.
const localOnlyGuard: express.RequestHandler = (req, res, next) => {
  if (!isAllowedHost(req.headers.host)) {
    res.status(403).json({ error: "Forbidden host." });
    return;
  }

  const isMutation = req.method !== "GET" && req.method !== "HEAD";
  if (isMutation && !isAllowedOrigin(req.headers.origin)) {
    res.status(403).json({ error: "Forbidden origin." });
    return;
  }

  next();
};

const resolveUiDist = async (uiDistPath?: string) => {
  if (!uiDistPath) {
    return null;
  }

  try {
    const stats = await fs.stat(uiDistPath);
    if (stats.isDirectory()) {
      return uiDistPath;
    }
  } catch {
    return null;
  }

  return null;
};

export const createApp = async (
  options: ServerOptions = {}
): Promise<express.Express> => {
  const app = express();
  app.use(express.json());

  // Request logging middleware
  app.use((req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
      const duration = Date.now() - start;
      logger.request(req.method, req.path, res.statusCode, duration);
    });
    next();
  });

  app.use("/api", localOnlyGuard);

  app.get("/api/providers", async (_req, res) => {
    try {
      const config = await loadConfig(options);
      res.json({
        providers: sanitizeProvidersForResponse(config.providers),
        current: config.current
      });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post("/api/providers", async (req, res) => {
    try {
      const config = await loadConfig(options);
      const payload = req.body as ProviderConfig;
      const nextConfig = addProvider(config, payload);
      await saveConfig(nextConfig, options);
      res
        .status(201)
        .json({ providers: sanitizeProvidersForResponse(nextConfig.providers) });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  app.put("/api/providers/:id", async (req, res) => {
    try {
      const config = await loadConfig(options);
      const updates = req.body as ProviderConfig;
      const target = findProviderById(config, req.params.id);
      const nextConfig = updateProviderById(config, req.params.id, updates);
      const updatedProvider = findProviderById(nextConfig, req.params.id);
      const isCurrentProvider =
        Boolean(updatedProvider?.id) && updatedProvider?.id === nextConfig.current;

      const customEnvKeysToClear = Array.from(
        new Set([
          ...collectCustomEnvKeysToClear(config),
          ...collectCustomEnvKeysToClear(nextConfig),
          ...collectProviderCustomEnvKeys(target ? [target] : [])
        ])
      );
      const configToSave = {
        ...nextConfig,
        managedCustomEnvKeys: collectProviderCustomEnvKeys(nextConfig.providers)
      };

      await saveConfig(configToSave, options);

      if (isCurrentProvider && updatedProvider) {
        assertProviderHasAuthToken(updatedProvider);
        await applyProviderToClaudeSettings(
          updatedProvider,
          options,
          customEnvKeysToClear
        );
      }

      res.json({ providers: sanitizeProvidersForResponse(configToSave.providers) });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  app.delete("/api/providers/:id", async (req, res) => {
    try {
      const config = await loadConfig(options);
      const target = findProviderById(config, req.params.id);
      const nextConfig = removeProviderById(config, req.params.id);
      const wasCurrentProvider =
        Boolean(target?.id) && target?.id === config.current;
      const customEnvKeysToClear = Array.from(
        new Set([
          ...collectCustomEnvKeysToClear(config),
          ...collectCustomEnvKeysToClear(nextConfig),
          ...collectProviderCustomEnvKeys(target ? [target] : [])
        ])
      );
      const configToSave = {
        ...nextConfig,
        managedCustomEnvKeys: collectProviderCustomEnvKeys(nextConfig.providers)
      };

      await saveConfig(configToSave, options);

      if (wasCurrentProvider) {
        await applyProviderToClaudeSettings(
          DEFAULT_PRESETS[0] ?? { name: "anthropic" },
          options,
          customEnvKeysToClear
        );
      }

      res.json({
        providers: sanitizeProvidersForResponse(configToSave.providers),
        current: configToSave.current
      });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  app.get("/api/current", async (_req, res) => {
    try {
      const config = await loadConfig(options);
      const provider = config.current
        ? findProviderById(config, config.current)
        : undefined;
      res.json({
        current: config.current,
        provider: provider ? sanitizeProviderForResponse(provider) : undefined
      });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.get("/api/backups", async (_req, res) => {
    try {
      const backups = await listClaudeSettingsBackups(options);
      res.json({ backups });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post("/api/backups/restore", async (req, res) => {
    try {
      const { name } = req.body as { name?: string };
      if (!name) {
        res.status(400).json({ error: "Backup name is required." });
        return;
      }
      await restoreClaudeSettingsBackup(name, options);
      res.json({ restored: true });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  app.post("/api/current", async (req, res) => {
    try {
      const config = await loadConfig(options);
      const { id, name } = req.body as { id?: string; name?: string };
      const reference = id ?? name;
      if (!reference) {
        res.status(400).json({ error: "Provider id is required." });
        return;
      }

      const nextConfig = setCurrentProvider(config, reference);
      const provider = findProviderByReference(nextConfig, reference);
      if (!provider) {
        res.status(404).json({ error: "Provider not found." });
        return;
      }

      try {
        assertProviderHasAuthToken(provider);
      } catch (error) {
        res.status(400).json({ error: (error as Error).message });
        return;
      }

      const customEnvKeysToClear = collectCustomEnvKeysToClear(nextConfig);
      const configToSave = {
        ...nextConfig,
        managedCustomEnvKeys: collectProviderCustomEnvKeys(nextConfig.providers)
      };
      await saveConfig(configToSave, options);
      await applyProviderToClaudeSettings(
        provider,
        options,
        customEnvKeysToClear
      );

      res.json({
        current: configToSave.current,
        provider: sanitizeProviderForResponse(provider)
      });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  const uiDist = await resolveUiDist(options.uiDistPath);
  if (uiDist) {
    app.use(express.static(uiDist));
    app.get("*", async (_req, res) => {
      res.sendFile(path.join(uiDist, "index.html"));
    });
  } else {
    app.get("/", (_req, res) => {
      res
        .status(200)
        .send(
          "UI not built. Run `npm -w packages/ui run build` and restart the server."
        );
    });
  }

  return app;
};

export const startServer = async (
  options: ServerOptions,
  port: number
): Promise<Server> => {
  const app = await createApp(options);
  return await new Promise<Server>((resolve, reject) => {
    const server = app.listen(port, "127.0.0.1");
    server.once("error", reject);
    server.once("listening", () => {
      server.removeListener("error", reject);
      resolve(server);
    });
  });
};
