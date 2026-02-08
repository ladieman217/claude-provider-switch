import { useState } from "react";
import { Check, Pencil, Trash2, ExternalLink, Copy, CheckIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { cn } from "../lib/utils";
import type { Provider } from "../types";

interface ProviderCardProps {
  provider: Provider;
  isCurrent: boolean;
  loading: boolean;
  onApply: (provider: Provider) => void;
  onEdit: (provider: Provider) => void;
  onDelete: (provider: Provider) => void;
  t: (key: string, params?: Record<string, string>) => string;
}

const isAnthropic = (provider: Provider) =>
  provider.name.trim().toLowerCase() === "anthropic";

const missingFields = (provider: Provider) => {
  if (isAnthropic(provider)) return [];
  const missing: string[] = [];
  if (!provider.baseUrl?.trim()) missing.push("Base URL");
  if (!provider.authToken?.trim()) missing.push("Auth Token");
  return missing;
};

const canApply = (provider: Provider) =>
  isAnthropic(provider) || missingFields(provider).length === 0;

interface CopyButtonProps {
  text: string;
  t: (key: string, params?: Record<string, string>) => string;
}

function CopyButton({ text, t }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success(t('toast.copied'));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t('toast.copyFailed'));
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center justify-center p-1 rounded hover:bg-sand-200/10 text-sand-200/40 hover:text-sand-200/80 transition-colors"
      title={t('list.copyUrl')}
    >
      {copied ? <CheckIcon className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}

export function ProviderCard({
  provider,
  isCurrent,
  loading,
  onApply,
  onEdit,
  onDelete,
  t,
}: ProviderCardProps) {
  // Check if there are any details to display
  const hasDetails = Boolean(provider.baseUrl || provider.model || provider.website);

  const missing = missingFields(provider);
  const isPreset = provider.preset;
  const isAnthropicProvider = isAnthropic(provider);

  return (
    <div
      className={cn(
        "group relative flex flex-col gap-3 rounded-xl border p-4 transition-all duration-300",
        "border-sand-200/10 bg-ink-800/60 hover:border-sand-200/20 hover:bg-ink-800/80",
        isCurrent &&
          "border-mint-500/40 bg-mint-500/[0.03] shadow-[0_0_30px_rgba(52,211,153,0.1)] hover:border-mint-500/50"
      )}
    >
      {/* Current indicator */}
      {isCurrent && (
        <div className="absolute -left-px top-4 bottom-4 w-1 rounded-r-full bg-mint-500 shadow-glow-sm" />
      )}

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <h3 className="text-lg font-semibold text-sand-100 truncate">
              {provider.name}
            </h3>
            {isCurrent && (
              <Badge variant="success" className="shrink-0">
                <Check className="w-3 h-3 mr-1" />
                {t('list.current')}
              </Badge>
            )}
            {isPreset && <Badge variant="outline">{t('list.preset')}</Badge>}
          </div>
          <p className="text-sm text-sand-200/50 line-clamp-2">
            {provider.description || provider.baseUrl || t('list.empty')}
          </p>
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          {provider.id && (
            <code className="inline-flex items-center px-2 py-0.5 rounded bg-ink-700/50 text-xs font-mono text-sand-200/70 border border-sand-200/10">
              {provider.id}
            </code>
          )}
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant={isCurrent ? "outline" : "default"}
              onClick={() => onApply(provider)}
              disabled={loading || isCurrent || !canApply(provider) || !provider.id}
              className="h-8"
            >
              {isCurrent ? (
                <>
                  <Check className="w-3.5 h-3.5 mr-1" />
                  {t('list.applied')}
                </>
              ) : (
                t('list.apply')
              )}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onEdit(provider)}
              disabled={loading || isAnthropicProvider}
              className="h-8 w-8"
              title={t('list.edit')}
            >
              <Pencil className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onDelete(provider)}
              disabled={loading || isAnthropicProvider}
              className="h-8 w-8 text-coral-400 hover:text-coral-400 hover:bg-coral-500/10"
              title={t('list.delete')}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Details section */}
      {(hasDetails || isAnthropicProvider || missing.length > 0) && (
        <div className="flex flex-col gap-2 pt-2 border-t border-sand-200/10">
          {hasDetails && (
            <div className="flex flex-col gap-1.5 text-xs">
              {/* Base URL - compact single line */}
              {provider.baseUrl && (
                <div className="flex items-center gap-2 group/url">
                  <span className="text-[10px] text-sand-200/30 shrink-0">API</span>
                  <span
                    className="font-mono text-sand-200/60 break-all flex-1"
                    title={provider.baseUrl}
                  >
                    {provider.baseUrl}
                  </span>
                  <CopyButton text={provider.baseUrl} t={t} />
                </div>
              )}

              {/* Model and Website in one row */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                {provider.model && (
                  <span className="text-sand-200/40 text-[11px]">
                    <span className="text-sand-200/30">{t('list.model')}</span>{" "}
                    <span className="text-sand-200/50">{provider.model}</span>
                  </span>
                )}
                {provider.website && (
                  <a
                    href={provider.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-mint-400/70 hover:text-mint-400 transition-colors text-[11px]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="w-3 h-3" />
                    {t('list.website')}
                  </a>
                )}
              </div>
            </div>
          )}

          {isAnthropicProvider && (
            <p className="text-xs text-sand-200/40 italic">
              {t('list.anthropicNote')}
            </p>
          )}

          {missing.length > 0 && (
            <div className="flex items-center gap-2 rounded-md bg-coral-500/10 px-3 py-2 text-xs text-coral-400">
              <span className="font-medium">{t('list.missingConfig')}:</span>
              <span>{missing.join(", ")}</span>
              <span className="text-coral-400/60">{t('list.missingFields')}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
