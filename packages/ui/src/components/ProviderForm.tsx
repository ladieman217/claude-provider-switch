import { useState, useMemo, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { cn } from "../lib/utils";
import type { Provider, FormErrors } from "../types";

interface ProviderFormProps {
  editing: Provider | null;
  loading: boolean;
  onSubmit: (data: Partial<Provider>, editingId?: string | null) => void;
  onCancel: () => void;
}

const emptyForm: Provider = {
  id: "",
  name: "",
  baseUrl: "",
  authToken: "",
  model: "",
  description: "",
  website: "",
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

export function ProviderForm({
  editing,
  loading,
  onSubmit,
  onCancel,
}: ProviderFormProps) {
  const [form, setForm] = useState<Provider>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Sync form with editing prop
  useEffect(() => {
    if (editing) {
      setForm({
        id: editing.id ?? "",
        name: editing.name,
        baseUrl: editing.baseUrl ?? "",
        authToken: "",
        model: editing.model ?? "",
        description: editing.description ?? "",
        website: editing.website ?? "",
      });
    } else {
      setForm(emptyForm);
    }
    setErrors({});
    setTouched({});
  }, [editing]);

  const validate = useMemo(() => {
    const errs: FormErrors = {};

    if (!form.name.trim()) {
      errs.name = "Provider 名称不能为空";
    }

    if (form.id?.trim()) {
      if (form.id.length > 24) {
        errs.id = "ID 最多 24 个字符";
      } else if (!isValidProviderId(form.id)) {
        errs.id = "只能使用小写字母、数字和连字符";
      }
    }

    if (!form.baseUrl?.trim()) {
      errs.baseUrl = "Base URL 不能为空";
    } else if (!isValidUrl(form.baseUrl)) {
      errs.baseUrl = "请输入有效的 URL";
    }

    if (!editing && !form.authToken?.trim()) {
      errs.authToken = "Auth Token 不能为空";
    }

    if (form.website?.trim() && !isValidUrl(form.website)) {
      errs.website = "请输入有效的 URL";
    }

    return errs;
  }, [form, editing]);

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

  const handleSubmit = () => {
    setTouched({
      name: true,
      id: true,
      baseUrl: true,
      authToken: true,
      website: true,
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
    };

    onSubmit(payload, editing?.id);
  };

  const handleReset = () => {
    setForm(emptyForm);
    setErrors({});
    setTouched({});
    onCancel();
  };

  return (
    <Card className="animate-slide-up">
      <CardHeader>
        <CardTitle>{editing ? "编辑 Provider" : "新增 Provider"}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">
            名称 <span className="text-coral-400">*</span>
          </Label>
          <Input
            id="name"
            value={form.name}
            disabled={Boolean(editing)}
            onChange={(e) => handleChange("name", e.target.value)}
            onBlur={() => handleBlur("name")}
            placeholder="例如 custom"
            className={cn(
              touched.name && errors.name && "border-coral-400 focus-visible:ring-coral-400/50"
            )}
          />
          {touched.name && errors.name && (
            <p className="text-xs text-coral-400">{errors.name}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="id">ID</Label>
          <Input
            id="id"
            value={form.id}
            disabled={Boolean(editing)}
            onChange={(e) => handleChange("id", e.target.value)}
            onBlur={() => handleBlur("id")}
            placeholder="例如 my-provider"
            className={cn(
              touched.id && errors.id && "border-coral-400 focus-visible:ring-coral-400/50"
            )}
          />
          <p className="text-xs text-sand-200/50">
            {editing
              ? "创建后不可修改"
              : "选填，小写字母/数字/-，最长 24 位"}
          </p>
          {touched.id && errors.id && (
            <p className="text-xs text-coral-400">{errors.id}</p>
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
            <p className="text-xs text-sand-200/50">留空保持不变</p>
          )}
          {touched.authToken && errors.authToken && (
            <p className="text-xs text-coral-400">{errors.authToken}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="model">Model</Label>
          <Input
            id="model"
            value={form.model}
            onChange={(e) => handleChange("model", e.target.value)}
            placeholder="claude-3-5-sonnet"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="website">官网</Label>
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
          <Label htmlFor="description">描述</Label>
          <Textarea
            id="description"
            value={form.description}
            onChange={(e) => handleChange("description", e.target.value)}
            placeholder="Provider 描述"
            rows={3}
          />
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          <Button onClick={handleSubmit} loading={loading} disabled={!isValid}>
            {editing ? "保存" : "新增"}
          </Button>
          <Button variant="outline" onClick={handleReset} disabled={loading}>
            重置
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
