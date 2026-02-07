import { useState } from "react";
import { Search, Trash2, AlertTriangle } from "lucide-react";
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
  loading: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  onApply: (provider: Provider) => void;
  onEdit: (provider: Provider) => void;
  onDelete: (provider: Provider) => void;
}

export function ProviderList({
  providers,
  current,
  loading,
  search,
  onSearchChange,
  onApply,
  onEdit,
  onDelete,
}: ProviderListProps) {
  const [deleteTarget, setDeleteTarget] = useState<Provider | null>(null);

  return (
    <>
      <Card className="animate-slide-up h-fit">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>Provider 列表</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sand-200/40" />
              <Input
                placeholder="搜索 Provider..."
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-9 h-9 w-full sm:w-[200px] text-sm bg-ink-800/50 border-sand-200/10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {providers.length === 0 ? (
            <div className="text-center py-10 text-sand-200/40">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-ink-800/50 flex items-center justify-center">
                <Search className="w-5 h-5 opacity-40" />
              </div>
              {search ? "未找到匹配的 Provider" : "暂无 Provider"}
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
                  loading={loading}
                  onApply={onApply}
                  onEdit={onEdit}
                  onDelete={setDeleteTarget}
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
              确认删除
            </AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除
              <span className="font-semibold text-sand-100 mx-1">
                {deleteTarget?.name}
              </span>
              吗？此操作不会影响 Claude 的历史配置，但会从列表中移除该 Provider。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteTarget(null)}>
              取消
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
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
