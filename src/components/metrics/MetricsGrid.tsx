'use client';

import React from 'react';
import { useStore } from '@/context/StoreContext';
import { Users, Clock, ShieldAlert, BadgeIndianRupee } from 'lucide-react';

export function MetricsGrid() {
  const { metrics, setActiveView } = useStore();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 px-4 md:px-6">
      {/* 1. Purple Card: Active Leads & Enquiries */}
      <div
        onClick={() => setActiveView('inbox')}
        className="relative overflow-hidden rounded-3xl p-6 bg-[#8B5CF6] text-white cursor-pointer transition-all duration-200 hover:-translate-y-1 shadow-lg shadow-purple-500/10 group"
      >
        <div className="flex items-start justify-between relative z-10">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-purple-200 mb-1">
              <Users className="w-3.5 h-3.5" />
              <span>Active Leads</span>
            </div>
            <div className="text-4xl md:text-5xl font-black tracking-tight text-white mt-1">
              {metrics.activeLeadsCount}
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/20 text-white backdrop-blur-sm">
            PIPELINE
          </span>
        </div>

        <div className="relative z-10 mt-4 flex items-center justify-between">
          <p className="text-xs text-purple-100 font-medium">
            Open enquiries across WhatsApp &amp; In-Store
          </p>
          <span className="text-xs text-white underline font-semibold group-hover:translate-x-0.5 transition-transform">
            View Inbox →
          </span>
        </div>

        {/* Abstract Line Wave SVG */}
        <svg
          className="absolute -bottom-2 -right-2 w-36 h-24 text-purple-400/25 pointer-events-none"
          viewBox="0 0 144 72"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0 45C24 45 36 20 60 20C84 20 96 55 120 55C132 55 138 35 144 35V72H0V45Z"
            fill="currentColor"
          />
          <path
            d="M0 45C24 45 36 20 60 20C84 20 96 55 120 55C132 55 138 35 144 35"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* 2. Warm Mustard Yellow Card: Follow-up Approvals */}
      <div
        onClick={() => setActiveView('approvals')}
        className="relative overflow-hidden rounded-3xl p-6 bg-[#F59E0B] text-zinc-950 cursor-pointer transition-all duration-200 hover:-translate-y-1 shadow-lg shadow-amber-500/10 group"
      >
        <div className="flex items-start justify-between relative z-10">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-950/80 mb-1">
              <Clock className="w-3.5 h-3.5" />
              <span>Approvals Due</span>
            </div>
            <div className="text-4xl md:text-5xl font-black tracking-tight text-zinc-950 mt-1">
              {metrics.approvalsDueCount}
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-black/15 text-zinc-950 backdrop-blur-sm">
            HUMAN SIGN-OFF
          </span>
        </div>

        <div className="relative z-10 mt-4 flex items-center justify-between">
          <p className="text-xs text-amber-950 font-semibold">
            {metrics.expiringApprovalsCount > 0
              ? `⚡ ${metrics.expiringApprovalsCount} expiring within 45 mins`
              : 'All drafts within SLA window'}
          </p>
          <span className="text-xs text-zinc-950 underline font-bold group-hover:translate-x-0.5 transition-transform">
            Review →
          </span>
        </div>

        {/* Abstract Line Wave SVG */}
        <svg
          className="absolute -bottom-2 -right-2 w-36 h-24 text-amber-600/25 pointer-events-none"
          viewBox="0 0 144 72"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0 50C30 50 45 15 75 15C105 15 115 48 144 48V72H0V50Z"
            fill="currentColor"
          />
          <path
            d="M0 50C30 50 45 15 75 15C105 15 115 48 144 48"
            stroke="#18181B"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* 3. Soft Coral / Peach Card: Payment Status */}
      <div
        onClick={() => setActiveView('payments')}
        className="relative overflow-hidden rounded-3xl p-6 bg-[#FB7185] text-zinc-950 cursor-pointer transition-all duration-200 hover:-translate-y-1 shadow-lg shadow-rose-500/10 group"
      >
        <div className="flex items-start justify-between relative z-10">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-rose-950/80 mb-1">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Pending Verifications</span>
            </div>
            <div className="text-4xl md:text-5xl font-black tracking-tight text-zinc-950 mt-1">
              {metrics.pendingPaymentsCount}
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-black/15 text-zinc-950 backdrop-blur-sm">
            BANK STATUS
          </span>
        </div>

        <div className="relative z-10 mt-4 flex items-center justify-between">
          <p className="text-xs text-rose-950 font-semibold">
            UPI links awaiting bank confirmation
          </p>
          <span className="text-xs text-zinc-950 underline font-bold group-hover:translate-x-0.5 transition-transform">
            Verify →
          </span>
        </div>

        {/* Abstract Line Wave SVG */}
        <svg
          className="absolute -bottom-2 -right-2 w-36 h-24 text-rose-600/25 pointer-events-none"
          viewBox="0 0 144 72"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0 35C20 35 40 60 70 60C100 60 115 25 144 25V72H0V35Z"
            fill="currentColor"
          />
          <path
            d="M0 35C20 35 40 60 70 60C100 60 115 25 144 25"
            stroke="#18181B"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* 4. Mint/Sage Green Card: Recorded Sales Today */}
      <div
        onClick={() => setActiveView('payments')}
        className="relative overflow-hidden rounded-3xl p-6 bg-[#10B981] text-zinc-950 cursor-pointer transition-all duration-200 hover:-translate-y-1 shadow-lg shadow-emerald-500/10 group"
      >
        <div className="flex items-start justify-between relative z-10">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-950/80 mb-1">
              <BadgeIndianRupee className="w-3.5 h-3.5" />
              <span>Sales Recorded Today</span>
            </div>
            <div className="text-3xl md:text-4xl font-black tracking-tight text-zinc-950 mt-1">
              ₹{metrics.todaySalesAmount.toLocaleString('en-IN')}
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-black/15 text-zinc-950 backdrop-blur-sm">
            {metrics.todaySalesCount} CLOSED
          </span>
        </div>

        <div className="relative z-10 mt-4 flex items-center justify-between">
          <p className="text-xs text-emerald-950 font-semibold">
            {metrics.offlineSalesCount} offline walk-ins • Follow-ups suppressed
          </p>
          <span className="text-xs text-zinc-950 underline font-bold group-hover:translate-x-0.5 transition-transform">
            Ledger →
          </span>
        </div>

        {/* Abstract Line Wave SVG */}
        <svg
          className="absolute -bottom-2 -right-2 w-36 h-24 text-emerald-600/25 pointer-events-none"
          viewBox="0 0 144 72"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0 60C35 60 45 25 80 25C110 25 125 45 144 45V72H0V60Z"
            fill="currentColor"
          />
          <path
            d="M0 60C35 60 45 25 80 25C110 25 125 45 144 45"
            stroke="#18181B"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  );
}
