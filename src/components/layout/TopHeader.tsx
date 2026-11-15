'use client';

import React from 'react';
import { useStore } from '@/context/StoreContext';
import { Search, Bell, Sparkles, RotateCcw, Laptop } from 'lucide-react';

export function TopHeader() {
  const {
    searchQuery,
    setSearchQuery,
    simulateIncomingEnquiry,
    resetDemoData,
    systemNotification,
  } = useStore();

  return (
    <header className="w-full flex flex-col gap-2 pt-1 px-2 md:px-4">
      <div className="flex items-center justify-between gap-4 py-1.5">
        {/* Left Side: Search Bar */}
        <div className="flex items-center gap-4 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-[#806761] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="SEARCH LAPTOPS, SPECS, SKUS, CUSTOMERS..."
              className="w-full bg-white/90 border border-[#FF5E3A]/15 hover:border-[#FF5E3A]/30 rounded-full pl-10 pr-4 py-2 text-xs text-[#291A17] placeholder-[#806761]/70 tracking-wider font-semibold focus:outline-none focus:border-[#FF5E3A]/50 focus:ring-2 focus:ring-[#FF5E3A]/15 transition-all shadow-sm"
            />
          </div>
        </div>

        {/* Right Side: Demo controls, Notifications, Greeting & Avatar */}
        <div className="flex items-center gap-3">
          {/* Quick Simulate Lead */}
          <button
            onClick={simulateIncomingEnquiry}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#FFEAE3] hover:bg-[#FFD4C7] text-[#E24823] border border-[#FF5E3A]/30 text-[11px] font-bold tracking-wide transition-all shadow-sm"
            title="Simulate incoming WhatsApp enquiry for a laptop"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#FF5E3A]" />
            <span>+ Simulate Lead</span>
          </button>

          {/* Reset Demo Data */}
          <button
            onClick={resetDemoData}
            className="p-2 rounded-full text-[#806761] hover:text-[#291A17] hover:bg-[#FFEAE3]/50 transition-colors"
            title="Reset to Vale Enterprises initial catalog"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Notification Bell */}
          <div className="relative p-2 rounded-full text-[#806761] hover:text-[#291A17] hover:bg-[#FFEAE3]/50 transition-colors cursor-pointer">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#FF5E3A] ring-2 ring-white" />
          </div>

          {/* Store Greeting & Avatar */}
          <div className="flex items-center gap-2.5 pl-2">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xs font-black text-[#291A17] tracking-tight leading-tight">
                Vale Enterprises
              </span>
              <span className="text-[10px] text-[#806761] font-semibold">
                Rajesh Vale (Owner)
              </span>
            </div>

            {/* Circular Avatar */}
            <div
              className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#FF5E3A] to-[#FF8568] text-white font-black text-xs flex items-center justify-center ring-2 ring-[#FF5E3A]/25 shadow-md cursor-pointer"
              title="Vale Enterprises - Commercial & Gaming Laptops"
            >
              VE
            </div>
          </div>
        </div>
      </div>

      {/* Floating System Notification Toast */}
      {systemNotification && (
        <div className="flex items-center justify-between gap-3 px-4 py-2 bg-white/95 border border-[#FF5E3A]/25 rounded-2xl text-xs text-[#291A17] shadow-sm animate-in fade-in slide-in-from-top-1 duration-200">
          <span className="font-semibold">{systemNotification}</span>
          <span className="text-[10px] text-[#FF5E3A] font-mono font-bold">VALE ENTERPRISES</span>
        </div>
      )}
    </header>
  );
}
