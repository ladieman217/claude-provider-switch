import fs from "fs/promises";
import path from "path";
import { resolvePaths } from "./paths";
import { PathsOptions, ProviderConfig } from "./types";
import { ensureOwnerOnlyFile, readJsonFile, writeJsonFile } from "./fs";

const BACKUP_PREFIX = "settings.backup-";
const BACKUP_NAME_PATTERN =
  /^settings\.backup-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z\.json$/;

export type ClaudeSettings = {
  env?: Record<string, string>;
  [key: string]: unknown;
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

const listBackups = async (backupDir: string) => {
  try {
    const entries = await fs.readdir(backupDir, { withFileTypes: true });
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

const pruneBackups = async (backupDir: string, keep = 3) => {
  const backups = await listBackups(backupDir);
  if (backups.length <= keep) {
    return;
  }

  const backupPaths = await Promise.all(
    backups.map(async (name) => {
      const fullPath = path.join(backupDir, name);
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
  backupDir: string
) => {
  try {
    await fs.access(claudeSettingsPath);
  } catch {
    return;
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupName = `${BACKUP_PREFIX}${timestamp}.json`;
  const backupPath = path.join(backupDir, backupName);

  await fs.mkdir(backupDir, { recursive: true, mode: 0o700 });
  await fs.copyFile(claudeSettingsPath, backupPath);
  await ensureOwnerOnlyFile(backupPath);
  await pruneBackups(backupDir, 3);
};

export const listClaudeSettingsBackups = async (
  options: PathsOptions = {}
): Promise<ClaudeSettingsBackup[]> => {
  const { backupDir } = resolvePaths(options);
  const names = await listBackups(backupDir);

  const backups = await Promise.all(
    names.map(async (name) => {
      const fullPath = path.join(backupDir, name);
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
  if (!name || !BACKUP_NAME_PATTERN.test(name)) {
    throw new Error("Invalid backup name.");
  }

  const { backupDir, claudeSettingsPath } = resolvePaths(options);
  const resolvedBackupDir = path.resolve(backupDir);
  const backupPath = path.resolve(backupDir, name);
  const relativePath = path.relative(resolvedBackupDir, backupPath);
  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    throw new Error("Invalid backup path.");
  }

  await fs.mkdir(backupDir, { recursive: true, mode: 0o700 });
  await backupClaudeSettings(claudeSettingsPath, backupDir);
  await fs.copyFile(backupPath, claudeSettingsPath);
  await ensureOwnerOnlyFile(claudeSettingsPath);
};

export const applyProviderToClaudeSettings = async (
  provider: ProviderConfig,
  options: PathsOptions = {}
): Promise<ClaudeSettings> => {
  const { claudeDir, backupDir, claudeSettingsPath } = resolvePaths(options);

  await fs.mkdir(claudeDir, { recursive: true, mode: 0o700 });
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
  env.API_TIMEOUT_MS = "3000000";
  if (isAnthropic) {
    delete env.CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC;
  } else {
    env.CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC = "1";
  }

  const nextSettings = {
    ...settings,
    env
  };

  await backupClaudeSettings(claudeSettingsPath, backupDir);
  await writeJsonFile(claudeSettingsPath, nextSettings);

  return nextSettings;
};
