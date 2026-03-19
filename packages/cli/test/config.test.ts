import { describe, expect, it } from "vitest";
import { createDefaultConfig, removeProvider } from "../src/core/config";

describe("config", () => {
  it("removes preset provider by id reference", () => {
    const config = createDefaultConfig();

    const nextConfig = removeProvider(config, "volc");

    expect(nextConfig.providers.find((provider) => provider.id === "volc")).toBeFalsy();
  });
});
