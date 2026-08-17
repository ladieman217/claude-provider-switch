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
  resolvePaths,
  saveConfig,
  setCurrentProvider,
  updateProviderById,
  writeFileAtomically
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

const createMutationQueue = () => {
  let tail = Promise.resolve();

  return async <T>(operation: () => Promise<T>): Promise<T> => {
    const result = tail.then(operation, operation);
    tail = result.then(
      () => undefined,
      () => undefined
    );
    return result;
  };
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
  const runMutation = createMutationQueue();
  app.use(express.json());

  const applySettingsAndSaveConfig = async (
    config: Parameters<typeof saveConfig>[0],
    provider: ProviderConfig,
    customEnvKeysToClear: Iterable<string>
  ) => {
    const { claudeSettingsPath } = resolvePaths(options);
    let previousSettings: string | undefined;

    try {
      previousSettings = await fs.readFile(claudeSettingsPath, "utf8");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw error;
      }
    }

    await applyProviderToClaudeSettings(provider, options, customEnvKeysToClear);
    try {
      await saveConfig(config, options);
    } catch (error) {
      if (previousSettings === undefined) {
        await fs.rm(claudeSettingsPath, { force: true });
      } else {
        await writeFileAtomically(claudeSettingsPath, previousSettings);
      }
      throw error;
    }
  };

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
      const nextConfig = await runMutation(async () => {
        const config = await loadConfig(options);
        const payload = req.body as ProviderConfig;
        const updatedConfig = addProvider(config, payload);
        await saveConfig(updatedConfig, options);
        return updatedConfig;
      });
      res
        .status(201)
        .json({ providers: sanitizeProvidersForResponse(nextConfig.providers) });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  app.put("/api/providers/:id", async (req, res) => {
    try {
      const configToSave = await runMutation(async () => {
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
        const updatedConfig = {
          ...nextConfig,
          managedCustomEnvKeys: collectProviderCustomEnvKeys(nextConfig.providers)
        };

        if (isCurrentProvider && updatedProvider) {
          assertProviderHasAuthToken(updatedProvider);
          await applySettingsAndSaveConfig(
            updatedConfig,
            updatedProvider,
            customEnvKeysToClear
          );
        } else {
          await saveConfig(updatedConfig, options);
        }
        return updatedConfig;
      });

      res.json({ providers: sanitizeProvidersForResponse(configToSave.providers) });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  app.delete("/api/providers/:id", async (req, res) => {
    try {
      const configToSave = await runMutation(async () => {
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
        const updatedConfig = {
          ...nextConfig,
          managedCustomEnvKeys: collectProviderCustomEnvKeys(nextConfig.providers)
        };

        if (wasCurrentProvider) {
          await applySettingsAndSaveConfig(
            updatedConfig,
            DEFAULT_PRESETS[0] ?? { name: "anthropic" },
            customEnvKeysToClear
          );
        } else {
          await saveConfig(updatedConfig, options);
        }
        return updatedConfig;
      });

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
      await runMutation(async () => {
        await restoreClaudeSettingsBackup(name, options);
      });
      res.json({ restored: true });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  app.post("/api/current", async (req, res) => {
    const { id, name } = req.body as { id?: string; name?: string };
    const reference = id ?? name;
    if (!reference) {
      res.status(400).json({ error: "Provider id is required." });
      return;
    }

    try {
      const { configToSave, provider } = await runMutation(async () => {
        const config = await loadConfig(options);
        const nextConfig = setCurrentProvider(config, reference);
        const currentProvider = findProviderByReference(nextConfig, reference);
        if (!currentProvider) {
          const error = new Error("Provider not found.") as Error & {
            statusCode: number;
          };
          error.statusCode = 404;
          throw error;
        }

        assertProviderHasAuthToken(currentProvider);
        const customEnvKeysToClear = collectCustomEnvKeysToClear(nextConfig);
        const updatedConfig = {
          ...nextConfig,
          managedCustomEnvKeys: collectProviderCustomEnvKeys(nextConfig.providers)
        };
        await applySettingsAndSaveConfig(
          updatedConfig,
          currentProvider,
          customEnvKeysToClear
        );
        return { configToSave: updatedConfig, provider: currentProvider };
      });

      res.json({
        current: configToSave.current,
        provider: sanitizeProviderForResponse(provider)
      });
    } catch (error) {
      const statusCode = (error as { statusCode?: number }).statusCode ?? 400;
      res.status(statusCode).json({ error: (error as Error).message });
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
