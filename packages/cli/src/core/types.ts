export type CustomModel = {
  id: string;
  displayName?: string;
  enabled: boolean;
};

export type ModelMappingConfig = {
  defaultModel?: string;        // ANTHROPIC_MODEL
  smallFastModel?: string;      // ANTHROPIC_SMALL_FAST_MODEL
  defaultOpusModel?: string;    // ANTHROPIC_DEFAULT_OPUS_MODEL
  defaultSonnetModel?: string;  // ANTHROPIC_DEFAULT_SONNET_MODEL
  defaultHaikuModel?: string;   // ANTHROPIC_DEFAULT_HAIKU_MODEL
  customModels?: CustomModel[];
};

export type ProviderConfig = {
  id?: string;
  name: string;
  baseUrl?: string;
  authToken?: string;
  model?: string;
  preset?: boolean;
  description?: string;
  website?: string;
  modelMappings?: ModelMappingConfig;
};

export type ConfigFile = {
  version: 1;
  current: string | null;
  providers: ProviderConfig[];
};

export type PathsOptions = {
  configDir?: string;
  configPath?: string;
  backupDir?: string;
  claudeDir?: string;
  claudeSettingsPath?: string;
};
