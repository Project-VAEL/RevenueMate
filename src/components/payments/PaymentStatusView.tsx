'use client';

import React, { useState } from 'react';
import { useStore } from '@/context/StoreContext';
import { PaymentVerificationStatus } from '@/types';
import { WorkflowStepBanner } from '@/components/common/WorkflowStepBanner';
import {
  CheckCircle2,
  Clock,
  XCircle,
  HelpCircle,
  ArrowRight,
  Zap,
  Plus,
  Send,
  ChevronDown,
  ChevronUp,
  CreditCard,
  QrCode,
  ShieldAlert,
} from 'lucide-react';

export function PaymentStatusView() {
  const {
    payments,
    leads,
    simulatePaymentWebhook,
    generatePaymentLink,
    setSelectedLeadId,
    setActiveView,
  } = useStore();

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedLeadForLink, setSelectedLeadForLink] = useState<string>(leads[0]?.id || '');
  const [linkAmount, setLinkAmount] = useState<number>(78900);
  const [isGenerateFormOpen, setIsGenerateFormOpen] = useState<boolean>(false);

  const filteredPayments = payments.filter((p) => {
    if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
    return true;
  });

  const unknownPayments = payments.filter((p) => p.status === 'UNKNOWN');
  const paidPayments = payments.filter((p) => p.status === 'VERIFIED_PAID');
  const pendingPayments = payments.filter((p) => p.status === 'PENDING');
  const failedPayments = payments.filter((p) => p.status === 'FAILED');

  const statusMeta: Record<
    PaymentVerificationStatus,
    { label: string; badge: string; icon: React.ElementType; desc: string }
  > = {
    VERIFIED_PAID: {
      label: 'VERIFIED PAID',
      badge: 'bg-[#E8F5E9] text-[#2E7D32] border-[#2E7D32]/30 shadow-sm',
      icon: CheckCircle2,
      desc: 'Settlement confirmed by Bank Gateway / POS receipt with UTR. Ready for dispatch.',
    },
    PENDING: {
      label: 'PENDING WEBHOOK',
      badge: 'bg-[#FEF3C7] text-[#D97706] border-[#F59E0B]/35 shadow-sm',
      icon: Clock,
      desc: 'Payment link active. Awaiting customer authorization and bank webhook confirmation.',
    },
    FAILED: {
      label: 'FAILED',
      badge: 'bg-[#FEE2E2] text-[#DC2626] border-[#DC2626]/35 shadow-sm',
      icon: XCircle,
      desc: 'Bank gateway decline or UPI timeout. Requires merchant retry or manual intervention.',
    },
    UNKNOWN: {
      label: 'UNKNOWN / UNCONFIRMED',
      badge: 'bg-[#FDF9F7] text-[#806761] border-[#FF5E3A]/20',
      icon: HelpCircle,
      desc: 'Provider status unconfirmed. Do NOT dispatch items until verified on net banking.',
    },
  };

  const handleCreateLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeadForLink || linkAmount <= 0) return;
    generatePaymentLink(selectedLeadForLink, linkAmount);
    setIsGenerateFormOpen(false);
  };

  return (
    <div className="flex flex-col space-y-4">
      {/* 1. First-Time User Guided Workflow Banner */}
      <WorkflowStepBanner
        stepNumber={6}
        stageName="PAYMENT RECONCILIATION & AUTO-SUPPRESSION"
        title="Monitor Real-Time Settlements & Webhook Callbacks"
        description="Vale Enterprises payment safety: Automated follow-ups are immediately suppressed once a payment is marked VERIFIED PAID. Test webhooks using the 'Simulate UPI Success' button on pending links."
        primaryActionLabel="View Pipeline Dashboard"
        onPrimaryAction={() => setActiveView('pipeline')}
      />

      {/* 2. Main Ledger Container */}
      <div className="bg-white border border-[#FF5E3A]/15 rounded-[32px] p-5 md:p-6 space-y-4 shadow-[0_10px_30px_rgba(220,75,40,0.06)]">
        {/* Top Header & Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#FF5E3A]/10">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF5E3A] animate-pulse" />
              <h2 className="text-base font-black uppercase tracking-wider text-[#291A17]">
                Vale Enterprises · Payments &amp; Settlement Ledger
              </h2>
            </div>
            <p className="text-xs text-[#806761] mt-0.5">
              Distinguishing Verified Paid, Pending Webhooks, Failed, and Unconfirmed settlements.
            </p>
          </div>

          {/* Action Button & Filter Tabs */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsGenerateFormOpen(!isGenerateFormOpen)}
              className="px-3.5 py-1.5 rounded-full bg-[#FFEAE3] hover:bg-[#FFD4C7] text-[#E24823] border border-[#FF5E3A]/30 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isGenerateFormOpen ? 'Hide Form' : '+ New UPI Link'}</span>
              {isGenerateFormOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {/* 3. Compact Horizontal Status Strip */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-[#FFF3EE] border border-[#FF5E3A]/15">
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <span className="font-bold text-[#291A17]">Settlement Status:</span>
            <span className="inline-flex items-center gap-1.5 font-bold text-[#2E7D32]">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#2E7D32]" />
              {paidPayments.length} Verified Settled
            </span>
            <span className="inline-flex items-center gap-1.5 font-black text-[#D97706]">
              <Clock className="w-3.5 h-3.5 text-[#F59E0B]" />
              {pendingPayments.length} Awaiting Webhook
            </span>
            <span className="inline-flex items-center gap-1.5 font-bold text-[#DC2626]">
              <XCircle className="w-3.5 h-3.5 text-[#DC2626]" />
              {failedPayments.length} Failed / Timeout
            </span>
            <span className="inline-flex items-center gap-1.5 font-bold text-[#806761]">
              <HelpCircle className="w-3.5 h-3.5 text-[#806761]" />
              {unknownPayments.length} Unknown (Hold Order)
            </span>
          </div>

          <span className="text-[11px] text-[#806761] font-medium">
            💡 Verified UTRs auto-record sales
          </span>
        </div>

        {/* 4. Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'ALL', label: `All Transactions (${payments.length})` },
            { id: 'VERIFIED_PAID', label: `Verified Paid (${paidPayments.length})` },
            { id: 'PENDING', label: `Pending Webhooks (${pendingPayments.length})` },
            { id: 'FAILED', label: `Failed (${failedPayments.length})` },
            { id: 'UNKNOWN', label: `Unknown Settlement (${unknownPayments.length})` },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                statusFilter === f.id
                  ? 'bg-gradient-to-r from-[#FF5E3A] to-[#FF8367] text-white shadow-sm'
                  : 'bg-[#FFF0EB] text-[#806761] hover:text-[#291A17]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* 5. Collapsible UPI Link Creation Drawer */}
        {isGenerateFormOpen && (
          <form
            onSubmit={handleCreateLink}
            className="p-4 rounded-2xl bg-[#FFF0EB] border border-[#FF5E3A]/25 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150"
          >
            <div className="flex items-center gap-2 text-xs font-bold text-[#291A17]">
              <QrCode className="w-4 h-4 text-[#FF5E3A]" />
              <span>Generate Direct UPI Payment Link</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              <div className="sm:col-span-6 space-y-1">
                <label className="text-[10px] font-bold text-[#806761] uppercase tracking-wider block">
                  Select Lead / Customer
                </label>
                <select
                  value={selectedLeadForLink}
                  onChange={(e) => {
                    setSelectedLeadForLink(e.target.value);
                    const l = leads.find((x) => x.id === e.target.value);
                    if (l?.quotedAmount) setLinkAmount(l.quotedAmount);
                  }}
                  className="w-full bg-white border border-[#FF5E3A]/25 rounded-xl px-3 py-2 text-xs text-[#291A17] font-semibold focus:outline-none focus:border-[#FF5E3A]"
                >
                  {leads.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} ({l.phone}) - {l.interestedProductName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-3 space-y-1">
                <label className="text-[10px] font-bold text-[#806761] uppercase tracking-wider block">
                  Amount (₹ INR)
                </label>
                <input
                  type="number"
                  value={linkAmount}
                  onChange={(e) => setLinkAmount(Number(e.target.value))}
                  className="w-full bg-white border border-[#FF5E3A]/25 rounded-xl px-3 py-2 text-xs text-[#291A17] font-mono font-bold focus:outline-none focus:border-[#FF5E3A]"
                />
              </div>

              <div className="sm:col-span-3">
                <button
                  type="submit"
                  className="w-full py-2 rounded-xl bg-gradient-to-r from-[#FF5E3A] to-[#FF8367] hover:from-[#E24823] hover:to-[#FF5E3A] text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Link</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* 6. Clean Transactions List */}
        <div className="space-y-3 pt-1">
          {filteredPayments.map((p) => {
            const meta = statusMeta[p.status];
            const StatusIcon = meta.icon;
            const isPending = p.status === 'PENDING';
            const isFailed = p.status === 'FAILED';
            const isUnknown = p.status === 'UNKNOWN';

            return (
              <div
                key={p.id}
                className="p-4 rounded-2xl bg-[#FDF9F7] border border-[#FF5E3A]/15 hover:border-[#FF5E3A]/30 transition-all shadow-sm space-y-2.5"
              >
                {/* Row 1: Badges & Timestamp */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black border ${meta.badge}`}
                    >
                      <StatusIcon className="w-3 h-3" />
                      {meta.label}
                    </span>

                    {p.referenceNumber && (
                      <span className="font-mono text-[11px] text-[#806761]">
                        Ref: {p.referenceNumber}
                      </span>
                    )}

                    {p.isOffline && (
                      <span className="px-2 py-0.2 rounded-full text-[9px] font-bold bg-[#FFEAE3] text-[#E24823]">
                        In-Store Counter
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] text-[#806761] font-mono">
                    {p.createdAt}
                  </span>
                </div>

                {/* Row 2: Customer Name, Laptop Model, Method, Price */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-black text-[#291A17] flex items-center gap-2">
                      <span>{p.customerName}</span>
                      <span className="text-xs font-normal text-[#806761]">• {p.productName}</span>
                    </h3>
                    <p className="text-[11px] text-[#806761] mt-0.5">
                      Method: <strong className="text-[#291A17]">{p.method.replace(/_/g, ' ')}</strong>
                      {p.utr && <span> · UTR: <code className="font-mono">{p.utr}</code></span>}
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="text-2xl font-black text-[#291A17] tabular-nums font-mono">
                      ₹{p.amount.toLocaleString('en-IN')}<span className="text-xs font-normal text-[#806761]">.00</span>
                    </div>
                    <span className="text-[10px] text-[#806761] block">
                      {p.status === 'VERIFIED_PAID' ? 'Settled in Account' : 'Awaiting webhook reconciliation'}
                    </span>
                  </div>
                </div>

                {/* Failure / Warning Alert */}
                {p.failureReason && (
                  <div className="p-2.5 rounded-xl bg-[#FEE2E2] border border-[#DC2626]/20 text-[11px] text-[#DC2626] font-medium flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                    <span>Decline Reason: {p.failureReason}</span>
                  </div>
                )}

                {/* Row 3: Action Buttons */}
                {isPending && (
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#FF5E3A]/10">
                    <button
                      onClick={() => simulatePaymentWebhook(p.id, 'FAILED')}
                      className="px-3 py-1 rounded-full text-xs font-bold text-[#806761] hover:text-[#DC2626] hover:bg-[#FEE2E2] transition-colors"
                    >
                      Simulate Fail
                    </button>
                    <button
                      onClick={() => simulatePaymentWebhook(p.id, 'VERIFIED_PAID')}
                      className="px-4 py-1.5 rounded-full bg-[#E8F5E9] hover:bg-[#C8E6C9] text-[#2E7D32] border border-[#2E7D32]/30 text-xs font-black transition-all flex items-center gap-1.5 shadow-sm"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Simulate UPI Success Webhook</span>
                    </button>
                  </div>
                )}

                {isFailed && (
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#FF5E3A]/10">
                    <button
                      onClick={() => {
                        setSelectedLeadId(p.leadId);
                        setActiveView('inbox');
                      }}
                      className="px-3.5 py-1 rounded-full bg-[#FFEAE3] hover:bg-[#FFD4C7] text-[#E24823] text-xs font-bold transition-colors flex items-center gap-1"
                    >
                      <span>Follow-up Lead on WhatsApp</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
