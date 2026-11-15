'use client';

import React, { useState } from 'react';
import { useStore } from '@/context/StoreContext';
import {
  Clock,
  CheckCircle2,
  XCircle,
  Ban,
  User,
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
    <div className="flex flex-col h-full bg-white border border-[#FF5E3A]/15 rounded-[32px] p-5 md:p-6 space-y-4 shadow-[0_10px_30px_rgba(220,75,40,0.06)]">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-[#FF5E3A]/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] animate-pulse" />
            <h2 className="text-base font-black uppercase tracking-wider text-[#291A17]">
              Follow-up &amp; Offer Approval Queue
            </h2>
            {pendingCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#FEF3C7] text-[#D97706] border border-[#F59E0B]/35">
                {pendingCount} AWAITING
              </span>
            )}
          </div>
          <p className="text-xs text-[#806761] mt-0.5">
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
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                filter === f.id
                  ? 'bg-gradient-to-r from-[#FF5E3A] to-[#FF8367] text-white shadow-sm'
                  : 'bg-[#FFF0EB] text-[#806761] hover:text-[#291A17]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Top Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-2xl bg-[#FEF3C7] border border-[#F59E0B]/30">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#D97706]">
            PENDING AUTHORIZATION
          </span>
          <div className="text-2xl font-black text-[#D97706] mt-0.5 tabular-nums">
            {pendingCount} <span className="text-xs font-normal opacity-85">Drafts</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#E8F5E9] border border-[#2E7D32]/25">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#2E7D32]">
            APPROVED &amp; DISPATCHED
          </span>
          <div className="text-2xl font-black text-[#2E7D32] mt-0.5 tabular-nums">
            {approvedCount} <span className="text-xs font-normal opacity-85">Sent</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#FFF3EE] border border-[#FF5E3A]/15">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#806761]">
            AUTO-SUPPRESSED (OFFLINE)
          </span>
          <div className="text-2xl font-black text-[#291A17] mt-0.5 tabular-nums">
            {suppressedCount} <span className="text-xs font-normal text-[#806761]">Safe</span>
          </div>
        </div>
      </div>

      {/* 3. Approvals List */}
      <div className="space-y-3 pt-1">
        {filteredApprovals.length === 0 ? (
          <div className="py-12 text-center text-[#806761]">
            <CheckCircle2 className="w-10 h-10 text-[#2E7D32] mx-auto mb-2" />
            <p className="text-xs font-bold text-[#291A17]">All approvals resolved</p>
            <p className="text-[11px] text-[#806761] mt-0.5">No pending customer messages awaiting sign-off.</p>
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
                    ? 'bg-[#FEF3C7]/40 border-[#F59E0B]/35 ring-1 ring-[#F59E0B]/20'
                    : isSuppressed
                    ? 'bg-[#FDF9F7] border-[#FF5E3A]/15 opacity-85'
                    : isApproved
                    ? 'bg-[#E8F5E9]/50 border-[#2E7D32]/30'
                    : 'bg-[#FEE2E2]/50 border-[#DC2626]/30'
                }`}
              >
                {/* Header: Action Title + Customer & Expiry Time */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#806761]">#{req.id}</span>
                      <h3 className="font-bold text-sm text-[#291A17]">{req.actionTitle}</h3>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[#806761] mt-1">
                      <span className="text-[#291A17] font-semibold">{req.customerName}</span>
                      <span>•</span>
                      <span className="font-mono text-[#806761]">{req.customerPhone}</span>
                      <span>•</span>
                      <span className="text-[#FF5E3A] font-bold text-[10px]">{req.channel}</span>
                    </div>
                  </div>

                  {/* Status & Expiry Badge */}
                  <div className="flex items-center gap-2">
                    {isPending && (
                      <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#FEF3C7] text-[#D97706] border border-[#F59E0B]/40 flex items-center gap-1.5 animate-pulse shadow-sm">
                        <Clock className="w-3.5 h-3.5" />
                        Expires in 35m
                      </span>
                    )}
                    {isApproved && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#E8F5E9] text-[#2E7D32] border border-[#2E7D32]/30 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Approved &amp; Dispatched
                      </span>
                    )}
                    {isSuppressed && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#FDF9F7] text-[#806761] border border-[#FF5E3A]/20 flex items-center gap-1">
                        <Ban className="w-3.5 h-3.5 text-[#FF5E3A]" />
                        Suppressed by Offline Sale
                      </span>
                    )}
                    {isRejected && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#FEE2E2] text-[#DC2626] border border-[#DC2626]/30 flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" />
                        Rejected
                      </span>
                    )}
                  </div>
                </div>

                {/* Payload Breakdown Box */}
                <div className="p-3.5 rounded-2xl bg-white border border-[#FF5E3A]/15 mb-3 shadow-sm">
                  <div className="flex items-center justify-between text-xs font-bold text-[#806761] mb-1">
                    <span className="uppercase tracking-widest text-[10px]">Offer &amp; Action Payload</span>
                    {req.quotedAmount && (
                      <span className="text-[#291A17] font-mono font-bold text-sm">
                        Quoted: ₹{req.quotedAmount.toLocaleString('en-IN')}{' '}
                        {req.discountOfferedPercent && (
                          <span className="text-[#2E7D32] text-xs font-bold">
                            ({req.discountOfferedPercent}% festive offer)
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#291A17] leading-relaxed font-sans font-medium">
                    {req.payloadSummary}
                  </p>
                </div>

                {/* Draft Message Preview */}
                <div className="p-3.5 rounded-2xl bg-[#FFF0EB] border border-[#FF5E3A]/20 text-xs text-[#291A17] leading-relaxed mb-3">
                  <span className="text-[9px] uppercase font-mono tracking-widest text-[#FF5E3A] block mb-1 font-bold">
                    Exact WhatsApp Message to Dispatch:
                  </span>
                  &ldquo;{req.draftMessage}&rdquo;
                </div>

                {/* Approver & Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2.5 border-t border-[#FF5E3A]/10 text-xs">
                  <div className="flex items-center gap-2 text-[#806761] font-mono text-[11px]">
                    <User className="w-3.5 h-3.5 text-[#FF5E3A]" />
                    <span>
                      Approver: <strong className="text-[#291A17]">{req.approverName}</strong>
                    </span>
                    <span>•</span>
                    <span>{req.createdAt}</span>
                  </div>

                  {req.suppressionReason && (
                    <div className="text-xs text-[#D97706] font-medium bg-[#FEF3C7] px-3 py-1.5 rounded-full border border-[#F59E0B]/30">
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
                        className="px-3.5 py-1.5 rounded-full bg-[#FFF0EB] hover:bg-[#FFEAE3] text-[#291A17] text-xs font-bold transition-colors"
                      >
                        Inspect Lead
                      </button>
                      <button
                        onClick={() => rejectRequest(req.id, 'Merchant custom call preferred')}
                        className="px-3.5 py-1.5 rounded-full bg-[#FEE2E2] hover:bg-[#FECACA] text-[#DC2626] border border-[#DC2626]/20 text-xs font-bold transition-colors"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => approveRequest(req.id)}
                        className="px-4 py-1.5 rounded-full bg-gradient-to-r from-[#FF5E3A] to-[#FF8367] hover:from-[#E24823] hover:to-[#FF5E3A] text-white font-black text-xs transition-colors shadow-[0_4px_14px_rgba(255,94,58,0.25)]"
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
