import { useState, useMemo } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select } from "./ui/select";
import { Switch } from "./ui/switch";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Plus, Trash2 } from "lucide-react";
import type { ModelMappingConfig, CustomModel } from "../types";

interface ModelMappingProps {
  value?: ModelMappingConfig;
  onChange?: (value: ModelMappingConfig) => void;
  availableModels?: string[];
  t: (key: string, params?: Record<string, string>) => string;
}

const CLAUDE_TIERS = [
  { key: "defaultModel", labelKey: "modelMapping.defaultModel", envVar: "ANTHROPIC_MODEL" },
  { key: "smallFastModel", labelKey: "modelMapping.smallFastModel", envVar: "ANTHROPIC_SMALL_FAST_MODEL" },
  { key: "defaultOpusModel", labelKey: "modelMapping.defaultOpusModel", envVar: "ANTHROPIC_DEFAULT_OPUS_MODEL" },
  { key: "defaultSonnetModel", labelKey: "modelMapping.defaultSonnetModel", envVar: "ANTHROPIC_DEFAULT_SONNET_MODEL" },
  { key: "defaultHaikuModel", labelKey: "modelMapping.defaultHaikuModel", envVar: "ANTHROPIC_DEFAULT_HAIKU_MODEL" },
] as const;

export function ModelMapping({ value, onChange, availableModels = [], t }: ModelMappingProps) {
  const [newModelId, setNewModelId] = useState("");
  const [newModelName, setNewModelName] = useState("");

  const config: ModelMappingConfig = value || {
    defaultModel: "",
    smallFastModel: "",
    defaultOpusModel: "",
    defaultSonnetModel: "",
    defaultHaikuModel: "",
    customModels: [],
  };

  const allModels = useMemo(() => {
    const models = new Set<string>(availableModels);
    config.customModels?.forEach((m) => models.add(m.id));
    if (config.defaultModel) models.add(config.defaultModel);
    if (config.smallFastModel) models.add(config.smallFastModel);
    if (config.defaultOpusModel) models.add(config.defaultOpusModel);
    if (config.defaultSonnetModel) models.add(config.defaultSonnetModel);
    if (config.defaultHaikuModel) models.add(config.defaultHaikuModel);
    return Array.from(models).filter(Boolean).sort();
  }, [availableModels, config]);

  const selectOptions = useMemo(() => {
    return allModels.map((m) => ({ value: m, label: m }));
  }, [allModels]);

  const updateMapping = (key: keyof ModelMappingConfig, modelValue: string) => {
    onChange?.({
      ...config,
      [key]: modelValue,
    });
  };

  const addCustomModel = () => {
    if (!newModelId.trim()) return;
    const newModel: CustomModel = {
      id: newModelId.trim(),
      displayName: newModelName.trim() || undefined,
      enabled: true,
    };
    onChange?.({
      ...config,
      customModels: [...(config.customModels || []), newModel],
    });
    setNewModelId("");
    setNewModelName("");
  };

  const removeCustomModel = (id: string) => {
    onChange?.({
      ...config,
      customModels: config.customModels?.filter((m) => m.id !== id) || [],
    });
  };

  const toggleModelEnabled = (id: string) => {
    onChange?.({
      ...config,
      customModels:
        config.customModels?.map((m) =>
          m.id === id ? { ...m, enabled: !m.enabled } : m
        ) || [],
    });
  };

  return (
    <div className="space-y-6">
      {/* Model Mapping Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-sand-100">{t('modelMapping.title')}</h3>
          <Badge variant="outline" className="text-xs text-sand-200/50">
            {t('modelMapping.optional')}
          </Badge>
        </div>

        <div className="grid gap-3">
          {CLAUDE_TIERS.map((tier) => (
            <div key={tier.key} className="flex items-center gap-3">
              <div className="flex-1">
                <Label className="text-xs text-sand-200/70 mb-1 block">
                  {t(tier.labelKey)}
                </Label>
                <Select
                  value={config[tier.key] || ""}
                  onChange={(val) => updateMapping(tier.key, val)}
                  options={selectOptions}
                  placeholder={t('modelMapping.selectPlaceholder')}
                />
              </div>
              <div className="flex-1 pt-5">
                {config[tier.key] && (
                  <span className="text-sm text-mint-400">→ {config[tier.key]}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Custom Models Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-sand-100">{t('modelMapping.customModels')}</h3>
        </div>

        {/* Add New Model */}
        <Card className="bg-ink-800/50 border-sand-200/10">
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">{t('modelMapping.modelId')}</Label>
                <Input
                  value={newModelId}
                  onChange={(e) => setNewModelId(e.target.value)}
                  placeholder="e.g., gpt-4-turbo"
                  className="h-9"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t('modelMapping.displayName')}</Label>
                <Input
                  value={newModelName}
                  onChange={(e) => setNewModelName(e.target.value)}
                  placeholder="e.g., GPT-4 Turbo"
                  className="h-9"
                />
              </div>
            </div>
            <Button
              size="sm"
              onClick={addCustomModel}
              disabled={!newModelId.trim()}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-1" />
              {t('modelMapping.addModel')}
            </Button>
          </CardContent>
        </Card>

        {/* Model List */}
        {config.customModels && config.customModels.length > 0 ? (
          <div className="space-y-2">
            {config.customModels.map((model) => (
              <div
                key={model.id}
                className="flex items-center justify-between p-3 rounded-md bg-ink-800/30 border border-sand-200/10"
              >
                <div className="flex items-center gap-3">
                  <Switch
                    checked={model.enabled}
                    onCheckedChange={() => toggleModelEnabled(model.id)}
                  />
                  <div>
                    <span className="text-sm font-medium text-sand-100">
                      {model.displayName || model.id}
                    </span>
                    {model.displayName && (
                      <span className="text-xs text-sand-200/50 ml-2">({model.id})</span>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-coral-400 hover:text-coral-300 hover:bg-coral-400/10"
                  onClick={() => removeCustomModel(model.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-sand-200/40 text-center py-4">
            {t('modelMapping.noModels')}
          </p>
        )}
      </div>
    </div>
  );
}
