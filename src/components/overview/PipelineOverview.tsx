'use client';

import React, { useState } from 'react';
import { useStore } from '@/context/StoreContext';
import {
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Store,
  ChevronDown,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { PriorityBadge } from '@/components/leads/PriorityBadge';

export function PipelineOverview() {
  const {
    leads,
    approvals,
    payments,
    setActiveView,
    setSelectedLeadId,
    setIsOfflineSaleModalOpen,
  } = useStore();

  const [activeTimeframe, setActiveTimeframe] = useState<'24H' | '1W' | '1Y' | '5Y' | 'All'>('24H');

  const openLeads = leads.filter((l) => l.status !== 'SALE_RECORDED' && l.status !== 'LOST');

  return (
    <div className="space-y-4">
      {/* Center Stage: INSIGHTS & LIVE ACTIVITY (Matching reference image grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column (8 cols): Large Chart Container matching INSIGHTS card */}
        <div className="lg:col-span-7 xl:col-span-7 flex flex-col justify-between rounded-[32px] p-6 bg-[#191A1E] border border-white/[0.07] min-h-[360px]">
          <div>
            {/* Header / Dropdown row */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {/* Store dropdown pill matching Dash dropdown in reference */}
                <button className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-[#22242A] border border-white/[0.05] hover:border-white/10 transition-colors">
                  <div className="w-5 h-5 rounded-lg bg-[#F7B955] text-zinc-950 flex items-center justify-center font-bold text-[10px]">
                    <Store className="w-3 h-3" />
                  </div>
                  <span className="text-xs font-bold text-white">Daily Sales Flow</span>
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                </button>

                <span className="text-xs font-mono font-bold text-zinc-300">
                  ₹124,410
                </span>
              </div>

              {/* Status pill matching reference ↗ +0.24% */}
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#94CCA0]/20 text-[#94CCA0] border border-[#94CCA0]/30 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                +14.2% Live
              </span>
            </div>

            {/* Glowing Hand-drawn Line Chart with Floating Tooltip */}
            <div className="relative h-44 w-full flex flex-col justify-center my-2">
              {/* Floating Tooltip Pill matching reference $39.34 */}
              <div className="absolute left-[54%] top-[14%] -translate-x-1/2 px-2.5 py-1 rounded-xl bg-[#F7B955] text-zinc-950 font-black text-[11px] shadow-lg flex items-center gap-1 pointer-events-none z-10">
                <span>Peak ₹39,400</span>
              </div>

              <svg
                className="w-full h-36 overflow-visible"
                viewBox="0 0 500 120"
                fill="none"
                preserveAspectRatio="none"
              >
                {/* Jagged line with gradient glow matching reference */}
                <path
                  d="M0 100 L 40 95 L 75 110 L 110 85 L 140 90 L 180 65 L 210 75 L 250 45 L 285 20 L 320 50 L 360 30 L 400 60 L 440 25 L 475 40 L 500 35"
                  stroke="white"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Highlight node under the tooltip */}
                <circle cx="285" cy="20" r="4.5" fill="#F7B955" stroke="#fff" strokeWidth="2" />
                <circle cx="440" cy="25" r="4" fill="#94CCA0" stroke="#fff" strokeWidth="1.5" />
              </svg>
            </div>
          </div>

          {/* Bottom Timeframe Pills matching reference (24H, 1W, 1Y, 5Y, All) */}
          <div className="flex items-center gap-2 pt-3 border-t border-white/[0.04]">
            {(['24H', '1W', '1Y', '5Y', 'All'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setActiveTimeframe(tf)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                  activeTimeframe === tf
                    ? 'bg-white text-zinc-950 shadow-md'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* Right Column (5 cols): Activity / Enquiries List matching NEWS card in reference */}
        <div className="lg:col-span-5 xl:col-span-5 flex flex-col justify-between rounded-[32px] p-6 bg-[#191A1E] border border-white/[0.07] min-h-[360px]">
          <div>
            {/* Card Header: LIVE ACTIVITY & See All */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                LIVE ENQUIRIES &amp; LEADS
              </span>
              <button
                onClick={() => setActiveView('inbox')}
                className="text-xs text-zinc-400 hover:text-white font-semibold transition-colors"
              >
                See All
              </button>
            </div>

            {/* List items matching the NEWS layout (publisher pill, title, time, thumbnail) */}
            <div className="space-y-4">
              {/* Item 1 */}
              <div
                onClick={() => {
                  setSelectedLeadId('lead-1');
                  setActiveView('inbox');
                }}
                className="flex items-start justify-between gap-3 group cursor-pointer"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#6B5CE7]" />
                    <span className="font-semibold text-zinc-300">WhatsApp Omnichannel</span>
                  </div>
                  <h5 className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors leading-snug">
                    Pooja Malhotra: Banarasi Katan Silk Saree enquiry for reception
                  </h5>
                  <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> 14m ago
                    </span>
                    <span>•</span>
                    <span className="text-[#94CCA0] font-bold">HIGH INTENT</span>
                  </div>
                </div>

                {/* Saree thumbnail / visual avatar */}
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-950 to-purple-900 border border-purple-500/30 flex items-center justify-center shrink-0 text-purple-300 font-bold text-xs shadow-md">
                  NAVY
                </div>
              </div>

              {/* Item 2 */}
              <div
                onClick={() => {
                  setSelectedLeadId('lead-2');
                  setActiveView('inbox');
                }}
                className="flex items-start justify-between gap-3 group cursor-pointer"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#EE7A5C]" />
                    <span className="font-semibold text-zinc-300">Instagram DM</span>
                  </div>
                  <h5 className="text-xs font-bold text-white group-hover:text-rose-300 transition-colors leading-snug">
                    Rhea Sen: Raw Silk Bridal Lehenga (Stock currently UNKNOWN)
                  </h5>
                  <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> 45m ago
                    </span>
                    <span>•</span>
                    <span className="text-[#F7B955] font-bold">STOCK CHECK</span>
                  </div>
                </div>

                {/* Lehenga thumbnail */}
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-950 to-pink-900 border border-rose-500/30 flex items-center justify-center shrink-0 text-rose-300 font-bold text-xs shadow-md">
                  PINK
                </div>
              </div>

              {/* Item 3 */}
              <div
                onClick={() => {
                  setSelectedLeadId('lead-4');
                  setActiveView('inbox');
                }}
                className="flex items-start justify-between gap-3 group cursor-pointer"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#94CCA0]" />
                    <span className="font-semibold text-zinc-300">In-Store Walk-In</span>
                  </div>
                  <h5 className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors leading-snug">
                    Vikram Mehta: Paid ₹18,500 offline via Counter UPI QR
                  </h5>
                  <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> 2h ago
                    </span>
                    <span>•</span>
                    <span className="text-[#94CCA0] font-bold">SUPPRESSED</span>
                  </div>
                </div>

                {/* Walk-in thumbnail */}
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-950 to-teal-900 border border-emerald-500/30 flex items-center justify-center shrink-0 text-[#94CCA0] font-bold text-xs shadow-md">
                  PAID
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-white/[0.04] flex items-center justify-between text-xs text-zinc-500">
            <span>Omnichannel Engine Active</span>
            <span className="text-purple-400 font-bold cursor-pointer" onClick={() => setActiveView('inbox')}>
              Open Full Inbox →
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
