'use client';

import React from 'react';
import { Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';

interface WorkflowStepBannerProps {
  stepNumber: number;
  totalSteps?: number;
  stageName: string;
  title: string;
  description: string;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
}

export function WorkflowStepBanner({
  stepNumber,
  totalSteps = 7,
  stageName,
  title,
  description,
  primaryActionLabel,
  onPrimaryAction,
}: WorkflowStepBannerProps) {
  return (
    <div className="rounded-[24px] p-4 bg-gradient-to-r from-[#FFF5F2] via-[#FFF0EB] to-[#FFEAE3] border border-[#FF5E3A]/25 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-2xl bg-gradient-to-br from-[#FF5E3A] to-[#FF8367] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-[0_4px_12px_rgba(255,94,58,0.3)]">
          {stepNumber}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#E24823]">
              STAGE {stepNumber} OF {totalSteps}: {stageName}
            </span>
          </div>
          <h3 className="text-xs md:text-sm font-black text-[#291A17] mt-0.5">
            {title}
          </h3>
          <p className="text-[11px] md:text-xs text-[#806761] mt-0.5 leading-relaxed max-w-2xl">
            {description}
          </p>
        </div>
      </div>

      {primaryActionLabel && onPrimaryAction && (
        <button
          onClick={onPrimaryAction}
          className="self-start md:self-center px-4 py-1.5 rounded-full bg-white hover:bg-[#FFF3EE] text-[#FF5E3A] border border-[#FF5E3A]/30 text-xs font-bold transition-all shadow-sm hover:shadow flex items-center gap-1.5 shrink-0"
        >
          <span>{primaryActionLabel}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
