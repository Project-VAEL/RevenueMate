'use client';

import React from 'react';
import { useStore } from '@/context/StoreContext';
import { Search, Bell, Sparkles, RotateCcw } from 'lucide-react';

export function TopHeader() {
  const {
    searchQuery,
    setSearchQuery,
    mockMode,
    setMockMode,
    simulateIncomingEnquiry,
    resetDemoData,
    systemNotification,
  } = useStore();

  return (
    <header className="w-full flex flex-col gap-2 pt-2 px-2 md:px-4">
      <div className="flex items-center justify-between gap-4 py-2">
        {/* Left Side: Minimal Search Bar matching reference image */}
        <div className="flex items-center gap-4 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="SEARCH LEADS, PRODUCTS, CUSTOMERS..."
              className="w-full bg-[#1A1B1F]/60 border border-white/[0.05] hover:border-white/10 rounded-2xl pl-10 pr-4 py-2 text-xs text-zinc-200 placeholder-zinc-500 tracking-wider font-medium focus:outline-none focus:border-white/20 transition-all"
            />
          </div>
        </div>

        {/* Right Side: Demo controls, Notifications, Greeting & Avatar */}
        <div className="flex items-center gap-3">
          {/* Quick Simulate Lead */}
          <button
            onClick={simulateIncomingEnquiry}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F7B955]/15 hover:bg-[#F7B955]/25 text-[#F7B955] border border-[#F7B955]/30 text-[11px] font-bold tracking-wide transition-all"
            title="Simulate incoming WhatsApp lead"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>+ Simulate Lead</span>
          </button>

          {/* Reset Demo Data */}
          <button
            onClick={resetDemoData}
            className="p-2 rounded-xl text-zinc-500 hover:text-zinc-300 transition-colors"
            title="Reset Seed Data"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Notification Bell */}
          <div className="relative p-2 rounded-xl text-zinc-400 hover:text-white transition-colors cursor-pointer">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#EE7A5C]" />
          </div>

          {/* Greeting matching reference image */}
          <div className="flex items-center gap-2.5 pl-2">
            <span className="text-xs font-semibold text-zinc-200 tracking-tight hidden sm:inline">
              Good Evening, Kavita 👋
            </span>

            {/* Circular Avatar */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#EE7A5C] to-[#F7B955] text-zinc-950 font-black text-xs flex items-center justify-center ring-2 ring-white/10 shadow-md">
              KS
            </div>
          </div>
        </div>
      </div>

      {/* Floating System Notification Toast */}
      {systemNotification && (
        <div className="flex items-center justify-between gap-3 px-4 py-2 bg-[#1A1B1F] border border-white/10 rounded-2xl text-xs text-zinc-200 animate-in fade-in slide-in-from-top-1 duration-200">
          <span className="font-medium">{systemNotification}</span>
          <span className="text-[10px] text-zinc-500 font-mono">REVENUEMATE</span>
        </div>
      )}
    </header>
  );
}
