'use client';

import React from 'react';
import { useStore } from '@/context/StoreContext';
import {
  GitPullRequest,
  Inbox,
  Package,
  ShieldCheck,
  CreditCard,
  PlusCircle,
  Sparkles,
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
      icon: GitPullRequest,
      label: 'Sales Pipeline (7-Stage Workflow)',
      badge: null,
    },
    {
      id: 'inbox' as const,
      icon: Inbox,
      label: 'Lead Inbox & Conversations',
      badge: metrics.activeLeadsCount > 0 ? metrics.activeLeadsCount : null,
    },
    {
      id: 'catalogue' as const,
      icon: Package,
      label: 'Product Catalogue & Stock Freshness',
      badge: metrics.staleStockCount > 0 ? '!' : null,
      badgeColor: 'bg-amber-500 text-black',
    },
    {
      id: 'approvals' as const,
      icon: ShieldCheck,
      label: 'Follow-up Approval Panel',
      badge: metrics.approvalsDueCount > 0 ? metrics.approvalsDueCount : null,
      badgeColor: 'bg-amber-400 text-black',
    },
    {
      id: 'payments' as const,
      icon: CreditCard,
      label: 'Payment & Order Status',
      badge: metrics.pendingPaymentsCount > 0 ? metrics.pendingPaymentsCount : null,
      badgeColor: 'bg-rose-400 text-black',
    },
  ];

  return (
    <>
      {/* Desktop Vertical Minimalist Floating Sidebar */}
      <aside className="hidden md:flex flex-col items-center justify-between py-6 px-3 bg-[#18181C]/90 backdrop-blur-md border border-white/[0.08] rounded-3xl w-18 shrink-0 my-4 ml-4 h-[calc(100vh-2rem)] sticky top-4 z-40 shadow-2xl">
        {/* Top: Geometric Brand Icon */}
        <div className="flex flex-col items-center gap-6">
          <div
            onClick={() => setActiveView('pipeline')}
            className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white cursor-pointer hover:scale-105 transition-transform shadow-lg shadow-purple-500/20"
            title="RevenueMate - Sales Workflow Automation"
          >
            <Sparkles className="w-5 h-5 text-white" />
          </div>

          {/* Navigation Icons Stack */}
          <nav className="flex flex-col items-center gap-3 mt-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <div key={item.id} className="relative group">
                  <button
                    onClick={() => setActiveView(item.id)}
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 relative ${
                      isActive
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                        : 'text-zinc-400 hover:text-white hover:bg-white/[0.06]'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.2]' : 'stroke-[1.8]'}`} />

                    {/* Active highlight dot */}
                    {isActive && (
                      <span className="absolute -left-1.5 w-1 h-4 bg-purple-400 rounded-r-full" />
                    )}

                    {/* Badge notification */}
                    {item.badge && (
                      <span
                        className={`absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center ${
                          item.badgeColor || 'bg-purple-500 text-white'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>

                  {/* Tooltip on hover */}
                  <div className="absolute left-14 top-1/2 -translate-y-1/2 ml-2 px-3 py-1.5 bg-zinc-900 text-white text-xs font-medium rounded-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 border border-white/10 shadow-xl">
                    {item.label}
                  </div>
                </div>
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="flex flex-col items-center gap-3">
          {/* Quick Offline Sale Trigger */}
          <div className="relative group">
            <button
              onClick={() => setIsOfflineSaleModalOpen(true)}
              className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center hover:bg-emerald-500 hover:text-zinc-950 transition-all duration-200"
            >
              <PlusCircle className="w-5 h-5" />
            </button>
            <div className="absolute left-14 top-1/2 -translate-y-1/2 ml-2 px-3 py-1.5 bg-zinc-900 text-white text-xs font-medium rounded-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 border border-white/10 shadow-xl">
              Record Offline Sale (Direct UPI / Cash)
            </div>
          </div>

          {/* Demo Guide Trigger */}
          <div className="relative group">
            <button
              onClick={() => setIsDemoGuideOpen(true)}
              className="w-11 h-11 rounded-2xl text-zinc-400 hover:text-white hover:bg-white/[0.06] flex items-center justify-center transition-colors"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
            <div className="absolute left-14 top-1/2 -translate-y-1/2 ml-2 px-3 py-1.5 bg-zinc-900 text-white text-xs font-medium rounded-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 border border-white/10 shadow-xl">
              Workflow Guide & Prototype Checklist
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Floating Bottom Bar */}
      <nav className="md:hidden fixed bottom-3 left-3 right-3 bg-[#18181C]/95 backdrop-blur-md border border-white/10 rounded-3xl py-2 px-4 flex items-center justify-around z-50 shadow-2xl">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`p-2.5 rounded-2xl relative transition-all ${
                isActive ? 'bg-purple-500/20 text-purple-300' : 'text-zinc-400'
              }`}
            >
              <Icon className="w-5 h-5" />
              {item.badge && (
                <span
                  className={`absolute top-1 right-1 w-3.5 h-3.5 rounded-full text-[9px] font-bold flex items-center justify-center ${
                    item.badgeColor || 'bg-purple-500 text-white'
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
          className="p-2.5 rounded-2xl bg-emerald-500 text-zinc-950 font-bold"
        >
          <PlusCircle className="w-5 h-5" />
        </button>
      </nav>
    </>
  );
}
