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
  AlertCircle,
} from 'lucide-react';

export function ApprovalPanel() {
  const { approvals, approveRequest, rejectRequest, setSelectedLeadId, setActiveView } = useStore();
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'SUPPRESSED'>('ALL');
  const [rejectReason, setRejectReason] = useState<{ [id: string]: string }>({});

  const filteredApprovals = approvals.filter((a) => {
    if (filter === 'PENDING') return a.status === 'PENDING';
    if (filter === 'APPROVED') return a.status === 'APPROVED';
    if (filter === 'SUPPRESSED')
      return a.status === 'SUPPRESSED_BY_OFFLINE_SALE' || a.status === 'REJECTED';
    return true;
  });

  const pendingCount = approvals.filter((a) => a.status === 'PENDING').length;

  return (
    <div className="flex flex-col h-full bg-[#18181C] border border-white/[0.08] rounded-3xl p-5 md:p-6 space-y-5">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h2 className="text-lg md:text-xl font-black text-white tracking-tight">
              Follow-up &amp; Offer Approval Panel
            </h2>
            {pendingCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-400 text-zinc-950">
                {pendingCount} Awaiting Sign-off
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Human-in-the-loop authorization queue. No automated follow-up is dispatched without merchant review.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5">
          {[
            { id: 'ALL' as const, label: 'All Items' },
            { id: 'PENDING' as const, label: `Pending (${pendingCount})` },
            { id: 'APPROVED' as const, label: 'Approved' },
            { id: 'SUPPRESSED' as const, label: 'Suppressed / Rejected' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                filter === f.id
                  ? 'bg-amber-400 text-zinc-950 font-bold'
                  : 'bg-zinc-900 border border-white/[0.06] text-zinc-300 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Guardrail Policy Banner */}
      <div className="p-4 rounded-2xl bg-zinc-900 border border-white/[0.08] flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">Merchant Safety Protocol</h4>
            <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
              If a customer completes a purchase in-store via Cash, Direct-UPI QR, or POS, all queued follow-ups are{' '}
              <strong className="text-emerald-300 font-bold">automatically permanently suppressed</strong> to prevent spamming already-converted customers.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Approvals List */}
      <div className="space-y-4">
        {filteredApprovals.length === 0 ? (
          <div className="py-12 text-center text-zinc-400">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-white">No approvals pending</p>
            <p className="text-xs text-zinc-400 mt-1">All automated follow-ups have been addressed.</p>
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
                className={`rounded-3xl p-5 border transition-all ${
                  isPending
                    ? 'bg-amber-500/5 border-amber-500/30 ring-1 ring-amber-500/20'
                    : isSuppressed
                    ? 'bg-zinc-900/50 border-white/[0.06] opacity-85'
                    : isApproved
                    ? 'bg-emerald-500/5 border-emerald-500/20'
                    : 'bg-rose-500/5 border-rose-500/20'
                }`}
              >
                {/* Header: Action Title + Customer & Expiry Time */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-zinc-400">#{req.id}</span>
                      <h3 className="font-bold text-sm text-white">{req.actionTitle}</h3>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-zinc-400 mt-1">
                      <span className="text-white font-medium">{req.customerName}</span>
                      <span>•</span>
                      <span>{req.customerPhone}</span>
                      <span>•</span>
                      <span className="text-purple-400 font-semibold">{req.channel}</span>
                    </div>
                  </div>

                  {/* Status & Expiry Badge */}
                  <div className="flex items-center gap-2">
                    {isPending && (
                      <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center gap-1.5 animate-pulse">
                        <Clock className="w-3.5 h-3.5" />
                        Expires in 35m
                      </span>
                    )}
                    {isApproved && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Approved &amp; Dispatched
                      </span>
                    )}
                    {isSuppressed && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-zinc-800 text-zinc-300 border border-zinc-700 flex items-center gap-1">
                        <Ban className="w-3.5 h-3.5 text-rose-400" />
                        Suppressed by Offline Sale
                      </span>
                    )}
                    {isRejected && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" />
                        Rejected by Merchant
                      </span>
                    )}
                  </div>
                </div>

                {/* Payload Summary (Explicit Requirement) */}
                <div className="p-3 rounded-2xl bg-black/40 border border-white/[0.06] mb-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-zinc-400 mb-1">
                    <span className="uppercase tracking-wider">Payload Summary</span>
                    {req.quotedAmount && (
                      <span className="text-white font-mono font-bold">
                        Quoted: ₹{req.quotedAmount.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                    {req.payloadSummary}
                  </p>
                </div>

                {/* Draft Message Preview */}
                <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-purple-500/20 text-xs text-white leading-relaxed mb-4">
                  <span className="text-[10px] uppercase font-mono tracking-widest text-purple-400 block mb-1">
                    Exact WhatsApp Message to be Dispatched:
                  </span>
                  &ldquo;{req.draftMessage}&rdquo;
                </div>

                {/* Approver Name & Expiry Time (Explicit Requirement) */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-white/[0.06] text-xs">
                  <div className="flex items-center gap-2 text-zinc-400">
                    <User className="w-3.5 h-3.5 text-zinc-500" />
                    <span>
                      Assigned Approver: <strong className="text-white font-semibold">{req.approverName}</strong>
                    </span>
                    <span>•</span>
                    <span>Created: {req.createdAt}</span>
                  </div>

                  {/* If Suppressed, show reason */}
                  {req.suppressionReason && (
                    <div className="text-xs text-amber-300/90 font-medium bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20">
                      {req.suppressionReason}
                    </div>
                  )}

                  {/* Actions for Pending Requests */}
                  {isPending && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedLeadId(req.leadId);
                          setActiveView('inbox');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold"
                      >
                        Inspect Lead
                      </button>
                      <button
                        onClick={() => rejectRequest(req.id, 'Merchant preferred custom manual phone call.')}
                        className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-rose-950 text-rose-300 border border-rose-500/20 text-xs font-semibold transition-colors"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => approveRequest(req.id)}
                        className="px-4 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold text-xs transition-colors shadow-sm"
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
