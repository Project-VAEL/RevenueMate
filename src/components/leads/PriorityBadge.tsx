import React from 'react';
import { LeadPriority } from '@/types';
import { Zap, AlertCircle, ArrowDown } from 'lucide-react';

export function PriorityBadge({
  priority,
  showLabel = true,
}: {
  priority: LeadPriority;
  showLabel?: boolean;
}) {
  const meta = {
    HIGH: {
      label: 'HIGH PRIORITY',
      bg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      icon: Zap,
    },
    MEDIUM: {
      label: 'MEDIUM PRIORITY',
      bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      icon: AlertCircle,
    },
    LOW: {
      label: 'LOW PRIORITY',
      bg: 'bg-zinc-800 text-zinc-400 border-zinc-700',
      icon: ArrowDown,
    },
  };

  const item = meta[priority] || meta.LOW;
  const Icon = item.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border tracking-wide uppercase ${item.bg}`}
    >
      <Icon className="w-3 h-3 stroke-[2.5]" />
      {showLabel && item.label}
    </span>
  );
}
