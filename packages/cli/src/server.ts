import express from "express";
import path from "path";
import fs from "fs/promises";
import type { Server } from "http";
import {
  addProvider,
  assertProviderHasAuthToken,
  applyProviderToClaudeSettings,
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
      const nextConfig = updateProviderById(config, req.params.id, updates);
      await saveConfig(nextConfig, options);
      res.json({ providers: sanitizeProvidersForResponse(nextConfig.providers) });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  app.delete("/api/providers/:id", async (req, res) => {
    try {
      const config = await loadConfig(options);
      const nextConfig = removeProviderById(config, req.params.id);
      await saveConfig(nextConfig, options);
      res.json({
        providers: sanitizeProvidersForResponse(nextConfig.providers),
        current: nextConfig.current
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

      await saveConfig(nextConfig, options);
      await applyProviderToClaudeSettings(provider, options);

      res.json({
        current: nextConfig.current,
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
  return app.listen(port, "127.0.0.1");
};
