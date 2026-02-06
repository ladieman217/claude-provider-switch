import { ProviderConfig } from "./types";

export const DEFAULT_PRESETS: ProviderConfig[] = [
  {
    id: "anthropic",
    name: "anthropic",
    baseUrl: "https://api.anthropic.com",
    authToken: "",
    model: "",
    preset: true,
    description: "Official Anthropic API",
    website: "https://www.anthropic.com",
  },
  {
    id: "zhipu",
    name: "智谱Coding Plan",
    baseUrl: "https://open.bigmodel.cn/api/anthropic",
    authToken: "",
    model: "",
    preset: true,
    description: "Zhipu AI (GLM) compatible endpoint",
    website: "https://open.bigmodel.cn",
  },
  {
    id: "volc",
    name: "火山方舟Coding Plan",
    baseUrl: "https://ark.cn-beijing.volces.com/api/coding",
    authToken: "",
    model: "ark-code-latest",
    preset: true,
    description: "火山方舟 coding plan anthropic compatible endpoint",
    website: "https://www.volcengine.com",
  },
  {
    id: "custom",
    name: "custom",
    baseUrl: "",
    authToken: "",
    model: "",
    preset: true,
    description: "Custom endpoint",
    website: "",
  },
];
