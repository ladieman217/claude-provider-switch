import path from "path";
import os from "os";
import { PathsOptions } from "./types";

export const resolvePaths = (options: PathsOptions = {}) => {
  const fallbackConfigDir = path.join(
    os.homedir(),
    ".config",
    "claude-provider-switch"
  );
  const resolvedConfigPath =
    options.configPath ||
    process.env.CPS_CONFIG_PATH ||
    path.join(fallbackConfigDir, "config.json");
  const resolvedConfigDir =
    options.configDir ||
    process.env.CPS_CONFIG_DIR ||
    path.dirname(resolvedConfigPath);
  const resolvedBackupDir =
    options.backupDir ||
    process.env.CPS_BACKUP_DIR ||
    path.join(resolvedConfigDir, "backups");

  const fallbackClaudeDir = path.join(os.homedir(), ".claude");
  const resolvedClaudeSettingsPath =
    options.claudeSettingsPath ||
    process.env.CPS_CLAUDE_SETTINGS_PATH ||
    path.join(fallbackClaudeDir, "settings.json");
  const resolvedClaudeDir =
    options.claudeDir ||
    process.env.CPS_CLAUDE_DIR ||
    path.dirname(resolvedClaudeSettingsPath);

  return {
    configDir: resolvedConfigDir,
    configPath: resolvedConfigPath,
    backupDir: resolvedBackupDir,
    claudeDir: resolvedClaudeDir,
    claudeSettingsPath: resolvedClaudeSettingsPath
  };
};
