import { useState, useMemo, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { cn } from "../lib/utils";
import { ModelMapping } from "./ModelMapping";
import { Plus, Trash2 } from "lucide-react";
import type { Provider, FormErrors } from "../types";

interface ProviderFormProps {
  editing: Provider | null;
  loading: boolean;
  onSubmit: (data: Partial<Provider>, editingId?: string | null) => void;
  onCancel: () => void;
  t: (key: string, params?: Record<string, string>) => string;
}

const emptyForm: Provider = {
  id: "",
  name: "",
  baseUrl: "",
  authToken: "",
  model: "",
  description: "",
  website: "",
  customEnv: {},
  modelMappings: {
    defaultModel: "",
    smallFastModel: "",
    defaultOpusModel: "",
    defaultSonnetModel: "",
    defaultHaikuModel: "",
    customModels: [],
  },
};

const isValidUrl = (value?: string) => {
  if (!value) return true;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};

const isValidProviderId = (value: string) =>
  /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);

const isValidEnvKey = (value: string) =>
  /^[A-Za-z_][A-Za-z0-9_]*$/.test(value);

type EnvRow = {
  id: string;
  key: string;
  value: string;
};

const customEnvToRows = (customEnv?: Record<string, string>): EnvRow[] =>
  Object.entries(customEnv ?? {}).map(([key, value]) => ({
    id: `env-${key}`,
    key,
    value,
  }));

const rowsToCustomEnv = (rows: EnvRow[]): Record<string, string> =>
  rows.reduce<Record<string, string>>((acc, row) => {
    const key = row.key.trim();
    if (key) {
      acc[key] = row.value;
    }
    return acc;
  }, {});

const customEnvEquals = (
  current: Record<string, string> | undefined,
  original: Record<string, string> | undefined
) => JSON.stringify(current ?? {}) === JSON.stringify(original ?? {});

