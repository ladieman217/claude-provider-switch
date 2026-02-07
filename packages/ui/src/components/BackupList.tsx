import { useState } from "react";
import { RotateCcw, FileText } from "lucide-react";
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
import type { BackupInfo } from "../types";

interface BackupListProps {
  backups: BackupInfo[];
  loading: boolean;
  onRestore: (backup: BackupInfo) => void;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function BackupList({ backups, loading, onRestore }: BackupListProps) {
  const [restoreTarget, setRestoreTarget] = useState<BackupInfo | null>(null);

  return (
    <>
      <Card className="animate-slide-up" style={{ animationDelay: "100ms" }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-sand-200/60" />
            Claude 设置备份
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {backups.length === 0 ? (
            <div className="text-center py-6 text-sm text-sand-200/40">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
              暂无备份
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {backups.map((backup, index) => (
                <div
                  key={backup.name}
                  className="group flex items-center justify-between gap-3 rounded-lg border border-sand-200/10 bg-ink-800/50 px-4 py-3 transition-all duration-200 hover:bg-ink-800/70 hover:border-sand-200/20"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex flex-col">
                      <span className="font-mono text-sand-100">
                        {formatTime(backup.mtime)}
                      </span>
                      <span className="text-xs text-sand-200/40">
                        {formatFileSize(backup.size)}
                      </span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity"
                    onClick={() => setRestoreTarget(backup)}
                    disabled={loading}
                  >
                    <RotateCcw className="w-4 h-4" />
                    恢复
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
              确定要恢复备份
              <span className="font-semibold text-sand-100 mx-1">
                {restoreTarget ? formatTime(restoreTarget.mtime) : ""}
              </span>
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
                  onRestore(restoreTarget);
                  setRestoreTarget(null);
                }
              }}
            >
              恢复
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
