'use client';

import React from 'react';
import { useStore } from '@/context/StoreContext';
import {
  Search,
  Sparkles,
  RotateCcw,
  Store,
  CheckCircle2,
  HelpCircle,
  Plus,
} from 'lucide-react';

export function TopHeader() {
  const {
    searchQuery,
    setSearchQuery,
    mockMode,
    setMockMode,
    simulateIncomingEnquiry,
    resetDemoData,
    systemNotification,
    setIsOfflineSaleModalOpen,
    setIsDemoGuideOpen,
  } = useStore();

  return (
    <header className="w-full flex flex-col gap-2 pt-4 px-4 md:px-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#18181C]/70 backdrop-blur-md border border-white/[0.08] rounded-3xl p-4 md:p-5">
        {/* Left Side: Store Identity & Search */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-amber-500 flex items-center justify-center text-white shadow-md">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-white">
                  Kavita&apos;s Ethnic Boutique
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  STORE ACTIVE
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Indiranagar, Bengaluru • Sales Workflow &amp; Follow-up Hub
              </p>
            </div>
          </div>

          {/* Global Search Input */}
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search leads, phone, or product SKU..."
              className="w-full bg-[#121214] border border-white/10 rounded-2xl pl-10 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>
        </div>

        {/* Right Side: Demo Controls & Merchant Profile */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Mock Mode Pill */}
          <button
            onClick={() => setMockMode(!mockMode)}
            className={`px-3 py-1.5 rounded-2xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              mockMode
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
            }`}
            title="Toggle between Mock Demo Data and API mode"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                mockMode ? 'bg-purple-400 animate-pulse' : 'bg-zinc-500'
              }`}
            />
            {mockMode ? 'MOCK MODE: ACTIVE' : 'LIVE API: STANDBY'}
          </button>

          {/* Quick Simulate WhatsApp Enquiry Button */}
          <button
            onClick={simulateIncomingEnquiry}
            className="px-3 py-1.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-sm"
            title="Simulate a real-world customer enquiry arriving via WhatsApp"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>+ Simulate Enquiry</span>
          </button>

          {/* Quick Record Offline Sale Button */}
          <button
            onClick={() => setIsOfflineSaleModalOpen(true)}
            className="px-3.5 py-1.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Record Offline Sale</span>
          </button>

          {/* Reset Seed Data */}
          <button
            onClick={resetDemoData}
            className="p-2 rounded-2xl bg-[#121214] hover:bg-zinc-800 text-zinc-400 hover:text-white border border-white/10 transition-colors"
            title="Reset to default seed dataset"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Interactive Demo Guide */}
          <button
            onClick={() => setIsDemoGuideOpen(true)}
            className="p-2 rounded-2xl bg-[#121214] hover:bg-zinc-800 text-purple-400 hover:text-purple-300 border border-purple-500/30 transition-colors"
            title="Open Demo & Architecture Guide"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* Merchant Profile Avatar */}
          <div className="flex items-center gap-2 pl-2 border-l border-white/10 ml-1">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-rose-400 to-amber-300 text-zinc-950 font-bold text-xs flex items-center justify-center ring-2 ring-purple-500/30">
              KS
            </div>
            <div className="hidden xl:block text-left">
              <p className="text-xs font-semibold text-white leading-tight">Kavita Sharma</p>
              <p className="text-[10px] text-zinc-400">Store Owner (Approver)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Floating System Notification Toast */}
      {systemNotification && (
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-gradient-to-r from-purple-950/90 to-zinc-900/90 border border-purple-500/40 rounded-2xl text-xs text-purple-200 animate-in fade-in slide-in-from-top-2 duration-300 shadow-xl">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
            <span className="font-medium">{systemNotification}</span>
          </div>
          <span className="text-[10px] text-purple-400/80 font-mono">REVENUEMATE CORE</span>
        </div>
      )}
    </header>
  );
}
