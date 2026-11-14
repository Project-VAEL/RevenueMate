'use client';

import React from 'react';
import { useStore } from '@/context/StoreContext';
import { MessageSquare, ShieldCheck, CreditCard, Boxes, TrendingUp, AlertTriangle } from 'lucide-react';

export function MetricsGrid() {
  const { metrics, setActiveView } = useStore();

  return (
    <div className="space-y-4">
      {/* 1. Header Hero Stat matching reference: TOTAL BALANCE / TOTAL SALES TODAY */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
            TOTAL SALES REVENUE TODAY
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-4xl md:text-5xl font-black tracking-tight text-white tabular-nums">
              ₹{metrics.todaySalesAmount.toLocaleString('en-IN')}
            </span>
            <span className="text-2xl font-bold text-zinc-500">.00</span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#94CCA0]/20 text-[#94CCA0] border border-[#94CCA0]/30">
              <TrendingUp className="w-3 h-3" />
              +14.2% Today
            </span>
            <span className="text-xs text-zinc-500 font-medium">
              {metrics.todaySalesCount} confirmed sales ({metrics.offlineSalesCount} offline walk-ins)
            </span>
          </div>
        </div>

        {/* Section Title & See All */}
        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pt-2">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            PIPELINE STAGES
          </span>
          <button
            onClick={() => setActiveView('pipeline')}
            className="text-xs text-zinc-400 hover:text-white font-semibold transition-colors"
          >
            See All
          </button>
        </div>
      </div>

      {/* 2. The 4 Bento Pill Cards Row matching the reference image */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Soft Violet / Periwinkle (Bitcoin style in reference) */}
        <div
          onClick={() => setActiveView('inbox')}
          className="rounded-[28px] p-5 bg-[#6B5CE7] text-white cursor-pointer transition-all duration-200 hover:-translate-y-1 shadow-lg shadow-[#6B5CE7]/15 flex flex-col justify-between min-h-[175px]"
        >
          {/* Top: Icon + Title + Subtitle */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center font-bold text-xs backdrop-blur-sm">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold leading-tight text-white">Active Leads</h4>
              <p className="text-[10px] text-purple-200 font-mono tracking-wider uppercase">
                WHATSAPP &amp; IG
              </p>
            </div>
          </div>

          {/* Center: Hand-drawn style jagged sparkline wave */}
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
              {metrics.activeLeadsCount} <span className="text-xs font-normal opacity-80">Leads</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#94CCA0] text-zinc-950">
              ↗ +4 Today
            </span>
          </div>
        </div>

        {/* Card 2: Buttery Yellow / Mustard (Ripple style in reference) */}
        <div
          onClick={() => setActiveView('approvals')}
          className="rounded-[28px] p-5 bg-[#F7B955] text-zinc-950 cursor-pointer transition-all duration-200 hover:-translate-y-1 shadow-lg shadow-[#F7B955]/15 flex flex-col justify-between min-h-[175px]"
        >
          {/* Top: Icon + Title + Subtitle */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-black/15 text-zinc-950 flex items-center justify-center font-bold text-xs">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-black leading-tight text-zinc-950">Approvals Due</h4>
              <p className="text-[10px] text-zinc-950/70 font-mono tracking-wider uppercase font-bold">
                HUMAN REVIEW
              </p>
            </div>
          </div>

          {/* Center: Dark jagged sparkline wave */}
          <div className="my-2 py-1">
            <svg className="w-full h-8 overflow-visible" viewBox="0 0 100 24" fill="none">
              <path
                d="M0 14 L 12 14 L 22 20 L 35 6 L 48 16 L 60 8 L 72 18 L 84 10 L 100 16"
                stroke="#191A1E"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* Bottom: Big bold count & pill badge */}
          <div className="flex items-center justify-between pt-1">
            <div className="text-2xl font-black tracking-tight text-zinc-950">
              {metrics.approvalsDueCount} <span className="text-xs font-normal opacity-80">Queue</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/15 text-zinc-950">
              ⚡ 18m SLA
            </span>
          </div>
        </div>

        {/* Card 3: Soft Coral / Terracotta (Binance Coin style in reference) */}
        <div
          onClick={() => setActiveView('payments')}
          className="rounded-[28px] p-5 bg-[#EE7A5C] text-zinc-950 cursor-pointer transition-all duration-200 hover:-translate-y-1 shadow-lg shadow-[#EE7A5C]/15 flex flex-col justify-between min-h-[175px]"
        >
          {/* Top: Icon + Title + Subtitle */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-black/15 text-zinc-950 flex items-center justify-center font-bold text-xs">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-black leading-tight text-zinc-950">Payment Verifications</h4>
              <p className="text-[10px] text-zinc-950/70 font-mono tracking-wider uppercase font-bold">
                UPI &amp; WEBHOOKS
              </p>
            </div>
          </div>

          {/* Center: Dark jagged sparkline wave */}
          <div className="my-2 py-1">
            <svg className="w-full h-8 overflow-visible" viewBox="0 0 100 24" fill="none">
              <path
                d="M0 18 L 15 12 L 30 16 L 45 8 L 60 14 L 75 6 L 88 18 L 100 10"
                stroke="#191A1E"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* Bottom: Big bold amount & pill badge */}
          <div className="flex items-center justify-between pt-1">
            <div className="text-2xl font-black tracking-tight text-zinc-950">
              {metrics.pendingPaymentsCount} <span className="text-xs font-normal opacity-80">Pending</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/15 text-zinc-950">
              2 Links Active
            </span>
          </div>
        </div>

        {/* Card 4: Matte Dark Card (Ethereum style in reference) */}
        <div
          onClick={() => setActiveView('catalogue')}
          className="rounded-[28px] p-5 bg-[#191A1E] text-white border border-white/[0.08] hover:border-white/20 cursor-pointer transition-all duration-200 hover:-translate-y-1 shadow-lg shadow-black/20 flex flex-col justify-between min-h-[175px]"
        >
          {/* Top: Icon + Title + Subtitle */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-300 flex items-center justify-center font-bold text-xs">
              <Boxes className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold leading-tight text-white">Stock Freshness</h4>
              <p className="text-[10px] text-zinc-400 font-mono tracking-wider uppercase">
                INVENTORY AUDIT
              </p>
            </div>
          </div>

          {/* Center: Mint green jagged sparkline wave */}
          <div className="my-2 py-1">
            <svg className="w-full h-8 overflow-visible" viewBox="0 0 100 24" fill="none">
              <path
                d="M0 16 L 14 16 L 26 10 L 40 18 L 52 8 L 66 14 L 80 6 L 92 14 L 100 8"
                stroke="#94CCA0"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* Bottom: Big bold count & pill badge */}
          <div className="flex items-center justify-between pt-1">
            <div className="text-2xl font-black tracking-tight text-white">
              {metrics.staleStockCount} <span className="text-xs font-normal text-zinc-400">Unknown</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F7B955]/20 text-[#F7B955] border border-[#F7B955]/30">
              ⚠ Check Shelf
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
