'use client';

import React, { useState } from 'react';
import { useStore } from '@/context/StoreContext';
import {
  TrendingUp,
  Clock,
  Store,
  ChevronDown,
} from 'lucide-react';

export function PipelineOverview() {
  const {
    leads,
    setActiveView,
    setSelectedLeadId,
  } = useStore();

  const [activeTimeframe, setActiveTimeframe] = useState<'24H' | '1W' | '1Y' | '5Y' | 'All'>('24H');

  return (
    <div className="space-y-4">
      {/* Center Stage: INSIGHTS & LIVE ACTIVITY with Krishi-Rakshak Bento Styling */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column (7 cols): Large Chart Container matching INSIGHTS card */}
        <div className="lg:col-span-7 xl:col-span-7 flex flex-col justify-between rounded-[32px] p-6 bg-white border border-[#FF5E3A]/15 shadow-[0_10px_30px_rgba(220,75,40,0.06)] min-h-[360px]">
          <div>
            {/* Header / Dropdown row */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {/* Store dropdown pill */}
                <button className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FFF0EB] border border-[#FF5E3A]/20 hover:border-[#FF5E3A]/40 transition-colors">
                  <div className="w-5 h-5 rounded-full bg-[#FF5E3A] text-white flex items-center justify-center font-bold text-[10px]">
                    <Store className="w-3 h-3" />
                  </div>
                  <span className="text-xs font-bold text-[#291A17]">Daily Sales Flow</span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#806761]" />
                </button>

                <span className="text-xs font-mono font-bold text-[#291A17]">
                  ₹124,410
                </span>
              </div>

              {/* Status pill */}
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#E8F5E9] text-[#2E7D32] border border-[#2E7D32]/25 flex items-center gap-1 shadow-sm">
                <TrendingUp className="w-3 h-3" />
                +14.2% Live
              </span>
            </div>

            {/* Glowing Coral Line Chart with Floating Tooltip */}
            <div className="relative h-44 w-full flex flex-col justify-center my-2">
              {/* Floating Tooltip Pill */}
              <div className="absolute left-[54%] top-[14%] -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-[#FF5E3A] to-[#FF8367] text-white font-black text-[11px] shadow-[0_4px_16px_rgba(255,94,58,0.3)] flex items-center gap-1 pointer-events-none z-10">
                <span>Peak ₹39,400</span>
              </div>

              <svg
                className="w-full h-36 overflow-visible"
                viewBox="0 0 500 120"
                fill="none"
                preserveAspectRatio="none"
              >
                {/* Jagged line with Krishi-Rakshak primary coral glow */}
                <path
                  d="M0 100 L 40 95 L 75 110 L 110 85 L 140 90 L 180 65 L 210 75 L 250 45 L 285 20 L 320 50 L 360 30 L 400 60 L 440 25 L 475 40 L 500 35"
                  stroke="#FF5E3A"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Highlight node under the tooltip */}
                <circle cx="285" cy="20" r="5" fill="#FF5E3A" stroke="#FFFFFF" strokeWidth="2.5" />
                <circle cx="440" cy="25" r="4.5" fill="#2E7D32" stroke="#FFFFFF" strokeWidth="2" />
              </svg>
            </div>
          </div>

          {/* Bottom Timeframe Pills */}
          <div className="flex items-center gap-2 pt-3 border-t border-[#FF5E3A]/10">
            {(['24H', '1W', '1Y', '5Y', 'All'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setActiveTimeframe(tf)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                  activeTimeframe === tf
                    ? 'bg-gradient-to-r from-[#FF5E3A] to-[#FF8367] text-white shadow-sm'
                    : 'text-[#806761] hover:text-[#291A17] hover:bg-[#FFEAE3]/50'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* Right Column (5 cols): Activity / Enquiries List */}
        <div className="lg:col-span-5 xl:col-span-5 flex flex-col justify-between rounded-[32px] p-6 bg-white border border-[#FF5E3A]/15 shadow-[0_10px_30px_rgba(220,75,40,0.06)] min-h-[360px]">
          <div>
            {/* Card Header: LIVE ACTIVITY & See All */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-[#806761]">
                LIVE ENQUIRIES &amp; LEADS
              </span>
              <button
                onClick={() => setActiveView('inbox')}
                className="text-xs text-[#FF5E3A] hover:text-[#E24823] font-bold transition-colors"
              >
                See All →
              </button>
            </div>

            {/* List items */}
            <div className="space-y-4">
              {/* Item 1 */}
              <div
                onClick={() => {
                  setSelectedLeadId('lead-1');
                  setActiveView('inbox');
                }}
                className="flex items-start justify-between gap-3 group cursor-pointer p-2 rounded-2xl hover:bg-[#FFF3EE] transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] text-[#806761]">
                    <span className="w-2 h-2 rounded-full bg-[#2E7D32]" />
                    <span className="font-semibold text-[#291A17]">WhatsApp Omnichannel</span>
                  </div>
                  <h5 className="text-xs font-bold text-[#291A17] group-hover:text-[#FF5E3A] transition-colors leading-snug">
                    Pooja Malhotra: Banarasi Katan Silk Saree enquiry for reception
                  </h5>
                  <div className="flex items-center gap-2 text-[10px] text-[#806761] font-mono">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> 14m ago
                    </span>
                    <span>•</span>
                    <span className="text-[#2E7D32] font-bold">HIGH INTENT</span>
                  </div>
                </div>

                {/* Saree thumbnail / visual avatar */}
                <div className="w-13 h-13 rounded-2xl bg-[#FFEAE3] border border-[#FF5E3A]/25 flex items-center justify-center shrink-0 text-[#FF5E3A] font-black text-xs shadow-sm">
                  NAVY
                </div>
              </div>

              {/* Item 2 */}
              <div
                onClick={() => {
                  setSelectedLeadId('lead-2');
                  setActiveView('inbox');
                }}
                className="flex items-start justify-between gap-3 group cursor-pointer p-2 rounded-2xl hover:bg-[#FFF3EE] transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] text-[#806761]">
                    <span className="w-2 h-2 rounded-full bg-[#FF5E3A]" />
                    <span className="font-semibold text-[#291A17]">Instagram DM</span>
                  </div>
                  <h5 className="text-xs font-bold text-[#291A17] group-hover:text-[#FF5E3A] transition-colors leading-snug">
                    Rhea Sen: Raw Silk Bridal Lehenga (Stock currently UNKNOWN)
                  </h5>
                  <div className="flex items-center gap-2 text-[10px] text-[#806761] font-mono">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> 45m ago
                    </span>
                    <span>•</span>
                    <span className="text-[#D97706] font-bold">STOCK CHECK</span>
                  </div>
                </div>

                {/* Lehenga thumbnail */}
                <div className="w-13 h-13 rounded-2xl bg-[#FEF3C7] border border-[#F59E0B]/30 flex items-center justify-center shrink-0 text-[#D97706] font-black text-xs shadow-sm">
                  PINK
                </div>
              </div>

              {/* Item 3 */}
              <div
                onClick={() => {
                  setSelectedLeadId('lead-4');
                  setActiveView('inbox');
                }}
                className="flex items-start justify-between gap-3 group cursor-pointer p-2 rounded-2xl hover:bg-[#FFF3EE] transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] text-[#806761]">
                    <span className="w-2 h-2 rounded-full bg-[#2E7D32]" />
                    <span className="font-semibold text-[#291A17]">In-Store Walk-In</span>
                  </div>
                  <h5 className="text-xs font-bold text-[#291A17] group-hover:text-[#FF5E3A] transition-colors leading-snug">
                    Vikram Mehta: Paid ₹18,500 offline via Counter UPI QR
                  </h5>
                  <div className="flex items-center gap-2 text-[10px] text-[#806761] font-mono">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> 2h ago
                    </span>
                    <span>•</span>
                    <span className="text-[#2E7D32] font-bold">SUPPRESSED</span>
                  </div>
                </div>

                {/* Walk-in thumbnail */}
                <div className="w-13 h-13 rounded-2xl bg-[#E8F5E9] border border-[#2E7D32]/25 flex items-center justify-center shrink-0 text-[#2E7D32] font-black text-xs shadow-sm">
                  PAID
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#FF5E3A]/10 flex items-center justify-between text-xs text-[#806761]">
            <span>Omnichannel Engine Active</span>
            <span className="text-[#FF5E3A] font-bold cursor-pointer hover:underline" onClick={() => setActiveView('inbox')}>
              Open Full Inbox →
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
