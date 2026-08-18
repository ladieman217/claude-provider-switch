import { describe, expect, it } from "vitest";
import { addProvider, createDefaultConfig, removeProvider } from "../src/core/config";

describe("config", () => {
  it("removes preset provider by id reference", () => {
    const config = createDefaultConfig();

    const nextConfig = removeProvider(config, "volc");

    expect(nextConfig.providers.find((provider) => provider.id === "volc")).toBeFalsy();
  });

  it("keeps valid custom environment variables on providers", () => {
    const config = createDefaultConfig();

    const nextConfig = addProvider(config, {
      name: "local",
      baseUrl: "https://example.com",
      authToken: "token",
      customEnv: {
        FOO_TOKEN: "bar",
        EMPTY_VALUE: ""
      }
    });

    const provider = nextConfig.providers.find((item) => item.name === "local");
    expect(provider?.customEnv).toEqual({
      FOO_TOKEN: "bar",
      EMPTY_VALUE: ""
    });
  });

  it("rejects invalid custom environment variable names", () => {
    const config = createDefaultConfig();

    expect(() =>
      addProvider(config, {
        name: "local",
        baseUrl: "https://example.com",
        authToken: "token",
        customEnv: {
          "BAD-NAME": "bar"
        }
      })
    ).toThrow("Environment variable");
  });

  it("rejects non-HTTP provider URLs", () => {
    const config = createDefaultConfig();

    expect(() =>
      addProvider(config, {
        name: "local",
        baseUrl: "file:///tmp/provider",
        authToken: "token"
      })
    ).toThrow("Base URL must use http or https");
  });
});
