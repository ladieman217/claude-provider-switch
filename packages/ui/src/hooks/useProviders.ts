import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import type { Provider, ProvidersResponse, BackupInfo, BackupsResponse } from "../types";

export function useProviders() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [current, setCurrent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const fetchProviders = useCallback(async () => {
    const response = await fetch("/api/providers");
    if (!response.ok) {
      throw new Error("Failed to load providers.");
    }
    const data = (await response.json()) as ProvidersResponse;
    setProviders(data.providers);
    setCurrent(data.current);
  }, []);

  useEffect(() => {
    fetchProviders().catch((error) => {
      toast.error(error.message);
    });
  }, [fetchProviders]);

  const currentProvider = useMemo(
    () => providers.find((provider) => provider.id === current),
    [providers, current]
  );

  const filteredProviders = useMemo(() => {
    if (!search.trim()) return providers;
    const query = search.toLowerCase();
    return providers.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.id?.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query)
    );
  }, [providers, search]);

  const applyProvider = useCallback(
    async (provider: Provider) => {
      if (!provider.id) {
        toast.error("Provider ID is missing.");
        return false;
      }

      setLoading(true);
      try {
        const response = await fetch("/api/current", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: provider.id }),
        });
        if (!response.ok) {
          const body = await response.json();
          throw new Error(body.error ?? "Failed to apply provider.");
        }
        await fetchProviders();
        toast.success(`已切换到 "${provider.name}"`);
        return true;
      } catch (error) {
        toast.error((error as Error).message);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [fetchProviders]
  );

  const removeProvider = useCallback(
    async (provider: Provider) => {
      if (!provider.id) {
        toast.error("Provider ID is missing.");
        return false;
      }
      setLoading(true);
      try {
        const response = await fetch(
          `/api/providers/${encodeURIComponent(provider.id)}`,
          {
            method: "DELETE",
          }
        );
        if (!response.ok) {
          const body = await response.json();
          throw new Error(body.error ?? "Failed to remove provider.");
        }
        await fetchProviders();
        toast.success(`"${provider.name}" 已删除`);
        return true;
      } catch (error) {
        toast.error((error as Error).message);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [fetchProviders]
  );

  const saveProvider = useCallback(
    async (payload: Partial<Provider>, editingId?: string | null) => {
      setLoading(true);
      try {
        const endpoint = editingId
          ? `/api/providers/${encodeURIComponent(editingId)}`
          : "/api/providers";
        const method = editingId ? "PUT" : "POST";

        const response = await fetch(endpoint, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const body = await response.json();
          throw new Error(body.error ?? "Failed to save provider.");
        }

        await fetchProviders();
        toast.success(editingId ? "Provider 已更新" : "Provider 已创建");
        return true;
      } catch (error) {
        toast.error((error as Error).message);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [fetchProviders]
  );

  return {
    providers,
    filteredProviders,
    current,
    currentProvider,
    loading,
    search,
    setSearch,
    applyProvider,
    removeProvider,
    saveProvider,
    refresh: fetchProviders,
  };
}

export function useBackups() {
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchBackups = useCallback(async () => {
    const response = await fetch("/api/backups");
    if (!response.ok) {
      throw new Error("Failed to load backups.");
    }
    const data = (await response.json()) as BackupsResponse;
    setBackups(data.backups);
  }, []);

  useEffect(() => {
    fetchBackups().catch((error) => {
      toast.error(error.message);
    });
  }, [fetchBackups]);

  const restoreBackup = useCallback(
    async (backup: BackupInfo) => {
      setLoading(true);
      try {
        const response = await fetch("/api/backups/restore", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: backup.name }),
        });
        if (!response.ok) {
          const body = await response.json();
          throw new Error(body.error ?? "Failed to restore backup.");
        }
        await fetchBackups();
        toast.success("备份已恢复");
        return true;
      } catch (error) {
        toast.error((error as Error).message);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [fetchBackups]
  );

  return {
    backups,
    loading,
    restoreBackup,
    refresh: fetchBackups,
  };
}
