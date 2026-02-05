import fs from "fs/promises";
import path from "path";
import { resolvePaths } from "./paths";
import { PathsOptions, ProviderConfig } from "./types";

const BACKUP_PREFIX = "settings.backup-";

export type ClaudeSettings = {
  env?: Record<string, string>;
  [key: string]: unknown;
};

const readJsonFile = async <T>(filePath: string): Promise<T> => {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw) as T;
};

const writeJsonFile = async (filePath: string, data: unknown) => {
  const content = `${JSON.stringify(data, null, 2)}\n`;
  await fs.writeFile(filePath, content, "utf8");
};

export const readClaudeSettings = async (
  options: PathsOptions = {}
): Promise<ClaudeSettings> => {
  const { claudeSettingsPath } = resolvePaths(options);

  try {
    return await readJsonFile<ClaudeSettings>(claudeSettingsPath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
    return {};
  }
};

export type ClaudeSettingsBackup = {
  name: string;
  mtime: number;
  size: number;
};

const listBackups = async (claudeDir: string) => {
  try {
    const entries = await fs.readdir(claudeDir, { withFileTypes: true });
    return entries
      .filter(
        (entry) => entry.isFile() && entry.name.startsWith(BACKUP_PREFIX)
      )
      .map((entry) => entry.name);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }
};

const pruneBackups = async (claudeDir: string, keep = 3) => {
  const backups = await listBackups(claudeDir);
  if (backups.length <= keep) {
    return;
  }

  const backupPaths = await Promise.all(
    backups.map(async (name) => {
      const fullPath = path.join(claudeDir, name);
      const stat = await fs.stat(fullPath);
      return { name, fullPath, mtime: stat.mtimeMs };
    })
  );

  backupPaths.sort((a, b) => b.mtime - a.mtime);
  const toRemove = backupPaths.slice(keep);

  await Promise.all(toRemove.map((backup) => fs.unlink(backup.fullPath)));
};

const backupClaudeSettings = async (
  claudeSettingsPath: string,
  claudeDir: string
) => {
  try {
    await fs.access(claudeSettingsPath);
  } catch {
    return;
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupName = `${BACKUP_PREFIX}${timestamp}.json`;
  const backupPath = path.join(claudeDir, backupName);

  await fs.copyFile(claudeSettingsPath, backupPath);
  await pruneBackups(claudeDir, 3);
};

export const listClaudeSettingsBackups = async (
  options: PathsOptions = {}
): Promise<ClaudeSettingsBackup[]> => {
  const { claudeDir } = resolvePaths(options);
  const names = await listBackups(claudeDir);

  const backups = await Promise.all(
    names.map(async (name) => {
      const fullPath = path.join(claudeDir, name);
      const stat = await fs.stat(fullPath);
      return { name, mtime: stat.mtimeMs, size: stat.size };
    })
  );

  return backups.sort((a, b) => b.mtime - a.mtime);
};

export const restoreClaudeSettingsBackup = async (
  name: string,
  options: PathsOptions = {}
): Promise<void> => {
  if (!name || !name.startsWith(BACKUP_PREFIX)) {
    throw new Error("Invalid backup name.");
  }

  const { claudeDir, claudeSettingsPath } = resolvePaths(options);
  const backupPath = path.join(claudeDir, name);

  await fs.mkdir(claudeDir, { recursive: true });
  await backupClaudeSettings(claudeSettingsPath, claudeDir);
  await fs.copyFile(backupPath, claudeSettingsPath);
};

export const applyProviderToClaudeSettings = async (
  provider: ProviderConfig,
  options: PathsOptions = {}
): Promise<ClaudeSettings> => {
  const { claudeDir, claudeSettingsPath } = resolvePaths(options);

  await fs.mkdir(claudeDir, { recursive: true });
  const settings = await readClaudeSettings(options);
  const env =
    settings.env && typeof settings.env === "object"
      ? { ...(settings.env as Record<string, string>) }
      : {};

  const isAnthropic =
    provider.name && provider.name.trim().toLowerCase() === "anthropic";

  if (isAnthropic) {
    delete env.ANTHROPIC_BASE_URL;
    delete env.ANTHROPIC_AUTH_TOKEN;
    delete env.ANTHROPIC_MODEL;
  } else {
    env.ANTHROPIC_BASE_URL = provider.baseUrl ?? "";
    env.ANTHROPIC_AUTH_TOKEN = provider.authToken ?? "";

    if (provider.model && provider.model.trim()) {
      env.ANTHROPIC_MODEL = provider.model.trim();
    } else {
      delete env.ANTHROPIC_MODEL;
    }
  }

  const nextSettings = {
    ...settings,
    env
  };

  await backupClaudeSettings(claudeSettingsPath, claudeDir);
  await writeJsonFile(claudeSettingsPath, nextSettings);

  return nextSettings;
};
