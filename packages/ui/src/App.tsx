import { useEffect, useMemo, useState } from "react";
import { Badge } from "./components/ui/badge";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Textarea } from "./components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "./components/ui/alert-dialog";
import { cn } from "./lib/utils";

type Provider = {
  name: string;
  baseUrl?: string;
  authToken?: string;
  model?: string;
  preset?: boolean;
  description?: string;
  website?: string;
};

type ProvidersResponse = {
  providers: Provider[];
  current: string | null;
};

type BackupInfo = {
  name: string;
  mtime: number;
  size: number;
};

type BackupsResponse = {
  backups: BackupInfo[];
};

type Status = { type: "success" | "error"; message: string } | null;

const emptyForm: Provider = {
  name: "",
  baseUrl: "",
  authToken: "",
  model: "",
  description: "",
  website: ""
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

export default function App() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [current, setCurrent] = useState<string | null>(null);
  const [form, setForm] = useState<Provider>(emptyForm);
  const [editing, setEditing] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>(null);
  const [loading, setLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Provider | null>(null);
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [restoreTarget, setRestoreTarget] = useState<BackupInfo | null>(null);

  const fetchProviders = async () => {
    const response = await fetch("/api/providers");
    if (!response.ok) {
      throw new Error("Failed to load providers.");
    }
    const data = (await response.json()) as ProvidersResponse;
    setProviders(data.providers);
    setCurrent(data.current);
  };

  const fetchBackups = async () => {
    const response = await fetch("/api/backups");
    if (!response.ok) {
      throw new Error("Failed to load backups.");
    }
    const data = (await response.json()) as BackupsResponse;
    setBackups(data.backups);
  };

  useEffect(() => {
    fetchProviders().catch((error) =>
      setStatus({ type: "error", message: error.message })
    );
    fetchBackups().catch((error) =>
      setStatus({ type: "error", message: error.message })
    );
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditing(null);
  };

  const handleSubmit = async () => {
    setStatus(null);

    if (!form.name.trim()) {
      setStatus({ type: "error", message: "Provider name is required." });
      return;
    }

    if (!form.baseUrl?.trim()) {
      setStatus({ type: "error", message: "Base URL is required." });
      return;
    }

    if (!editing && !form.authToken?.trim()) {
      setStatus({ type: "error", message: "Auth token is required." });
      return;
    }

    if (!form.model?.trim()) {
      setStatus({ type: "error", message: "Model is required." });
      return;
    }

    if (!isValidUrl(form.baseUrl?.trim())) {
      setStatus({ type: "error", message: "Base URL must be valid." });
      return;
    }
    if (!isValidUrl(form.website?.trim())) {
      setStatus({ type: "error", message: "Website must be valid." });
      return;
    }

    const payload = {
      name: form.name.trim(),
      baseUrl: form.baseUrl?.trim() || "",
      authToken: form.authToken?.trim() || "",
      model: form.model?.trim() || "",
      description: form.description?.trim() || "",
      website: form.website?.trim() || ""
    };

    setLoading(true);
    try {
      const endpoint = editing
        ? `/api/providers/${encodeURIComponent(editing)}`
        : "/api/providers";
      const method = editing ? "PUT" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.error ?? "Failed to save provider.");
      }

      await fetchProviders();
      setStatus({ type: "success", message: "Provider saved." });
      resetForm();
    } catch (error) {
      setStatus({ type: "error", message: (error as Error).message });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (provider: Provider) => {
    setEditing(provider.name);
    setForm({
      name: provider.name,
      baseUrl: provider.baseUrl ?? "",
      authToken: "",
      model: provider.model ?? "",
      description: provider.description ?? "",
      website: provider.website ?? ""
    });
  };

  const handleRemove = async (provider: Provider) => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/providers/${encodeURIComponent(provider.name)}`,
        {
        method: "DELETE"
        }
      );
      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.error ?? "Failed to remove provider.");
      }

      await fetchProviders();
      setStatus({ type: "success", message: "Provider removed." });
    } catch (error) {
      setStatus({ type: "error", message: (error as Error).message });
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (name: string) => {
    setLoading(true);
    setStatus(null);
    try {
      const response = await fetch("/api/current", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name })
      });
      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.error ?? "Failed to apply provider.");
      }
      await fetchProviders();
      setStatus({ type: "success", message: `Applied '${name}'.` });
    } catch (error) {
      setStatus({ type: "error", message: (error as Error).message });
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (backup: BackupInfo) => {
    setLoading(true);
    setStatus(null);
    try {
      const response = await fetch("/api/backups/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: backup.name })
      });
      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.error ?? "Failed to restore backup.");
      }
      await fetchBackups();
      setStatus({ type: "success", message: "Backup restored." });
    } catch (error) {
      setStatus({ type: "error", message: (error as Error).message });
    } finally {
      setLoading(false);
    }
  };

  const currentProvider = useMemo(
    () => providers.find((provider) => provider.name === current),
    [providers, current]
  );

  const isAnthropic = (provider: Provider) =>
    provider.name.trim().toLowerCase() === "anthropic";

  const missingFields = (provider: Provider) => {
    if (isAnthropic(provider)) return [];
    const missing: string[] = [];
    if (!provider.baseUrl?.trim()) missing.push("Base URL");
    if (!provider.authToken?.trim()) missing.push("Auth Token");
    if (!provider.model?.trim()) missing.push("Model");
    return missing;
  };

  const canApply = (provider: Provider) => missingFields(provider).length === 0;

  return (
    <div className="relative min-h-screen">
      <div className="app-background" />
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-12">
        <header className="fade-in flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-mint-500/20 p-2 shadow-glow">
              <div className="h-full w-full rounded-xl bg-mint-500/60" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-sand-200/70">
                Claude Provider Switcher
              </p>
              <h1 className="text-3xl font-semibold text-sand-100">
                快速切换 Claude Provider
              </h1>
            </div>
          </div>
          <p className="max-w-2xl text-sm text-sand-200/80">
            管理并应用 Claude Code Provider 配置。所有更改都会写入
            <span className="font-mono text-sand-100"> ~/.claude/settings.json</span>，
            并保留最近 3 份备份。
          </p>
          {currentProvider ? (
            <div className="glass-panel flex flex-wrap items-center gap-3 rounded-2xl px-4 py-3">
              <Badge variant="success">当前</Badge>
              <span className="text-sm font-semibold text-sand-100">
                {currentProvider.name}
              </span>
              <span className="text-xs text-sand-200/70">
                {currentProvider.baseUrl || "未设置 Base URL"}
              </span>
            </div>
          ) : (
            <div className="glass-panel rounded-2xl px-4 py-3 text-sm text-sand-200/80">
              尚未设置当前 Provider。
            </div>
          )}
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <Card className="fade-in">
            <CardHeader>
              <CardTitle>Provider 列表</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {providers.map((provider) => {
                const isCurrent = provider.name === current;
                return (
                  <div
                    key={provider.name}
                    className={cn(
                      "flex flex-col gap-3 rounded-xl border border-sand-200/10 bg-ink-800/60 p-4",
                      isCurrent && "border-mint-400/40 shadow-glow"
                    )}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold text-sand-100">
                            {provider.name}
                          </h3>
                          {isCurrent && <Badge variant="success">当前</Badge>}
                          {provider.preset && <Badge variant="outline">预设</Badge>}
                        </div>
                        <p className="text-xs text-sand-200/70">
                          {provider.description ||
                            provider.baseUrl ||
                            "尚未设置 Base URL"}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleApply(provider.name)}
                          disabled={loading || !canApply(provider)}
                        >
                          应用
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(provider)}
                          disabled={loading || isAnthropic(provider)}
                        >
                          编辑
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeleteTarget(provider)}
                          disabled={loading || isAnthropic(provider)}
                        >
                          删除
                        </Button>
                      </div>
                    </div>
                    <div className="grid gap-2 text-xs text-sand-200/70">
                      <span>Base URL: {provider.baseUrl || "-"}</span>
                      <span>Website: {provider.website || "-"}</span>
                      <span>Model: {provider.model || "-"}</span>
                      {isAnthropic(provider) && (
                        <span className="text-sand-200/80">
                          使用 Claude Code /login 登录状态，配置由系统维护，无法编辑
                        </span>
                      )}
                      {!canApply(provider) && (
                        <span className="text-coral-400">
                          缺少 {missingFields(provider).join(" / ")}，
                          请点击“编辑”补充后再应用
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <div className="flex flex-col gap-6">
            <Card className="fade-in">
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
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, name: event.target.value }))
                  }
                  placeholder="例如 custom"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="baseUrl">
                  Base URL <span className="text-coral-400">*</span>
                </Label>
                <Input
                  id="baseUrl"
                  value={form.baseUrl}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, baseUrl: event.target.value }))
                  }
                  placeholder="https://api.example.com"
                />
                <p className="text-xs text-sand-200/70">必填。</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="authToken">
                  Auth Token{" "}
                  {!editing && <span className="text-coral-400">*</span>}
                </Label>
                <Input
                  id="authToken"
                  type="password"
                  value={form.authToken}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, authToken: event.target.value }))
                  }
                  placeholder="sk-..."
                />
                <p className="text-xs text-sand-200/70">
                  {editing ? "编辑时可留空。" : "必填，用于应用 Provider。"}
                </p>
                {editing && (
                  <p className="text-xs text-sand-200/70">
                    留空表示保持当前 token 不变。
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">
                  Model <span className="text-coral-400">*</span>
                </Label>
                <Input
                  id="model"
                  value={form.model}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, model: event.target.value }))
                  }
                  placeholder="claude-3-5-sonnet"
                />
                <p className="text-xs text-sand-200/70">必填。</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">官网</Label>
                <Input
                  id="website"
                  value={form.website}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, website: event.target.value }))
                  }
                  placeholder="https://open.bigmodel.cn"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">描述</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, description: event.target.value }))
                  }
                  placeholder="Provider 描述"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={handleSubmit} disabled={loading}>
                  {editing ? "保存" : "新增"}
                </Button>
                <Button variant="outline" onClick={resetForm} disabled={loading}>
                  重置
                </Button>
              </div>
                {status && (
                  <div
                    className={cn(
                      "rounded-lg px-3 py-2 text-xs",
                      status.type === "success"
                        ? "bg-mint-500/20 text-mint-400"
                        : "bg-coral-500/20 text-coral-400"
                    )}
                  >
                    {status.message}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="fade-in">
              <CardHeader>
                <CardTitle>Claude 设置备份</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {backups.length === 0 && (
                  <p className="text-sm text-sand-200/70">暂无备份。</p>
                )}
                {backups.map((backup) => (
                  <div
                    key={backup.name}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-sand-200/10 bg-ink-800/60 px-4 py-3"
                  >
                    <div className="flex flex-col gap-1 text-xs text-sand-200/70">
                      <span className="font-mono text-sand-100">
                        {backup.name}
                      </span>
                      <span>
                        {new Date(backup.mtime).toLocaleString()} ·{" "}
                        {Math.round(backup.size / 1024)} KB
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setRestoreTarget(backup)}
                      disabled={loading}
                    >
                      恢复
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除{" "}
              <span className="font-semibold text-sand-100">
                {deleteTarget?.name}
              </span>{" "}
              吗？此操作不会影响 Claude 的历史配置，但会从列表中移除该 Provider。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteTarget(null)}>
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteTarget) {
                  handleRemove(deleteTarget);
                  setDeleteTarget(null);
                }
              }}
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        open={Boolean(restoreTarget)}
        onOpenChange={(open) => {
          if (!open) setRestoreTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>恢复 Claude 设置</AlertDialogTitle>
            <AlertDialogDescription>
              确定要恢复备份{" "}
              <span className="font-semibold text-sand-100">
                {restoreTarget?.name}
              </span>{" "}
              吗？当前设置会先自动备份一次。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRestoreTarget(null)}>
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (restoreTarget) {
                  handleRestore(restoreTarget);
                  setRestoreTarget(null);
                }
              }}
            >
              恢复
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
