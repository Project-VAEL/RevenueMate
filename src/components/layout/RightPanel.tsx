'use client';

import React from 'react';
import { useStore } from '@/context/StoreContext';
import {
  PlusCircle,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  Boxes,
  ArrowRight,
  Store,
} from 'lucide-react';

export function RightPanel() {
  const {
    metrics,
    approvals,
    products,
    approveRequest,
    setIsOfflineSaleModalOpen,
    setIsStockUpdateModalOpen,
    setSelectedProductForUpdate,
    simulateIncomingEnquiry,
    setSelectedLeadId,
    setActiveView,
  } = useStore();

  const pendingApprovals = approvals.filter((a) => a.status === 'PENDING').slice(0, 2);
  const unknownProducts = products.filter((p) => p.status === 'UNKNOWN').slice(0, 2);

  return (
    <aside className="w-full xl:w-80 shrink-0 space-y-4">
      {/* 1. Tall Solid Mint Green Action Card (Neo-brutalist anchor from UI prompt) */}
      <div className="rounded-3xl p-6 bg-[#10B981] text-zinc-950 shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[220px]">
        {/* Subtle decorative background ring */}
        <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-emerald-400/30 pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-black/20 text-zinc-950">
              RAPID CONVERSION
            </span>
            <Store className="w-5 h-5 text-emerald-950" />
          </div>

          <h3 className="text-xl font-black tracking-tight leading-tight text-zinc-950">
            Offline In-Store Purchase
          </h3>
          <p className="text-xs text-emerald-950/90 font-medium mt-1 leading-relaxed">
            Record counter Cash, Direct UPI QR, or POS card sale. Automatically suppresses pending
            automated follow-ups.
          </p>
        </div>

        <div className="relative z-10 pt-4 mt-2 border-t border-emerald-900/15">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-950 mb-3">
            <span>Today&apos;s In-Store Revenue</span>
            <span className="font-mono text-sm">₹{metrics.todaySalesAmount.toLocaleString('en-IN')}</span>
          </div>

          <button
            onClick={() => setIsOfflineSaleModalOpen(true)}
            className="w-full py-3 px-4 rounded-2xl bg-zinc-950 hover:bg-zinc-900 text-white font-bold text-xs flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] shadow-lg"
          >
            <PlusCircle className="w-4 h-4 text-emerald-400" />
            <span>Record Offline Sale</span>
          </button>
        </div>
      </div>

      {/* 2. Urgent Approval Stack */}
      <div className="rounded-3xl p-5 bg-[#18181C] border border-white/[0.08] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Approvals Queue
            </h4>
          </div>
          <button
            onClick={() => setActiveView('approvals')}
            className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold"
          >
            View All ({approvals.filter((a) => a.status === 'PENDING').length}) →
          </button>
        </div>

        {pendingApprovals.length === 0 ? (
          <div className="p-4 rounded-2xl bg-zinc-900/60 text-center text-xs text-zinc-400">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
            <span>All follow-up drafts signed off</span>
          </div>
        ) : (
          pendingApprovals.map((app) => (
            <div
              key={app.id}
              className="p-3 rounded-2xl bg-zinc-900/90 border border-white/[0.06] hover:border-amber-500/30 transition-colors space-y-2"
            >
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-white">{app.customerName}</span>
                <span className="text-amber-400 font-mono font-semibold text-[10px] flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  38m
                </span>
              </div>
              <p className="text-xs text-zinc-300 font-medium truncate">{app.actionTitle}</p>
              <div className="flex items-center justify-end gap-1.5 pt-1">
                <button
                  onClick={() => {
                    setSelectedLeadId(app.leadId);
                    setActiveView('inbox');
                  }}
                  className="px-2.5 py-1 rounded-xl bg-zinc-800 text-zinc-300 hover:text-white text-[10px] font-semibold"
                >
                  Inspect
                </button>
                <button
                  onClick={() => approveRequest(app.id)}
                  className="px-3 py-1 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 text-[10px] font-bold"
                >
                  ✓ Approve
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 3. Stale Stock Alerts */}
      {unknownProducts.length > 0 && (
        <div className="rounded-3xl p-5 bg-[#18181C] border border-amber-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-400">
              <AlertTriangle className="w-4 h-4" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                Unverified Stock Alert
              </h4>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300">
              {unknownProducts.length} UNKNOWN
            </span>
          </div>

          <p className="text-xs text-zinc-300 leading-relaxed">
            Items requiring physical shelf verification before customer quotes can be dispatched.
          </p>

          <div className="space-y-2">
            {unknownProducts.map((p) => (
              <div
                key={p.id}
                className="p-3 rounded-2xl bg-zinc-900 border border-white/[0.06] flex items-center justify-between gap-2"
              >
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-white truncate">{p.name}</p>
                  <p className="text-[10px] text-zinc-400">{p.rackLocation}</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedProductForUpdate(p);
                    setIsStockUpdateModalOpen(true);
                  }}
                  className="px-2.5 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-[10px] shrink-0"
                >
                  Verify
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Live Workflow Simulator Helper */}
      <div className="rounded-3xl p-5 bg-gradient-to-br from-purple-950/40 to-zinc-900 border border-purple-500/30 space-y-3">
        <div className="flex items-center gap-2 text-purple-300">
          <Sparkles className="w-4 h-4" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-white">
            Demo Simulator
          </h4>
        </div>
        <p className="text-xs text-zinc-300 leading-relaxed">
          Trigger a real customer lead in real-time to test the 7-stage sales workflow:
        </p>
        <div className="text-[10px] text-zinc-400 font-mono space-y-1">
          <div>1. WhatsApp Enquiry Influx</div>
          <div>2. Explainable Priority Auto-assigned</div>
          <div>3. Automated Stock Check</div>
          <div>4. Human Follow-up Approval</div>
          <div>5. Offline/Online Payment &amp; Suppression</div>
        </div>
        <button
          onClick={simulateIncomingEnquiry}
          className="w-full py-2.5 px-3 rounded-2xl bg-purple-500 hover:bg-purple-400 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Simulate Incoming Lead</span>
        </button>
      </div>
    </aside>
  );
}
