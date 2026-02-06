import fs from "fs/promises";
import path from "path";
import { ConfigFile, PathsOptions, ProviderConfig } from "./types";
import { DEFAULT_PRESETS } from "./presets";
import { resolvePaths } from "./paths";

const CONFIG_VERSION = 1 as const;

export const normalizeProviderName = (name: string) => name.trim().toLowerCase();
const isAnthropicName = (name: string) => normalizeProviderName(name) === "anthropic";
const isAnthropicProvider = (provider: ProviderConfig) =>
  isAnthropicName(provider.name);

export const createDefaultConfig = (): ConfigFile => ({
  version: CONFIG_VERSION,
  current: DEFAULT_PRESETS[0]?.name ?? null,
  providers: DEFAULT_PRESETS.map((provider) => ({ ...provider }))
});

const readJsonFile = async <T>(filePath: string): Promise<T> => {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw) as T;
};

const ensureOwnerOnlyFile = async (filePath: string) => {
  try {
    await fs.chmod(filePath, 0o600);
  } catch {
    // Ignore chmod errors on unsupported platforms/filesystems.
  }
};

const writeJsonFile = async (filePath: string, data: unknown) => {
  const content = `${JSON.stringify(data, null, 2)}\n`;
  await fs.writeFile(filePath, content, { encoding: "utf8", mode: 0o600 });
  await ensureOwnerOnlyFile(filePath);
};

export const ensureConfig = async (options: PathsOptions = {}): Promise<ConfigFile> => {
  const { configDir, configPath } = resolvePaths(options);
  await fs.mkdir(configDir, { recursive: true, mode: 0o700 });

  try {
    const config = await readJsonFile<ConfigFile>(configPath);
    return normalizeConfig(config);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }

    const config = createDefaultConfig();
    await writeJsonFile(configPath, config);
    return config;
  }
};

export const saveConfig = async (
  config: ConfigFile,
  options: PathsOptions = {}
): Promise<void> => {
  const { configDir, configPath } = resolvePaths(options);
  await fs.mkdir(configDir, { recursive: true, mode: 0o700 });
  await writeJsonFile(configPath, normalizeConfig(config));
};

export const normalizeConfig = (config: ConfigFile): ConfigFile => {
  const providers = Array.isArray(config.providers) ? config.providers : [];
  const normalizedProviders = providers
    .filter((provider): provider is ProviderConfig => Boolean(provider?.name))
    .map((provider) => ({
      ...provider,
      name: normalizeProviderName(provider.name)
    }));

  const uniqueProviders = new Map<string, ProviderConfig>();
  for (const provider of normalizedProviders) {
    if (!uniqueProviders.has(provider.name)) {
      uniqueProviders.set(provider.name, provider);
    }
  }

  return {
    version: CONFIG_VERSION,
    current: config.current ? normalizeProviderName(config.current) : null,
    providers: Array.from(uniqueProviders.values())
  };
};

export const findProvider = (
  config: ConfigFile,
  name: string
): ProviderConfig | undefined => {
  const normalized = normalizeProviderName(name);
  return config.providers.find((provider) => provider.name === normalized);
};

export const assertValidProviderInput = (provider: ProviderConfig) => {
  if (!provider.name.trim()) {
    throw new Error("Provider name is required.");
  }
  if (!provider.baseUrl || !provider.baseUrl.trim()) {
    throw new Error("Base URL is required.");
  }
  if (!provider.authToken || !provider.authToken.trim()) {
    throw new Error("Auth token is required.");
  }
  try {
    new URL(provider.baseUrl);
  } catch {
    throw new Error("Base URL must be a valid URL.");
  }
  if (provider.website) {
    try {
      new URL(provider.website);
    } catch {
      throw new Error("Website must be a valid URL.");
    }
  }
};

export const assertProviderHasAuthToken = (provider: ProviderConfig) => {
  if (isAnthropicProvider(provider)) {
    return;
  }
  if (!provider.baseUrl || !provider.baseUrl.trim()) {
    throw new Error("Base URL is required to apply provider.");
  }
  if (!provider.authToken || !provider.authToken.trim()) {
    throw new Error("Auth token is required to apply provider.");
  }
};

export const addProvider = (
  config: ConfigFile,
  provider: ProviderConfig
): ConfigFile => {
  const normalizedName = normalizeProviderName(provider.name);
  if (config.providers.some((item) => item.name === normalizedName)) {
    throw new Error(`Provider '${normalizedName}' already exists.`);
  }

  assertValidProviderInput(provider);

  return {
    ...config,
    providers: [
      ...config.providers,
      {
        ...provider,
        name: normalizedName,
        preset: false
      }
    ]
  };
};

export const updateProvider = (
  config: ConfigFile,
  name: string,
  updates: ProviderConfig
): ConfigFile => {
  const normalizedName = normalizeProviderName(name);
  const target = findProvider(config, normalizedName);
  if (!target) {
    throw new Error(`Provider '${normalizedName}' not found.`);
  }
  if (isAnthropicName(normalizedName) && target.preset) {
    throw new Error("Anthropic preset is read-only.");
  }

  const nextAuthToken =
    typeof updates.authToken === "string" && updates.authToken.trim()
      ? updates.authToken
      : target.authToken;

  const updatedProvider: ProviderConfig = {
    name: normalizedName,
    baseUrl: updates.baseUrl !== undefined ? updates.baseUrl : target.baseUrl,
    authToken: nextAuthToken,
    model: updates.model !== undefined ? updates.model : target.model,
    website: updates.website !== undefined ? updates.website : target.website,
    description:
      updates.description !== undefined ? updates.description : target.description,
    preset: target.preset
  };

  assertValidProviderInput(updatedProvider);

  return {
    ...config,
    providers: config.providers.map((provider) =>
      provider.name === normalizedName ? updatedProvider : provider
    )
  };
};

export const removeProvider = (config: ConfigFile, name: string): ConfigFile => {
  const normalizedName = normalizeProviderName(name);
  const target = findProvider(config, normalizedName);
  if (target && isAnthropicName(normalizedName) && target.preset) {
    throw new Error("Anthropic preset is read-only.");
  }
  const providers = config.providers.filter(
    (provider) => provider.name !== normalizedName
  );

  if (providers.length === config.providers.length) {
    throw new Error(`Provider '${normalizedName}' not found.`);
  }

  return {
    ...config,
    current: config.current === normalizedName ? null : config.current,
    providers
  };
};

export const setCurrentProvider = (config: ConfigFile, name: string): ConfigFile => {
  const normalizedName = normalizeProviderName(name);
  const provider = findProvider(config, normalizedName);
  if (!provider) {
    throw new Error(`Provider '${normalizedName}' not found.`);
  }

  return {
    ...config,
    current: normalizedName
  };
};
