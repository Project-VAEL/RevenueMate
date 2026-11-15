'use client';

import React from 'react';
import { useStore } from '@/context/StoreContext';
import { MessageSquare, ShieldCheck, CreditCard, Boxes, TrendingUp } from 'lucide-react';

export function MetricsGrid() {
  const { metrics, setActiveView } = useStore();

  return (
    <div className="space-y-4">
      {/* 1. Header Hero Stat with Krishi-Rakshak warm typography */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#806761]">
            TOTAL SALES REVENUE TODAY
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-4xl md:text-5xl font-black tracking-tight text-[#291A17] tabular-nums">
              ₹{metrics.todaySalesAmount.toLocaleString('en-IN')}
            </span>
            <span className="text-2xl font-bold text-[#806761]/70">.00</span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#E8F5E9] text-[#2E7D32] border border-[#2E7D32]/25 shadow-sm">
              <TrendingUp className="w-3 h-3" />
              +14.2% Today
            </span>
            <span className="text-xs text-[#806761] font-semibold">
              {metrics.todaySalesCount} confirmed sales ({metrics.offlineSalesCount} offline walk-ins)
            </span>
          </div>
        </div>

        {/* Section Title & See All */}
        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pt-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#806761]">
            PIPELINE STAGES
          </span>
          <button
            onClick={() => setActiveView('pipeline')}
            className="text-xs text-[#FF5E3A] hover:text-[#E24823] font-bold transition-colors"
          >
            See All →
          </button>
        </div>
      </div>

      {/* 2. The 4 Bento Pill Cards Row styled with Krishi-Rakshak Expressive Tokens */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Warm Terracotta/Coral Gradient */}
        <div
          onClick={() => setActiveView('inbox')}
          className="rounded-[28px] p-5 bg-gradient-to-br from-[#FF5E3A] to-[#FF8367] text-white cursor-pointer transition-all duration-200 hover:-translate-y-1 shadow-[0_12px_28px_rgba(255,94,58,0.25)] flex flex-col justify-between min-h-[175px]"
        >
          {/* Top: Icon + Title + Subtitle */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center font-bold text-xs backdrop-blur-sm">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold leading-tight text-white">Active Leads</h4>
              <p className="text-[10px] text-white/80 font-mono tracking-wider uppercase font-semibold">
                WHATSAPP &amp; IG
              </p>
            </div>
          </div>

          {/* Center: White sparkline wave */}
          <div className="my-2 py-1">
            <svg className="w-full h-8 overflow-visible" viewBox="0 0 100 24" fill="none">
              <path
                d="M0 16 L 15 16 L 25 8 L 35 18 L 45 6 L 55 16 L 65 10 L 75 18 L 88 4 L 100 12"
                stroke="white"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* Bottom: Big bold price & pill badge */}
          <div className="flex items-center justify-between pt-1">
            <div className="text-2xl font-black tracking-tight text-white">
              {metrics.activeLeadsCount} <span className="text-xs font-normal opacity-90">Leads</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-white text-[#FF5E3A] shadow-sm">
              ↗ +4 Today
            </span>
          </div>
        </div>

        {/* Card 2: Warm Amber / Harvest Gold */}
        <div
          onClick={() => setActiveView('approvals')}
          className="rounded-[28px] p-5 bg-gradient-to-br from-[#F59E0B] to-[#FBBF24] text-[#291A17] cursor-pointer transition-all duration-200 hover:-translate-y-1 shadow-[0_12px_28px_rgba(245,158,11,0.22)] flex flex-col justify-between min-h-[175px]"
        >
          {/* Top: Icon + Title + Subtitle */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-black/15 text-[#291A17] flex items-center justify-center font-bold text-xs">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-black leading-tight text-[#291A17]">Approvals Due</h4>
              <p className="text-[10px] text-[#291A17]/70 font-mono tracking-wider uppercase font-bold">
                HUMAN REVIEW
              </p>
            </div>
          </div>

          {/* Center: Dark jagged sparkline wave */}
          <div className="my-2 py-1">
            <svg className="w-full h-8 overflow-visible" viewBox="0 0 100 24" fill="none">
              <path
                d="M0 14 L 12 14 L 22 20 L 35 6 L 48 16 L 60 8 L 72 18 L 84 10 L 100 16"
                stroke="#291A17"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* Bottom: Big bold count & pill badge */}
          <div className="flex items-center justify-between pt-1">
            <div className="text-2xl font-black tracking-tight text-[#291A17]">
              {metrics.approvalsDueCount} <span className="text-xs font-normal opacity-80">Queue</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-black/15 text-[#291A17]">
              ⚡ 18m SLA
            </span>
          </div>
        </div>

        {/* Card 3: Deep Forest Green (Krishi-Rakshak verified success tone) */}
        <div
          onClick={() => setActiveView('payments')}
          className="rounded-[28px] p-5 bg-gradient-to-br from-[#2E7D32] to-[#43A047] text-white cursor-pointer transition-all duration-200 hover:-translate-y-1 shadow-[0_12px_28px_rgba(46,125,50,0.22)] flex flex-col justify-between min-h-[175px]"
        >
          {/* Top: Icon + Title + Subtitle */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center font-bold text-xs backdrop-blur-sm">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold leading-tight text-white">Payment Verification</h4>
              <p className="text-[10px] text-white/80 font-mono tracking-wider uppercase font-semibold">
                UPI &amp; WEBHOOKS
              </p>
            </div>
          </div>

          {/* Center: White jagged sparkline wave */}
          <div className="my-2 py-1">
            <svg className="w-full h-8 overflow-visible" viewBox="0 0 100 24" fill="none">
              <path
                d="M0 18 L 15 12 L 30 16 L 45 8 L 60 14 L 75 6 L 88 18 L 100 10"
                stroke="white"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* Bottom: Big bold amount & pill badge */}
          <div className="flex items-center justify-between pt-1">
            <div className="text-2xl font-black tracking-tight text-white">
              {metrics.pendingPaymentsCount} <span className="text-xs font-normal opacity-85">Pending</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-[#2E7D32] shadow-sm">
              2 Links Active
            </span>
          </div>
        </div>

        {/* Card 4: Crisp White Surface with subtle peach border */}
        <div
          onClick={() => setActiveView('catalogue')}
          className="rounded-[28px] p-5 bg-white text-[#291A17] border border-[#FF5E3A]/15 hover:border-[#FF5E3A]/30 cursor-pointer transition-all duration-200 hover:-translate-y-1 shadow-[0_10px_30px_rgba(220,75,40,0.06)] flex flex-col justify-between min-h-[175px]"
        >
          {/* Top: Icon + Title + Subtitle */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#FFEAE3] text-[#FF5E3A] flex items-center justify-center font-bold text-xs">
              <Boxes className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold leading-tight text-[#291A17]">Stock Freshness</h4>
              <p className="text-[10px] text-[#806761] font-mono tracking-wider uppercase font-semibold">
                INVENTORY AUDIT
              </p>
            </div>
          </div>

          {/* Center: Coral sparkline wave */}
          <div className="my-2 py-1">
            <svg className="w-full h-8 overflow-visible" viewBox="0 0 100 24" fill="none">
              <path
                d="M0 16 L 14 16 L 26 10 L 40 18 L 52 8 L 66 14 L 80 6 L 92 14 L 100 8"
                stroke="#FF5E3A"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* Bottom: Big bold count & pill badge */}
          <div className="flex items-center justify-between pt-1">
            <div className="text-2xl font-black tracking-tight text-[#291A17]">
              {metrics.staleStockCount} <span className="text-xs font-normal text-[#806761]">Unknown</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FEF3C7] text-[#D97706] border border-[#F59E0B]/30">
              ⚠ Check Shelf
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
