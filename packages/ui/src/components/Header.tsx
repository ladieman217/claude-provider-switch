import { Boxes } from "lucide-react";
import { Badge } from "./ui/badge";
import type { Provider } from "../types";

interface HeaderProps {
  currentProvider: Provider | undefined;
}

export function Header({ currentProvider }: HeaderProps) {
  return (
    <header className="animate-fade-in flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <div className="relative h-14 w-14 rounded-2xl bg-mint-500/10 p-2.5 ring-1 ring-mint-500/20 shadow-glow-sm">
          <div className="absolute inset-0 rounded-2xl bg-mint-500/20 blur-xl" />
          <Boxes className="relative h-full w-full text-mint-400" />
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-sand-200/60 mb-0.5">
            Claude Provider Switcher
          </p>
          <h1 className="text-3xl font-bold text-sand-100 tracking-tight">
            快速切换 Claude Provider
          </h1>
        </div>
      </div>

      <p className="max-w-2xl text-sm text-sand-200/70 leading-relaxed">
        管理并应用 Claude Code Provider 配置。所有更改都会写入
        <code className="mx-1.5 px-2 py-0.5 rounded bg-ink-800 text-sand-100 text-xs font-mono border border-sand-200/10">
          ~/.claude/settings.json
        </code>
        ，并保留最近 3 份备份。
      </p>

      {currentProvider ? (
        <div className="glass-panel flex flex-wrap items-center gap-3 rounded-xl px-5 py-3.5 border-mint-500/20">
          <Badge variant="success" className="h-6">
            当前
          </Badge>
          <span className="text-base font-semibold text-sand-100">
            {currentProvider.name}
          </span>
          <span className="hidden h-4 w-px bg-sand-200/20 sm:block" />
          <code className="text-xs font-mono text-sand-200/50 bg-ink-800/50 px-2 py-0.5 rounded">
            {currentProvider.id || "-"}
          </code>
          <span className="hidden h-4 w-px bg-sand-200/20 sm:block" />
          <span className="text-xs text-sand-200/50 truncate max-w-[300px]">
            {currentProvider.baseUrl || "未设置 Base URL"}
          </span>
        </div>
      ) : (
        <div className="glass-panel rounded-xl px-5 py-3.5 text-sm text-sand-200/60">
          尚未设置当前 Provider
        </div>
      )}
    </header>
  );
}
