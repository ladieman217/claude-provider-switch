import { useState, useCallback } from "react";
import { Toaster } from "./components/ui/sonner";
import { Header } from "./components/Header";
import { ProviderList } from "./components/ProviderList";
import { ProviderForm } from "./components/ProviderForm";
import { BackupList } from "./components/BackupList";
import { useProviders, useBackups } from "./hooks/useProviders";
import type { Provider } from "./types";

export default function App() {
  const {
    filteredProviders,
    current,
    currentProvider,
    loading: providersLoading,
    search,
    setSearch,
    applyProvider,
    removeProvider,
    saveProvider,
  } = useProviders();

  const {
    backups,
    loading: backupsLoading,
    restoreBackup,
  } = useBackups();

  const [editing, setEditing] = useState<Provider | null>(null);

  const handleEdit = useCallback((provider: Provider) => {
    setEditing(provider);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditing(null);
  }, []);

  const handleSubmit = useCallback(
    async (payload: Partial<Provider>, editingId?: string | null) => {
      const success = await saveProvider(payload, editingId);
      if (success) {
        setEditing(null);
      }
      return success;
    },
    [saveProvider]
  );

  const handleDelete = useCallback(
    async (provider: Provider) => {
      await removeProvider(provider);
      if (editing?.id === provider.id) {
        setEditing(null);
      }
    },
    [removeProvider, editing]
  );

  const loading = providersLoading || backupsLoading;

  return (
    <div className="relative min-h-screen">
      <div className="app-background" />
      
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 sm:px-6 py-8 sm:py-12">
        <Header currentProvider={currentProvider} />

        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <ProviderList
            providers={filteredProviders}
            current={current}
            loading={loading}
            search={search}
            onSearchChange={setSearch}
            onApply={applyProvider}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />

          <div className="flex flex-col gap-6">
            <ProviderForm
              editing={editing}
              loading={providersLoading}
              onSubmit={handleSubmit}
              onCancel={handleCancelEdit}
            />

            <BackupList
              backups={backups}
              loading={backupsLoading}
              onRestore={restoreBackup}
            />
          </div>
        </div>
      </div>

      <Toaster position="top-center" />
    </div>
  );
}
