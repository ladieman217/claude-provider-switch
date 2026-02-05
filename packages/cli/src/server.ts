import express from "express";
import path from "path";
import fs from "fs/promises";
import {
  addProvider,
  assertProviderHasAuthToken,
  applyProviderToClaudeSettings,
  ensureConfig,
  findProvider,
  listClaudeSettingsBackups,
  removeProvider,
  restoreClaudeSettingsBackup,
  saveConfig,
  setCurrentProvider,
  updateProvider
} from "./core";
import type { PathsOptions, ProviderConfig } from "./core";

export type ServerOptions = PathsOptions & {
  uiDistPath?: string;
};

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

export const createApp = async (options: ServerOptions = {}) => {
  const app = express();
  app.use(express.json());

  app.get("/api/providers", async (_req, res) => {
    const config = await loadConfig(options);
    res.json({ providers: config.providers, current: config.current });
  });

  app.post("/api/providers", async (req, res) => {
    try {
      const config = await loadConfig(options);
      const payload = req.body as ProviderConfig;
      const nextConfig = addProvider(config, payload);
      await saveConfig(nextConfig, options);
      res.status(201).json({ providers: nextConfig.providers });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  app.put("/api/providers/:name", async (req, res) => {
    try {
      const config = await loadConfig(options);
      const updates = req.body as ProviderConfig;
      const nextConfig = updateProvider(config, req.params.name, updates);
      await saveConfig(nextConfig, options);
      res.json({ providers: nextConfig.providers });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  app.delete("/api/providers/:name", async (req, res) => {
    try {
      const config = await loadConfig(options);
      const nextConfig = removeProvider(config, req.params.name);
      await saveConfig(nextConfig, options);
      res.json({ providers: nextConfig.providers, current: nextConfig.current });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  app.get("/api/current", async (_req, res) => {
    const config = await loadConfig(options);
    const provider = config.current
      ? findProvider(config, config.current)
      : undefined;
    res.json({ current: config.current, provider });
  });

  app.get("/api/backups", async (_req, res) => {
    const backups = await listClaudeSettingsBackups(options);
    res.json({ backups });
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
      const { name } = req.body as { name?: string };
      if (!name) {
        res.status(400).json({ error: "Provider name is required." });
        return;
      }

      const nextConfig = setCurrentProvider(config, name);
      const provider = findProvider(nextConfig, name);
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

      res.json({ current: nextConfig.current, provider });
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

export const startServer = async (options: ServerOptions, port: number) => {
  const app = await createApp(options);
  return app.listen(port);
};
