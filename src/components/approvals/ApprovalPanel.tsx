'use client';

import React, { useState } from 'react';
import { useStore } from '@/context/StoreContext';
import {
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Ban,
  User,
  MessageSquare,
  Sparkles,
  Zap,
} from 'lucide-react';

export function ApprovalPanel() {
  const { approvals, approveRequest, rejectRequest, setSelectedLeadId, setActiveView } = useStore();
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'SUPPRESSED'>('ALL');

  const filteredApprovals = approvals.filter((a) => {
    if (filter === 'PENDING') return a.status === 'PENDING';
    if (filter === 'APPROVED') return a.status === 'APPROVED';
    if (filter === 'SUPPRESSED')
      return a.status === 'SUPPRESSED_BY_OFFLINE_SALE' || a.status === 'REJECTED';
    return true;
  });

  const pendingCount = approvals.filter((a) => a.status === 'PENDING').length;
  const approvedCount = approvals.filter((a) => a.status === 'APPROVED').length;
  const suppressedCount = approvals.filter(
    (a) => a.status === 'SUPPRESSED_BY_OFFLINE_SALE' || a.status === 'REJECTED'
  ).length;

  return (
    <div className="flex flex-col h-full bg-[#191A1E] border border-white/[0.07] rounded-[32px] p-5 md:p-6 space-y-4">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#F7B955] animate-pulse" />
            <h2 className="text-base font-black uppercase tracking-wider text-white">
              Follow-up &amp; Offer Approval Queue
            </h2>
            {pendingCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#F7B955] text-zinc-950">
                {pendingCount} AWAITING
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Human-in-the-loop merchant gate. No message is dispatched to WhatsApp without your sign-off.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5">
          {[
            { id: 'ALL' as const, label: 'All Items' },
            { id: 'PENDING' as const, label: `Pending (${pendingCount})` },
            { id: 'APPROVED' as const, label: 'Approved' },
            { id: 'SUPPRESSED' as const, label: 'Suppressed' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                filter === f.id
                  ? 'bg-white text-zinc-950 font-black shadow-sm'
                  : 'bg-[#22242A] border border-white/[0.05] text-zinc-400 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Top Summary Metrics matching reference theme */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-2xl bg-[#141518] border border-white/[0.05]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#F7B955]">
            PENDING AUTHORIZATION
          </span>
          <div className="text-2xl font-black text-[#F7B955] mt-0.5 tabular-nums">
            {pendingCount} <span className="text-xs font-normal opacity-80">Drafts</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#141518] border border-white/[0.05]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#94CCA0]">
            APPROVED &amp; DISPATCHED
          </span>
          <div className="text-2xl font-black text-[#94CCA0] mt-0.5 tabular-nums">
            {approvedCount} <span className="text-xs font-normal opacity-80">Sent</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#141518] border border-white/[0.05]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
            AUTO-SUPPRESSED (OFFLINE)
          </span>
          <div className="text-2xl font-black text-white mt-0.5 tabular-nums">
            {suppressedCount} <span className="text-xs font-normal text-zinc-500">Safe</span>
          </div>
        </div>
      </div>

      {/* 3. Approvals List */}
      <div className="space-y-3 pt-1">
        {filteredApprovals.length === 0 ? (
          <div className="py-12 text-center text-zinc-500">
            <CheckCircle2 className="w-10 h-10 text-[#94CCA0] mx-auto mb-2" />
            <p className="text-xs font-bold text-white">All approvals resolved</p>
            <p className="text-[11px] text-zinc-500 mt-0.5">No pending customer messages awaiting sign-off.</p>
          </div>
        ) : (
          filteredApprovals.map((req) => {
            const isPending = req.status === 'PENDING';
            const isApproved = req.status === 'APPROVED';
            const isSuppressed = req.status === 'SUPPRESSED_BY_OFFLINE_SALE';
            const isRejected = req.status === 'REJECTED';

            return (
              <div
                key={req.id}
                className={`rounded-[28px] p-5 border transition-all ${
                  isPending
                    ? 'bg-[#141518] border-[#F7B955]/30 ring-1 ring-[#F7B955]/20'
                    : isSuppressed
                    ? 'bg-[#141518]/70 border-white/[0.04] opacity-80'
                    : isApproved
                    ? 'bg-[#141518] border-[#94CCA0]/30'
                    : 'bg-[#141518] border-rose-500/30'
                }`}
              >
                {/* Header: Action Title + Customer & Expiry Time */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-zinc-500">#{req.id}</span>
                      <h3 className="font-bold text-sm text-white">{req.actionTitle}</h3>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-zinc-400 mt-1">
                      <span className="text-white font-semibold">{req.customerName}</span>
                      <span>•</span>
                      <span className="font-mono text-zinc-400">{req.customerPhone}</span>
                      <span>•</span>
                      <span className="text-[#6B5CE7] font-bold text-[10px]">{req.channel}</span>
                    </div>
                  </div>

                  {/* Status & Expiry Badge */}
                  <div className="flex items-center gap-2">
                    {isPending && (
                      <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#F7B955]/20 text-[#F7B955] border border-[#F7B955]/30 flex items-center gap-1.5 animate-pulse">
                        <Clock className="w-3.5 h-3.5" />
                        Expires in 35m
                      </span>
                    )}
                    {isApproved && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#94CCA0]/20 text-[#94CCA0] border border-[#94CCA0]/30 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Approved &amp; Dispatched
                      </span>
                    )}
                    {isSuppressed && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-zinc-800 text-zinc-300 border border-zinc-700 flex items-center gap-1">
                        <Ban className="w-3.5 h-3.5 text-[#EE7A5C]" />
                        Suppressed by Offline Sale
                      </span>
                    )}
                    {isRejected && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" />
                        Rejected
                      </span>
                    )}
                  </div>
                </div>

                {/* Payload Breakdown Box */}
                <div className="p-3.5 rounded-2xl bg-[#0F1013] border border-white/[0.04] mb-3">
                  <div className="flex items-center justify-between text-xs font-bold text-zinc-400 mb-1">
                    <span className="uppercase tracking-widest text-[10px]">Offer &amp; Action Payload</span>
                    {req.quotedAmount && (
                      <span className="text-white font-mono font-bold text-sm">
                        Quoted: ₹{req.quotedAmount.toLocaleString('en-IN')}{' '}
                        {req.discountOfferedPercent && (
                          <span className="text-[#94CCA0] text-xs font-bold">
                            ({req.discountOfferedPercent}% festive offer)
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                    {req.payloadSummary}
                  </p>
                </div>

                {/* Draft Message Preview */}
                <div className="p-3.5 rounded-2xl bg-black/60 border border-[#6B5CE7]/30 text-xs text-white leading-relaxed mb-3">
                  <span className="text-[9px] uppercase font-mono tracking-widest text-[#6B5CE7] block mb-1 font-bold">
                    Exact WhatsApp Message to Dispatch:
                  </span>
                  &ldquo;{req.draftMessage}&rdquo;
                </div>

                {/* Approver & Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2.5 border-t border-white/[0.04] text-xs">
                  <div className="flex items-center gap-2 text-zinc-400 font-mono text-[11px]">
                    <User className="w-3.5 h-3.5 text-zinc-600" />
                    <span>
                      Approver: <strong className="text-zinc-200">{req.approverName}</strong>
                    </span>
                    <span>•</span>
                    <span>{req.createdAt}</span>
                  </div>

                  {req.suppressionReason && (
                    <div className="text-xs text-[#F7B955] font-medium bg-[#F7B955]/10 px-3 py-1.5 rounded-xl border border-[#F7B955]/20">
                      {req.suppressionReason}
                    </div>
                  )}

                  {isPending && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedLeadId(req.leadId);
                          setActiveView('inbox');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-[#22242A] hover:bg-zinc-800 text-zinc-300 text-xs font-bold"
                      >
                        Inspect Lead
                      </button>
                      <button
                        onClick={() => rejectRequest(req.id, 'Merchant custom call preferred')}
                        className="px-3 py-1.5 rounded-xl bg-[#22242A] hover:bg-rose-950 text-rose-300 border border-rose-500/20 text-xs font-bold transition-colors"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => approveRequest(req.id)}
                        className="px-4 py-1.5 rounded-xl bg-[#F7B955] hover:bg-amber-300 text-zinc-950 font-black text-xs transition-colors shadow-sm"
                      >
                        ✓ Approve &amp; Send to WhatsApp
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
