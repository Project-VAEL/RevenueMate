import React from 'react';
import { AlertTriangle, Clock, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';

interface StaleWarningBannerProps {
  title: string;
  message: string;
  actionText?: string;
  onAction?: () => void;
  type?: 'warning' | 'info' | 'error' | 'success';
}

export function StaleWarningBanner({
  title,
  message,
  actionText,
  onAction,
  type = 'warning',
}: StaleWarningBannerProps) {
  const styles = {
    warning: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
    info: 'bg-blue-500/10 border-blue-500/30 text-blue-300',
    error: 'bg-rose-500/10 border-rose-500/30 text-rose-300',
    success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
  };

  const icons = {
    warning: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />,
    info: <Clock className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />,
    error: <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />,
    success: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />,
  };

  return (
    <div className={`rounded-2xl border p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${styles[type]}`}>
      <div className="flex items-start gap-3">
        {icons[type]}
        <div>
          <h4 className="font-semibold text-sm tracking-wide text-white">{title}</h4>
          <p className="text-xs text-zinc-300 mt-0.5 leading-relaxed">{message}</p>
        </div>
      </div>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors shrink-0 flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          {actionText}
        </button>
      )}
    </div>
  );
}

export function LoadingSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-3 animate-pulse p-4">
      <div className="h-4 bg-zinc-800 rounded-full w-3/4"></div>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-3 bg-zinc-800/60 rounded-full w-full"></div>
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-white/10 p-8 text-center flex flex-col items-center justify-center min-h-[220px]">
      <div className="w-12 h-12 rounded-2xl bg-zinc-800/80 flex items-center justify-center text-zinc-400 mb-3">
        <Clock className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-white">{title}</h3>
      <p className="text-xs text-zinc-400 mt-1 max-w-sm">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-4 px-4 py-2 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-medium transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
