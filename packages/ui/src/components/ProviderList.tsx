import { useState } from "react";
import { Search, Trash2, AlertTriangle, Plus } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { ProviderCard } from "./ProviderCard";
import type { Provider } from "../types";

interface ProviderListProps {
  providers: Provider[];
  current: string | null;
  editing: Provider | null;
  loading: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  onApply: (provider: Provider) => void;
  onEdit: (provider: Provider) => void;
  onDelete: (provider: Provider) => void;
  onAdd: () => void;
  t: (key: string, params?: Record<string, string>) => string;
}

export function ProviderList({
  providers,
  current,
  editing,
  loading,
  search,
  onSearchChange,
  onApply,
  onEdit,
  onDelete,
  onAdd,
  t,
}: ProviderListProps) {
  const [deleteTarget, setDeleteTarget] = useState<Provider | null>(null);
  
  // Sync selected state with editing state
  const selectedId = editing?.id ?? null;

  const handleEdit = (provider: Provider) => {
    onEdit(provider);
  };

  return (
    <>
      <Card className="animate-slide-up h-fit">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>{t('list.title')}</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sand-200/40" />
                <Input
                  placeholder={t('list.search')}
                  value={search}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-9 h-9 w-full sm:w-[200px] text-sm bg-ink-800/50 border-sand-200/10"
                />
              </div>
              <Button
                size="sm"
                onClick={onAdd}
                disabled={loading}
                className="h-9 px-3"
              >
                <Plus className="w-4 h-4 mr-1" />
                {t('list.add')}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {providers.length === 0 ? (
            <div className="text-center py-10 text-sand-200/40">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-ink-800/50 flex items-center justify-center">
                <Search className="w-5 h-5 opacity-40" />
              </div>
              {search ? t('list.noMatch') : t('list.empty')}
            </div>
          ) : (
            providers.map((provider, index) => (
              <div
                key={provider.name}
                style={{ animationDelay: `${index * 50}ms` }}
                className="animate-fade-in"
              >
                <ProviderCard
                  provider={provider}
                  isCurrent={provider.id === current}
                  isSelected={provider.id === selectedId}
                  loading={loading}
                  onApply={onApply}
                  onEdit={onEdit}
                  onDelete={setDeleteTarget}
                  t={t}
                />
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-coral-400" />
              {t('list.deleteConfirm')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('list.deleteWarning', { name: deleteTarget?.name || '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteTarget(null)}>
              {t('list.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-coral-500 text-white hover:bg-coral-400 gap-1.5"
              onClick={() => {
                if (deleteTarget) {
                  onDelete(deleteTarget);
                  setDeleteTarget(null);
                }
              }}
            >
              <Trash2 className="w-4 h-4" />
              {t('list.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
