'use client';

import React from 'react';
import { useStore } from '@/context/StoreContext';
import {
  LayoutGrid,
  Inbox,
  Package,
  ShieldCheck,
  CreditCard,
  Plus,
  HelpCircle,
} from 'lucide-react';

export function Sidebar() {
  const {
    activeView,
    setActiveView,
    metrics,
    setIsOfflineSaleModalOpen,
    setIsDemoGuideOpen,
  } = useStore();

  const navItems = [
    {
      id: 'pipeline' as const,
      icon: LayoutGrid,
      label: 'OVERVIEW',
      badge: null,
    },
    {
      id: 'inbox' as const,
      icon: Inbox,
      label: 'INBOX',
      badge: metrics.activeLeadsCount > 0 ? metrics.activeLeadsCount : null,
      badgeColor: 'bg-[#FF5E3A] text-white',
    },
    {
      id: 'catalogue' as const,
      icon: Package,
      label: 'STOCK',
      badge: metrics.staleStockCount > 0 ? '!' : null,
      badgeColor: 'bg-[#F59E0B] text-zinc-950',
    },
    {
      id: 'approvals' as const,
      icon: ShieldCheck,
      label: 'APPROVALS',
      badge: metrics.approvalsDueCount > 0 ? metrics.approvalsDueCount : null,
      badgeColor: 'bg-[#F59E0B] text-zinc-950',
    },
    {
      id: 'payments' as const,
      icon: CreditCard,
      label: 'PAYMENTS',
      badge: metrics.pendingPaymentsCount > 0 ? metrics.pendingPaymentsCount : null,
      badgeColor: 'bg-[#FF5E3A] text-white',
    },
  ];

  return (
    <>
      {/* Desktop Vertical Minimalist Sidebar with Krishi-Rakshak warm theme */}
      <aside className="hidden md:flex flex-col items-center justify-between py-6 px-3 w-20 shrink-0 sticky top-4 h-[calc(100vh-2rem)] select-none border-r border-[#FF5E3A]/10">
        {/* Top: Krishi-Rakshak Brand Icon */}
        <div className="flex flex-col items-center gap-7">
          <div
            onClick={() => setActiveView('pipeline')}
            className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#FF5E3A] to-[#FF8568] flex items-center justify-center cursor-pointer transition-transform hover:scale-105 shadow-[0_8px_20px_rgba(255,94,58,0.28)] text-white"
            title="RevenueMate"
          >
            <svg
              className="w-6 h-6 text-white"
              viewBox="0 0 32 32"
              fill="currentColor"
            >
              <path d="M16 3C11 3 8 7 8 12C8 17 12 18 16 19C20 20 24 21 24 26C24 30 19 31 16 31C11 31 9 27 9 27L6 29C6 29 9 34 16 34C22 34 27 31 27 25C27 19 23 17 19 16C15 15 11 14 11 10C11 7 14 5 16 5C19 5 21 8 21 8L24 6C24 6 21 3 16 3Z" />
            </svg>
          </div>

          {/* Navigation Items: Icon + Micro-Label */}
          <nav className="flex flex-col items-center gap-5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  className={`flex flex-col items-center gap-1.5 transition-all group relative p-1.5 rounded-xl ${
                    isActive ? 'text-[#FF5E3A]' : 'text-[#806761] hover:text-[#291A17]'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center relative transition-all ${
                      isActive ? 'bg-[#FFEAE3] text-[#FF5E3A] shadow-sm' : 'group-hover:bg-[#FFF0EB]'
                    }`}
                  >
                    <Icon className="w-5 h-5 stroke-[1.8]" />

                    {/* Badge notification */}
                    {item.badge && (
                      <span
                        className={`absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full text-[9px] font-bold flex items-center justify-center ${
                          item.badgeColor || 'bg-[#FF5E3A] text-white'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>

                  <span
                    className={`text-[9px] font-bold tracking-widest uppercase ${
                      isActive ? 'text-[#291A17]' : 'text-[#806761] group-hover:text-[#291A17]'
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions: Krishi-Rakshak Glowing Coral Pill */}
        <div className="flex flex-col items-center gap-4">
          {/* Guide Icon */}
          <button
            onClick={() => setIsDemoGuideOpen(true)}
            className="text-[#806761] hover:text-[#291A17] p-1.5 transition-colors"
            title="Workflow Guide"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* Solid Coral Round Action Pill */}
          <button
            onClick={() => setIsOfflineSaleModalOpen(true)}
            className="w-10 h-10 rounded-full bg-gradient-to-r from-[#FF5E3A] to-[#FF8367] hover:from-[#E24823] hover:to-[#FF5E3A] text-white flex items-center justify-center shadow-[0_8px_24px_rgba(255,94,58,0.32)] transition-transform hover:scale-105 cursor-pointer"
            title="Record In-Store Offline Sale"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>
      </aside>

      {/* Mobile Floating Bottom Bar */}
      <nav className="md:hidden fixed bottom-3 left-3 right-3 bg-white/95 backdrop-blur-md border border-[#FF5E3A]/15 rounded-3xl py-2 px-4 flex items-center justify-around z-50 shadow-[0_16px_40px_rgba(50,30,25,0.14)]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`p-2 rounded-2xl flex flex-col items-center relative transition-all ${
                isActive ? 'text-[#FF5E3A]' : 'text-[#806761]'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[8px] font-bold tracking-wider mt-0.5">{item.label}</span>
              {item.badge && (
                <span
                  className={`absolute top-1 right-2 w-3 h-3 rounded-full text-[8px] font-bold flex items-center justify-center ${
                    item.badgeColor || 'bg-[#FF5E3A] text-white'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
        <button
          onClick={() => setIsOfflineSaleModalOpen(true)}
          className="p-2.5 rounded-full bg-gradient-to-r from-[#FF5E3A] to-[#FF8367] text-white font-bold shadow-[0_4px_16px_rgba(255,94,58,0.3)]"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
        </button>
      </nav>
    </>
  );
}
