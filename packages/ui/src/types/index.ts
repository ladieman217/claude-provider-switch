export interface Provider {
  id?: string;
  name: string;
  baseUrl?: string;
  authToken?: string;
  model?: string;
  preset?: boolean;
  description?: string;
  website?: string;
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
}
