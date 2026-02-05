export type ProviderConfig = {
  name: string;
  baseUrl?: string;
  authToken?: string;
  model?: string;
  preset?: boolean;
  description?: string;
  website?: string;
};

export type ConfigFile = {
  version: 1;
  current: string | null;
  providers: ProviderConfig[];
};

export type PathsOptions = {
  configDir?: string;
  configPath?: string;
  claudeDir?: string;
  claudeSettingsPath?: string;
};
