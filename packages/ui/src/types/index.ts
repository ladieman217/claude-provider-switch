export interface Provider {
  id?: string;
  name: string;
  baseUrl?: string;
  authToken?: string;
  model?: string;
  preset?: boolean;
  description?: string;
  website?: string;
  customEnv?: Record<string, string>;
  modelMappings?: ModelMappingConfig;
}

export interface ModelMappingConfig {
  defaultModel?: string;        // ANTHROPIC_MODEL
  smallFastModel?: string;      // ANTHROPIC_SMALL_FAST_MODEL
  defaultOpusModel?: string;    // ANTHROPIC_DEFAULT_OPUS_MODEL
  defaultSonnetModel?: string;  // ANTHROPIC_DEFAULT_SONNET_MODEL
  defaultHaikuModel?: string;   // ANTHROPIC_DEFAULT_HAIKU_MODEL
  customModels?: CustomModel[];
}

export interface CustomModel {
  id: string;
  displayName?: string;
  enabled: boolean;
}

export interface ProvidersResponse {
  providers: Provider[];
  current: string | null;
}

export interface BackupInfo {
  name: string;
  mtime: number;
  size: number;
}

export interface BackupsResponse {
  backups: BackupInfo[];
}

export interface FormErrors {
  name?: string;
  id?: string;
  baseUrl?: string;
  authToken?: string;
  website?: string;
  customEnv?: string;
}
