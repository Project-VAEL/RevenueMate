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
      bg: 'bg-[#FFEAE3] text-[#E24823] border-[#FF5E3A]/35 shadow-sm',
      icon: Zap,
    },
    MEDIUM: {
      label: 'MEDIUM PRIORITY',
      bg: 'bg-[#FEF3C7] text-[#D97706] border-[#F59E0B]/35 shadow-sm',
      icon: AlertCircle,
    },
    LOW: {
      label: 'LOW PRIORITY',
      bg: 'bg-[#FDF9F7] text-[#806761] border-[#FF5E3A]/15',
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
