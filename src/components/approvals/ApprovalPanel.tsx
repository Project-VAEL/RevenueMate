'use client';

import React, { useState } from 'react';
import { useStore } from '@/context/StoreContext';
import { WorkflowStepBanner } from '@/components/common/WorkflowStepBanner';
import {
  Clock,
  CheckCircle2,
  XCircle,
  Ban,
  User,
  MessageSquare,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Send,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';

export function ApprovalPanel() {
  const {
    approvals,
    approveRequest,
    rejectRequest,
    setSelectedLeadId,
    setActiveView,
  } = useStore();

  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'SUPPRESSED'>('ALL');
  const [expandedPayloadId, setExpandedPayloadId] = useState<string | null>(null);

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
    <div className="flex flex-col space-y-4">
      {/* 1. First-Time User Guided Workflow Banner */}
      <WorkflowStepBanner
        stepNumber={5}
        stageName="MERCHANT APPROVAL GATE"
        title="Authorize AI-Drafted WhatsApp Quotations"
        description="Vale Enterprises guardrail: No automated discount or WhatsApp message is sent to a customer without your explicit approval. Click 'Approve & Send' to dispatch, or 'Inspect Lead' to adjust pricing."
        primaryActionLabel="View Payment Ledger"
        onPrimaryAction={() => setActiveView('payments')}
      />

      {/* 2. Main Approval Desk Container */}
      <div className="bg-white border border-[#FF5E3A]/15 rounded-[32px] p-5 md:p-6 space-y-4 shadow-[0_10px_30px_rgba(220,75,40,0.06)]">
        {/* Header & Filter Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#FF5E3A]/10">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] animate-pulse" />
              <h2 className="text-base font-black uppercase tracking-wider text-[#291A17]">
                Quotation &amp; Follow-up Approvals
              </h2>
              {pendingCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#FEF3C7] text-[#D97706] border border-[#F59E0B]/35">
                  {pendingCount} AWAITING OWNER ACTION
                </span>
              )}
            </div>
            <p className="text-xs text-[#806761] mt-0.5">
              Review outbound quotes prepared for laptop buyers before customer dispatch.
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
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
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

        {/* 3. Compact Horizontal Summary Strip */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-[#FFF3EE] border border-[#FF5E3A]/15">
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <span className="font-bold text-[#291A17]">Queue Summary:</span>
            <span className="inline-flex items-center gap-1.5 font-black text-[#D97706]">
              <Clock className="w-3.5 h-3.5 text-[#F59E0B]" />
              {pendingCount} Pending Authorization
            </span>
            <span className="inline-flex items-center gap-1.5 font-bold text-[#2E7D32]">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#2E7D32]" />
              {approvedCount} Dispatched to WhatsApp
            </span>
            <span className="inline-flex items-center gap-1.5 font-bold text-[#806761]">
              <Ban className="w-3.5 h-3.5 text-[#FF5E3A]" />
              {suppressedCount} Suppressed (Walk-in Confirmed)
            </span>
          </div>

          <span className="text-[11px] text-[#806761]">
            Approver: <strong>Rajesh Vale (Store Owner)</strong>
          </span>
        </div>

        {/* 4. Approvals Cards List */}
        <div className="space-y-3.5 pt-1">
          {filteredApprovals.length === 0 ? (
            <div className="py-12 text-center text-[#806761]">
              <CheckCircle2 className="w-10 h-10 text-[#2E7D32] mx-auto mb-2" />
              <p className="text-xs font-bold text-[#291A17]">All approvals resolved</p>
              <p className="text-[11px] text-[#806761] mt-0.5">
                No customer offers currently awaiting your authorization.
              </p>
            </div>
          ) : (
            filteredApprovals.map((req) => {
              const isPending = req.status === 'PENDING';
              const isApproved = req.status === 'APPROVED';
              const isSuppressed = req.status === 'SUPPRESSED_BY_OFFLINE_SALE';
              const isRejected = req.status === 'REJECTED';
              const isPayloadExpanded = expandedPayloadId === req.id;

              return (
                <div
                  key={req.id}
                  className={`rounded-[26px] p-5 border transition-all ${
                    isPending
                      ? 'bg-[#FEF3C7]/40 border-[#F59E0B]/40 shadow-sm'
                      : isSuppressed
                      ? 'bg-[#FDF9F7] border-[#FF5E3A]/10 opacity-70'
                      : isApproved
                      ? 'bg-[#E8F5E9]/40 border-[#2E7D32]/30'
                      : 'bg-[#FDF9F7] border-[#FF5E3A]/15'
                  }`}
                >
                  {/* Top Bar: Title, Customer, and Status/Timer */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-[#FF5E3A]/10">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#806761]">
                        #{req.id}
                      </span>
                      <h3 className="text-sm font-black text-[#291A17]">
                        {req.actionTitle}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2">
                      {isPending && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FEF3C7] text-[#D97706] border border-[#F59E0B]/35 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>Expires in 35m</span>
                        </span>
                      )}
                      {isApproved && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E8F5E9] text-[#2E7D32] border border-[#2E7D32]/35 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Approved &amp; Dispatched</span>
                        </span>
                      )}
                      {isSuppressed && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FFEAE3] text-[#E24823] border border-[#FF5E3A]/30 flex items-center gap-1">
                          <Ban className="w-3 h-3" />
                          <span>Suppressed (Offline Purchase)</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Customer & Quoted Laptop Details */}
                  <div className="flex flex-wrap items-center justify-between gap-2 py-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#291A17]">{req.customerName}</span>
                      <span className="text-[#806761]">{req.customerPhone}</span>
                      <span className="px-2 py-0.2 rounded-full bg-[#E8F5E9] text-[#2E7D32] text-[10px] font-bold">
                        WhatsApp
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-[#806761]">Proposed Price:</span>
                      <span className="text-base font-black text-[#291A17] font-mono">
                        ₹{(req.quotedAmount || 0).toLocaleString('en-IN')}
                      </span>
                      {req.discountOfferedPercent && (
                        <span className="px-2 py-0.5 rounded-full bg-[#FFEAE3] text-[#E24823] font-bold text-[10px]">
                          {req.discountOfferedPercent}% Off
                        </span>
                      )}
                    </div>
                  </div>

                  {/* WhatsApp Draft Preview Box */}
                  <div className="mt-2 p-3.5 rounded-2xl bg-white border border-[#FF5E3A]/15 shadow-sm space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] text-[#806761] uppercase font-bold tracking-wider">
                      <span className="flex items-center gap-1 text-[#2E7D32]">
                        <MessageSquare className="w-3 h-3" />
                        Exact WhatsApp Message To Dispatch:
                      </span>
                      <button
                        onClick={() =>
                          setExpandedPayloadId(isPayloadExpanded ? null : req.id)
                        }
                        className="text-[#FF5E3A] hover:underline flex items-center gap-0.5 normal-case font-semibold"
                      >
                        {isPayloadExpanded ? 'Hide Payload' : 'View Payload Details'}
                        {isPayloadExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    </div>

                    <p className="text-xs text-[#291A17] leading-relaxed italic bg-[#FDF9F7] p-3 rounded-xl border border-[#FF5E3A]/10 font-sans">
                      &quot;{req.draftMessage}&quot;
                    </p>

                    {/* Expandable Technical Payload */}
                    {isPayloadExpanded && (
                      <div className="mt-2 p-3 rounded-xl bg-[#FFF0EB] border border-[#FF5E3A]/20 text-[11px] text-[#806761] font-mono space-y-1">
                        <div><strong>Lead ID:</strong> {req.leadId}</div>
                        <div><strong>Action Summary:</strong> {req.payloadSummary}</div>
                        <div><strong>Stock Check:</strong> Verified on Showroom Bay 1 Shelf</div>
                      </div>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-3 mt-3 border-t border-[#FF5E3A]/10 text-xs">
                    <div className="text-[11px] text-[#806761]">
                      Approver: <strong>{req.approverName}</strong> · {req.createdAt}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedLeadId(req.leadId);
                          setActiveView('inbox');
                        }}
                        className="px-3 py-1.5 rounded-full bg-[#FFF0EB] hover:bg-[#FFEAE3] text-[#806761] hover:text-[#291A17] text-xs font-bold transition-colors"
                      >
                        Inspect Lead →
                      </button>

                      {isPending && (
                        <>
                          <button
                            onClick={() => rejectRequest(req.id, 'Discount rejected by owner')}
                            className="px-3.5 py-1.5 rounded-full bg-[#FFF0EB] hover:bg-[#FEE2E2] text-[#806761] hover:text-[#DC2626] text-xs font-bold transition-colors"
                          >
                            Reject
                          </button>

                          <button
                            onClick={() => approveRequest(req.id)}
                            className="px-4 py-1.5 rounded-full bg-gradient-to-r from-[#FF5E3A] to-[#FF8367] hover:from-[#E24823] hover:to-[#FF5E3A] text-white text-xs font-black shadow-[0_4px_14px_rgba(255,94,58,0.3)] transition-all flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>✓ Approve &amp; Send to WhatsApp</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
