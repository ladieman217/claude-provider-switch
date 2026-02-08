import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import type { Provider, ProvidersResponse, BackupInfo, BackupsResponse } from "../types";

interface UseProvidersOptions {
  t: (key: string, params?: Record<string, string>) => string;
}

export function useProviders(options: UseProvidersOptions) {
  const { t } = options;
  const [providers, setProviders] = useState<Provider[]>([]);
  const [current, setCurrent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const fetchProviders = useCallback(async () => {
    const response = await fetch("/api/providers");
    if (!response.ok) {
      throw new Error(t('toast.error.loadFailed'));
    }
    const data = (await response.json()) as ProvidersResponse;
    setProviders(data.providers);
    setCurrent(data.current);
  }, [t]);

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
        toast.error(t('toast.error.providerIdMissing'));
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
          throw new Error(body.error ?? t('toast.error.applyFailed'));
        }
        await fetchProviders();
        toast.success(t('toast.providerApplied', { name: provider.name }));
        return true;
      } catch (error) {
        toast.error((error as Error).message);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [fetchProviders, t]
  );

  const removeProvider = useCallback(
    async (provider: Provider) => {
      if (!provider.id) {
        toast.error(t('toast.error.providerIdMissing'));
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
          throw new Error(body.error ?? t('toast.error.deleteFailed'));
        }
        await fetchProviders();
        toast.success(t('toast.providerDeleted', { name: provider.name }));
        return true;
      } catch (error) {
        toast.error((error as Error).message);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [fetchProviders, t]
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
          throw new Error(body.error ?? t('toast.error.saveFailed'));
        }

        await fetchProviders();
        toast.success(editingId ? t('toast.providerUpdated') : t('toast.providerAdded'));
        return true;
      } catch (error) {
        toast.error((error as Error).message);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [fetchProviders, t]
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

interface UseBackupsOptions {
  t: (key: string, params?: Record<string, string>) => string;
}

export function useBackups(options: UseBackupsOptions) {
  const { t } = options;
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchBackups = useCallback(async () => {
    const response = await fetch("/api/backups");
    if (!response.ok) {
      throw new Error(t('toast.error.loadFailed'));
    }
    const data = (await response.json()) as BackupsResponse;
    setBackups(data.backups);
  }, [t]);

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
          throw new Error(body.error ?? t('toast.error.restoreFailed'));
        }
        await fetchBackups();
        toast.success(t('toast.backupRestored'));
        return true;
      } catch (error) {
        toast.error((error as Error).message);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [fetchBackups, t]
  );

  return {
    backups,
    loading,
    restoreBackup,
    refresh: fetchBackups,
  };
}
