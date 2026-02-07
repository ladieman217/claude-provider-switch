import { Command } from "commander";
import path from "path";
import net from "net";
import readline from "node:readline/promises";
import packageJson from "../package.json";
import {
  addProvider,
  assertProviderHasAuthToken,
  applyProviderToClaudeSettings,
  ensureConfig,
  findProviderById,
  removeProvider,
  saveConfig,
  setCurrentProviderById
} from "./core";
import type { ProviderConfig } from "./core";
import { startServer } from "./server";

const defaultUiDist = path.resolve(__dirname, "ui");

const program = new Command();

const readTokenFromStdin = async (): Promise<string> =>
  await new Promise<string>((resolve, reject) => {
    let token = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      token += chunk;
    });
    process.stdin.on("end", () => resolve(token.trim()));
    process.stdin.on("error", reject);
  });

const formatProvider = (provider: ProviderConfig) => {
  const parts = [`[${provider.id ?? "-"}] ${provider.name}`];
  if (provider.baseUrl) {
    parts.push(`(${provider.baseUrl})`);
  }
  if (provider.model) {
    parts.push(`[model: ${provider.model}]`);
  }
  return parts.join(" ");
};

const findAvailablePort = async (start: number, attempts = 20) => {
  for (let i = 0; i < attempts; i += 1) {
    const port = start + i;
    const available = await new Promise<boolean>((resolve) => {
      const server = net.createServer();
      server.once("error", () => resolve(false));
      server.once("listening", () => {
        server.close(() => resolve(true));
      });
      server.listen(port, "127.0.0.1");
    });

    if (available) {
      return port;
    }
  }

  throw new Error("No available port found.");
};

const applyProviderById = async (id: string): Promise<ProviderConfig> => {
  const config = await ensureConfig();
  const nextConfig = setCurrentProviderById(config, id);
  const provider = findProviderById(nextConfig, id);
  if (!provider) {
    throw new Error("Provider not found.");
  }

  assertProviderHasAuthToken(provider);
  await saveConfig(nextConfig);
  await applyProviderToClaudeSettings(provider);
  return provider;
};

program.name("claude-provider").description("Claude provider switcher");
program.version(packageJson.version, "-v, --version", "Show CLI version");

program
  .command("version")
  .description("Show CLI version")
  .action(() => {
    console.log(packageJson.version);
  });

program
  .command("list")
  .description("List configured providers")
  .action(async () => {
    const config = await ensureConfig();
    const current = config.current;

    for (const provider of config.providers) {
      const marker = provider.id === current ? "*" : " ";
      console.log(`${marker} ${formatProvider(provider)}`);
    }
  });

program
  .command("current")
  .description("Show current provider")
  .action(async () => {
    const config = await ensureConfig();
    if (!config.current) {
      console.log("No provider selected.");
      return;
    }

    const provider = findProviderById(config, config.current);
    if (!provider) {
      console.log("Current provider not found in config.");
      return;
    }

    console.log(formatProvider(provider));
  });

program
  .command("use")
  .argument("<id>", "Provider id")
  .description("Use provider by id and apply to Claude settings")
  .action(async (id: string) => {
    try {
      const provider = await applyProviderById(id);
      console.log(`Applied provider '${provider.name}'.`);
    } catch (error) {
      console.error((error as Error).message);
      process.exitCode = 1;
    }
  });

program
  .command("select")
  .description("Interactively select provider and apply to Claude settings")
  .action(async () => {
    const config = await ensureConfig();
    if (config.providers.length === 0) {
      console.error("No providers configured.");
      process.exitCode = 1;
      return;
    }

    if (!process.stdin.isTTY || !process.stdout.isTTY) {
      console.error("Interactive select requires a TTY terminal.");
      process.exitCode = 1;
      return;
    }

    const current = config.current;
    config.providers.forEach((provider, index) => {
      const marker = provider.id === current ? "*" : " ";
      console.log(`${index + 1}. ${marker} ${formatProvider(provider)}`);
    });

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    try {
      const answer = (await rl.question("Select provider by number: ")).trim();
      const selectedIndex = Number.parseInt(answer, 10);
      if (
        !Number.isInteger(selectedIndex) ||
        selectedIndex < 1 ||
        selectedIndex > config.providers.length
      ) {
        console.error("Invalid selection.");
        process.exitCode = 1;
        return;
      }

      const provider = config.providers[selectedIndex - 1];
      if (!provider) {
        console.error("Provider not found.");
        process.exitCode = 1;
        return;
      }
      if (!provider.id) {
        console.error("Provider id is missing.");
        process.exitCode = 1;
        return;
      }

      const applied = await applyProviderById(provider.id);
      console.log(`Applied provider '${applied.name}'.`);
    } catch (error) {
      console.error((error as Error).message);
      process.exitCode = 1;
    } finally {
      rl.close();
    }
  });

program
  .command("add")
  .argument("<name>", "Provider name")
  .option("--id <id>", "Stable provider id (lowercase letters/numbers/hyphen)")
  .option("--base-url <url>", "Base URL")
  .option("--token <token>", "Auth token")
  .option("--token-stdin", "Read auth token from stdin")
  .option("--model <model>", "Model name")
  .option("--website <url>", "Website URL")
  .option("--description <text>", "Description")
  .description("Add a custom provider")
  .action(async (
    name: string,
    options: {
      id?: string;
      baseUrl?: string;
      token?: string;
      tokenStdin?: boolean;
      model?: string;
      website?: string;
      description?: string;
    }
  ) => {
    if (options.token && options.tokenStdin) {
      console.error("Use either --token or --token-stdin, not both.");
      process.exitCode = 1;
      return;
    }

    let authToken = options.token?.trim() ?? "";
    if (options.tokenStdin) {
      if (process.stdin.isTTY) {
        console.error("No stdin input detected for --token-stdin.");
        process.exitCode = 1;
        return;
      }
      authToken = await readTokenFromStdin();
    }

    if (!options.baseUrl?.trim()) {
      console.error("Base URL is required.");
      process.exitCode = 1;
      return;
    }
    if (!authToken) {
      console.error("Auth token is required.");
      process.exitCode = 1;
      return;
    }
    const config = await ensureConfig();
    const provider: ProviderConfig = {
      id: options.id,
      name,
      baseUrl: options.baseUrl,
      authToken,
      model: options.model,
      website: options.website,
      description: options.description,
      preset: false
    };

    const nextConfig = addProvider(config, provider);
    await saveConfig(nextConfig);
    console.log(`Added provider '${name}'.`);
  });

program
  .command("remove")
  .argument("<name>", "Provider name")
  .description("Remove a provider")
  .action(async (name: string) => {
    const config = await ensureConfig();
    const nextConfig = removeProvider(config, name);
    await saveConfig(nextConfig);
    console.log(`Removed provider '${name}'.`);
  });

program
  .command("serve")
  .description("Start local web UI and API server")
  .option("--port <port>", "Port", (value) => Number(value))
  .action(async (options: { port?: number }) => {
    const preferredPort = options.port ?? 8787;
    const port = await findAvailablePort(preferredPort, 20);
    const server = await startServer({ uiDistPath: defaultUiDist }, port);

    server.on("listening", () => {
      console.log(`Server running at http://localhost:${port}`);
    });
  });

program.parseAsync(process.argv);
