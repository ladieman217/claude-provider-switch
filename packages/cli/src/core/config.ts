import fs from "fs/promises";
import { ConfigFile, PathsOptions, ProviderConfig } from "./types";
import { DEFAULT_PRESETS } from "./presets";
import { resolvePaths } from "./paths";
import { readJsonFile, writeJsonFile } from "./fs";

const CONFIG_VERSION = 1 as const;
const PROVIDER_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const normalizeProviderName = (name: string) => name.trim().toLowerCase();
export const normalizeProviderId = (id: string) =>
  id
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24)
    .replace(/-+$/g, "");
const isAnthropicName = (name: string) => normalizeProviderName(name) === "anthropic";
const isAnthropicProvider = (provider: ProviderConfig) =>
  isAnthropicName(provider.name);

const toProviderIdBase = (provider: ProviderConfig) => {
  const explicitId =
    typeof provider.id === "string" ? normalizeProviderId(provider.id) : "";
  if (explicitId) {
    return explicitId;
  }

  const fromName = normalizeProviderId(provider.name);
  return fromName || "provider";
};

const buildUniqueProviderId = (base: string, usedIds: Set<string>) => {
  if (!usedIds.has(base)) {
    usedIds.add(base);
    return base;
  }

  let index = 2;
  let candidate = `${base}-${index}`;
  while (usedIds.has(candidate)) {
    index += 1;
    candidate = `${base}-${index}`;
  }

  usedIds.add(candidate);
  return candidate;
};

const assertValidProviderId = (id: string) => {
  if (id.length > 24) {
    throw new Error("Provider id must be at most 24 characters.");
  }
  if (!PROVIDER_ID_PATTERN.test(id)) {
    throw new Error(
      "Provider id must use lowercase letters, numbers, and hyphens only."
    );
  }
};

export const createDefaultConfig = (): ConfigFile => ({
  version: CONFIG_VERSION,
  current: DEFAULT_PRESETS[0]?.id ?? null,
  providers: DEFAULT_PRESETS.map((provider) => ({ ...provider }))
});

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
      name: normalizeProviderName(provider.name),
      id:
        typeof provider.id === "string"
          ? normalizeProviderId(provider.id)
          : undefined
    }));

  const uniqueProviders = new Map<string, ProviderConfig>();
  for (const provider of normalizedProviders) {
    if (!uniqueProviders.has(provider.name)) {
      uniqueProviders.set(provider.name, provider);
    }
  }

  const usedIds = new Set<string>();
  const providersWithIds = Array.from(uniqueProviders.values()).map((provider) => {
    const id = buildUniqueProviderId(toProviderIdBase(provider), usedIds);
    return {
      ...provider,
      id
    };
  });

  return {
    version: CONFIG_VERSION,
    current: config.current ? normalizeProviderId(config.current) : null,
    providers: providersWithIds
  };
};

export const findProvider = (
  config: ConfigFile,
  name: string
): ProviderConfig | undefined => {
  const normalized = normalizeProviderName(name);
  return config.providers.find((provider) => provider.name === normalized);
};

export const findProviderByReference = (
  config: ConfigFile,
  reference: string
): ProviderConfig | undefined => {
  const normalizedId = normalizeProviderId(reference);
  if (normalizedId) {
    const byId = config.providers.find((provider) => provider.id === normalizedId);
    if (byId) {
      return byId;
    }
  }

  return findProvider(config, reference);
};

export const findProviderById = (
  config: ConfigFile,
  id: string
): ProviderConfig | undefined => {
  const normalizedId = normalizeProviderId(id);
  if (!normalizedId) {
    return undefined;
  }
  return config.providers.find((provider) => provider.id === normalizedId);
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

  const usedIds = new Set(
    config.providers
      .map((item) => (typeof item.id === "string" ? normalizeProviderId(item.id) : ""))
      .filter(Boolean)
  );
  const rawProvidedId =
    typeof provider.id === "string" ? provider.id.trim() : undefined;
  let nextId: string;
  if (rawProvidedId) {
    assertValidProviderId(rawProvidedId);
    const normalizedProvidedId = normalizeProviderId(rawProvidedId);
    if (usedIds.has(normalizedProvidedId)) {
      throw new Error(`Provider id '${normalizedProvidedId}' already exists.`);
    }
    nextId = normalizedProvidedId;
  } else {
    nextId = buildUniqueProviderId(
      toProviderIdBase({ ...provider, name: normalizedName }),
      usedIds
    );
  }

  return {
    ...config,
    providers: [
      ...config.providers,
      {
        ...provider,
        id: nextId,
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
    id: target.id,
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

export const updateProviderById = (
  config: ConfigFile,
  id: string,
  updates: ProviderConfig
): ConfigFile => {
  const normalizedId = normalizeProviderId(id);
  const target = findProviderById(config, normalizedId);
  if (!target) {
    throw new Error(`Provider '${normalizedId}' not found.`);
  }
  if (isAnthropicProvider(target) && target.preset) {
    throw new Error("Anthropic preset is read-only.");
  }

  const nextAuthToken =
    typeof updates.authToken === "string" && updates.authToken.trim()
      ? updates.authToken
      : target.authToken;

  const updatedProvider: ProviderConfig = {
    id: target.id,
    name: target.name,
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
      provider.id === normalizedId ? updatedProvider : provider
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

  const removedId = target?.id;
  return {
    ...config,
    current: removedId && config.current === removedId ? null : config.current,
    providers
  };
};

export const removeProviderById = (config: ConfigFile, id: string): ConfigFile => {
  const normalizedId = normalizeProviderId(id);
  const target = findProviderById(config, normalizedId);
  if (target && isAnthropicProvider(target) && target.preset) {
    throw new Error("Anthropic preset is read-only.");
  }
  const providers = config.providers.filter(
    (provider) => provider.id !== normalizedId
  );

  if (providers.length === config.providers.length) {
    throw new Error(`Provider '${normalizedId}' not found.`);
  }

  return {
    ...config,
    current: config.current === normalizedId ? null : config.current,
    providers
  };
};

export const setCurrentProvider = (config: ConfigFile, name: string): ConfigFile => {
  const provider = findProviderByReference(config, name);
  if (!provider) {
    throw new Error(`Provider '${name}' not found.`);
  }

  return {
    ...config,
    current: provider.id!
  };
};

export const setCurrentProviderById = (
  config: ConfigFile,
  id: string
): ConfigFile => {
  const provider = findProviderById(config, id);
  if (!provider) {
    throw new Error(`Provider id '${id}' not found.`);
  }

  return {
    ...config,
    current: provider.id!
  };
};