export function ProviderForm({
  editing,
  loading,
  onSubmit,
  onCancel,
  t,
}: ProviderFormProps) {
  const [form, setForm] = useState<Provider>(emptyForm);
  const [originalForm, setOriginalForm] = useState<Provider | null>(null);
  const [envRows, setEnvRows] = useState<EnvRow[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const envRowId = useRef(0);

  // Sync form with editing prop
  useEffect(() => {
    if (editing) {
      const initialForm = {
        id: editing.id ?? "",
        name: editing.name,
        baseUrl: editing.baseUrl ?? "",
        authToken: "",
        model: editing.model ?? "",
        description: editing.description ?? "",
        website: editing.website ?? "",
        customEnv: editing.customEnv ?? {},
        modelMappings: editing.modelMappings || {
          defaultModel: "",
          smallFastModel: "",
          defaultOpusModel: "",
          defaultSonnetModel: "",
          defaultHaikuModel: "",
          customModels: [],
        },
      };
      setForm(initialForm);
      setOriginalForm(initialForm);
      setEnvRows(customEnvToRows(initialForm.customEnv));
    } else {
      setForm(emptyForm);
      setOriginalForm(null);
      setEnvRows([]);
    }
    setErrors({});
    setTouched({});
  }, [editing]);

  const validate = useMemo(() => {
    const errs: FormErrors = {};

    if (!form.name.trim()) {
      errs.name = t('form.nameRequired');
    }

    if (form.id?.trim()) {
      if (form.id.length > 24) {
        errs.id = t('form.idTooLong');
      } else if (!isValidProviderId(form.id)) {
        errs.id = t('form.idInvalid');
      }
    }

    if (!form.baseUrl?.trim()) {
      errs.baseUrl = t('form.baseUrlRequired');
    } else if (!isValidUrl(form.baseUrl)) {
      errs.baseUrl = t('form.baseUrlInvalid');
    }

    if (!editing && !form.authToken?.trim()) {
      errs.authToken = t('form.authTokenRequired');
    }

    if (form.website?.trim() && !isValidUrl(form.website)) {
      errs.website = t('form.websiteInvalid');
    }

    const envKeys = new Set<string>();
    for (const row of envRows) {
      const key = row.key.trim();
      const hasValue = row.value.length > 0;
      if (!key && !hasValue) {
        continue;
      }
      if (!key) {
        errs.customEnv = t('form.customEnvKeyRequired');
        break;
      }
      if (!isValidEnvKey(key)) {
        errs.customEnv = t('form.customEnvKeyInvalid');
        break;
      }
      if (envKeys.has(key)) {
        errs.customEnv = t('form.customEnvKeyDuplicate');
        break;
      }
      envKeys.add(key);
    }

    return errs;
  }, [form, envRows, editing, t]);

  const isValid = Object.keys(validate).length === 0;

  const handleChange = (field: keyof Provider, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    const errorKey = field as keyof FormErrors;
    if (errors[errorKey]) {
      setErrors((prev) => ({ ...prev, [errorKey]: undefined }));
    }
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors(validate);
  };

  const handleAddEnvRow = () => {
    envRowId.current += 1;
    setEnvRows((prev) => [
      ...prev,
      { id: `env-new-${envRowId.current}`, key: "", value: "" },
    ]);
  };

  const handleEnvRowChange = (
    id: string,
    field: "key" | "value",
    value: string
  ) => {
    setEnvRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
    if (errors.customEnv) {
      setErrors((prev) => ({ ...prev, customEnv: undefined }));
    }
  };

  const handleRemoveEnvRow = (id: string) => {
    setEnvRows((prev) => prev.filter((row) => row.id !== id));
    if (errors.customEnv) {
      setErrors((prev) => ({ ...prev, customEnv: undefined }));
    }
  };

  const handleSubmit = () => {
    setTouched({
      name: true,
      id: true,
      baseUrl: true,
      authToken: true,
      website: true,
      customEnv: true,
    });

    if (!isValid) {
      setErrors(validate);
      return;
    }

    const payload = {
      id: form.id?.trim() || undefined,
      name: form.name.trim(),
      baseUrl: form.baseUrl?.trim() || "",
      authToken: form.authToken?.trim() || "",
      model: form.model?.trim() || "",
      description: form.description?.trim() || "",
      website: form.website?.trim() || "",
      customEnv: rowsToCustomEnv(envRows),
      modelMappings: form.modelMappings,
    };

    onSubmit(payload, editing?.id);
  };

  const handleReset = () => {
    if (editing && originalForm) {
      // 编辑状态下重置为原始值
      setForm(originalForm);
      setEnvRows(customEnvToRows(originalForm.customEnv));
    } else {
      // 新增状态下清空表单
      setForm(emptyForm);
      setEnvRows([]);
    }
    setErrors({});
    setTouched({});
  };

  const handleCancel = () => {
    setForm(emptyForm);
    setOriginalForm(null);
    setEnvRows([]);
    setErrors({});
    setTouched({});
    onCancel();
  };

  const hasChanges = editing && originalForm && (
    form.baseUrl !== originalForm.baseUrl ||
    form.model !== originalForm.model ||
    form.website !== originalForm.website ||
    form.description !== originalForm.description ||
    form.authToken !== originalForm.authToken ||
    !customEnvEquals(rowsToCustomEnv(envRows), originalForm.customEnv)
  );

  return (
    <Card className="animate-slide-up">
      <CardHeader>
        <div className="flex items-center gap-3">
          <CardTitle>
            {editing ? t('form.editTitle') : t('form.addTitle')}
          </CardTitle>
          {editing && (
            <Badge variant="outline" className="text-blue-400 border-blue-400/30 bg-blue-400/10">
              {editing.name}
            </Badge>
          )}
        </div>
        {editing && (
          <p className="text-sm text-sand-200/50 mt-1">
            {t('form.editingHint', { name: editing.name })}
          </p>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">
            {t('form.name')} <span className="text-coral-400">*</span>
          </Label>
          <Input
            id="name"
            value={form.name}
            disabled={Boolean(editing)}
            onChange={(e) => handleChange("name", e.target.value)}
            onBlur={() => handleBlur("name")}
            placeholder={editing ? "" : "e.g. custom"}
            className={cn(
              touched.name && errors.name && "border-coral-400 focus-visible:ring-coral-400/50"
            )}
          />
          {touched.name && errors.name && (
            <p className="text-xs text-coral-400">{errors.name}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="baseUrl">
            Base URL <span className="text-coral-400">*</span>
          </Label>
          <Input
            id="baseUrl"
            value={form.baseUrl}
            onChange={(e) => handleChange("baseUrl", e.target.value)}
            onBlur={() => handleBlur("baseUrl")}
            placeholder="https://api.example.com"
            className={cn(
              touched.baseUrl && errors.baseUrl && "border-coral-400 focus-visible:ring-coral-400/50"
            )}
          />
          {touched.baseUrl && errors.baseUrl && (
            <p className="text-xs text-coral-400">{errors.baseUrl}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="authToken">
            Auth Token {!editing && <span className="text-coral-400">*</span>}
          </Label>
          <Input
            id="authToken"
            type="password"
            value={form.authToken}
            onChange={(e) => handleChange("authToken", e.target.value)}
            onBlur={() => handleBlur("authToken")}
            placeholder="sk-..."
            className={cn(
              touched.authToken && errors.authToken && "border-coral-400 focus-visible:ring-coral-400/50"
            )}
          />
          {editing && (
            <p className="text-xs text-sand-200/50">{t('form.authTokenHint')}</p>
          )}
          {touched.authToken && errors.authToken && (
            <p className="text-xs text-coral-400">{errors.authToken}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="model">{t('form.model')}</Label>
          <Input
            id="model"
            value={form.model}
            onChange={(e) => handleChange("model", e.target.value)}
            placeholder="claude-3-5-sonnet"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="website">{t('form.website')}</Label>
          <Input
            id="website"
            value={form.website}
            onChange={(e) => handleChange("website", e.target.value)}
            onBlur={() => handleBlur("website")}
            placeholder="https://open.bigmodel.cn"
            className={cn(
              touched.website && errors.website && "border-coral-400 focus-visible:ring-coral-400/50"
            )}
          />
          {touched.website && errors.website && (
            <p className="text-xs text-coral-400">{errors.website}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">{t('form.description')}</Label>
          <Textarea
            id="description"
            value={form.description}
            onChange={(e) => handleChange("description", e.target.value)}
            placeholder={editing ? "" : "Provider description"}
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="id">ID</Label>
          <Input
            id="id"
            value={form.id}
            disabled={Boolean(editing)}
            onChange={(e) => handleChange("id", e.target.value)}
            onBlur={() => handleBlur("id")}
            placeholder={editing ? "" : "e.g. my-provider"}
            className={cn(
              touched.id && errors.id && "border-coral-400 focus-visible:ring-coral-400/50"
            )}
          />
          <p className="text-xs text-sand-200/50">
            {editing ? t('form.idEditHint') : t('form.idHint')}
          </p>
          {touched.id && errors.id && (
            <p className="text-xs text-coral-400">{errors.id}</p>
          )}
        </div>

        <div className="space-y-3 pt-4 border-t border-sand-200/10">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-sand-100">
                {t('form.customEnv')}
              </h3>
              <Badge variant="outline" className="text-xs text-sand-200/50">
                {t('form.customEnvOptional')}
              </Badge>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddEnvRow}
              disabled={loading}
            >
              <Plus className="h-4 w-4 mr-1" />
              {t('form.customEnvAdd')}
            </Button>
          </div>

          {envRows.length > 0 ? (
            <div className="space-y-2">
              {envRows.map((row) => (
                <div
                  key={row.id}
                  className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_2.25rem] gap-2"
                >
                  <Input
                    value={row.key}
                    onChange={(e) =>
                      handleEnvRowChange(row.id, "key", e.target.value)
                    }
                    onBlur={() => handleBlur("customEnv")}
                    placeholder={t('form.customEnvKey')}
                    className={cn(
                      touched.customEnv &&
                        errors.customEnv &&
                        "border-coral-400 focus-visible:ring-coral-400/50"
                    )}
                  />
                  <Input
                    value={row.value}
                    onChange={(e) =>
                      handleEnvRowChange(row.id, "value", e.target.value)
                    }
                    onBlur={() => handleBlur("customEnv")}
                    placeholder={t('form.customEnvValue')}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-10 w-9 text-coral-400 hover:text-coral-300 hover:bg-coral-400/10"
                    onClick={() => handleRemoveEnvRow(row.id)}
                    disabled={loading}
                    aria-label={t('form.customEnvRemove')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-sand-200/40">
              {t('form.customEnvEmpty')}
            </p>
          )}
          {touched.customEnv && errors.customEnv && (
            <p className="text-xs text-coral-400">{errors.customEnv}</p>
          )}
        </div>

        {/* Model Mapping Section */}
        <div className="pt-4 border-t border-sand-200/10">
          <ModelMapping
            value={form.modelMappings}
            onChange={(value) => setForm((prev) => ({ ...prev, modelMappings: value }))}
            t={t}
          />
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          <Button onClick={handleSubmit} loading={loading} disabled={!isValid}>
            {editing ? t('form.save') : t('form.add')}
          </Button>
          <Button variant="outline" onClick={handleReset} disabled={loading}>
            {editing ? t('form.reset') : t('form.clear')}
          </Button>
          {editing && (
            <Button variant="ghost" onClick={handleCancel} disabled={loading}>
              {t('form.cancel')}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
