'use client';

import React, { useState } from 'react';
import { useStore } from '@/context/StoreContext';
import { PaymentVerificationStatus } from '@/types';
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
      label: 'PENDING',
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
    <div className="flex flex-col h-full bg-white border border-[#FF5E3A]/15 rounded-[32px] p-5 md:p-6 space-y-4 shadow-[0_10px_30px_rgba(220,75,40,0.06)]">
      {/* 1. Header with Store Identity */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#FF5E3A]/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF5E3A] animate-pulse" />
            <h2 className="text-base font-black uppercase tracking-wider text-[#291A17]">
              Payment &amp; Order Status Ledger
            </h2>
          </div>
          <p className="text-xs text-[#806761] mt-0.5">
            Vale Enterprises transaction ledger separating Verified Paid, Pending, Failed, and Unknown states.
          </p>
        </div>

        {/* Action Button & Filter Tabs */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsGenerateFormOpen(!isGenerateFormOpen)}
            className="px-3.5 py-1.5 rounded-full bg-[#FFEAE3] hover:bg-[#FFD4C7] text-[#E24823] border border-[#FF5E3A]/30 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isGenerateFormOpen ? 'Close Form' : '+ Generate UPI Link'}</span>
            {isGenerateFormOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* 2. Top Summary Metric Chips (Layered & Compact) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3 rounded-2xl bg-[#E8F5E9] border border-[#2E7D32]/25 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#2E7D32]">
              VERIFIED PAID
            </span>
            <div className="text-2xl font-black text-[#2E7D32] mt-0.5 tabular-nums">
              {paidPayments.length} <span className="text-xs font-normal opacity-85">Settled</span>
            </div>
          </div>
          <CheckCircle2 className="w-5 h-5 text-[#2E7D32]/50" />
        </div>

        <div className="p-3 rounded-2xl bg-[#FEF3C7] border border-[#F59E0B]/30 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#D97706]">
              AWAITING WEBHOOK
            </span>
            <div className="text-2xl font-black text-[#D97706] mt-0.5 tabular-nums">
              {pendingPayments.length} <span className="text-xs font-normal opacity-85">Active</span>
            </div>
          </div>
          <Clock className="w-5 h-5 text-[#D97706]/50" />
        </div>

        <div className="p-3 rounded-2xl bg-[#FEE2E2] border border-[#DC2626]/25 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#DC2626]">
              FAILED / RETRY
            </span>
            <div className="text-2xl font-black text-[#DC2626] mt-0.5 tabular-nums">
              {failedPayments.length} <span className="text-xs font-normal opacity-85">Intervene</span>
            </div>
          </div>
          <XCircle className="w-5 h-5 text-[#DC2626]/50" />
        </div>

        <div className="p-3 rounded-2xl bg-[#FFEAE3] border border-[#FF5E3A]/30 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-[#E24823]">
              UNKNOWN SETTLEMENT
            </span>
            <div className="text-2xl font-black text-[#E24823] mt-0.5 tabular-nums">
              {unknownPayments.length} <span className="text-xs font-normal opacity-90">Hold</span>
            </div>
          </div>
          <HelpCircle className="w-5 h-5 text-[#E24823]/50" />
        </div>
      </div>

      {/* Collapsible / Stacked Generate New UPI Payment Link Drawer */}
      {isGenerateFormOpen && (
        <div className="p-4 rounded-2xl bg-[#FFF3EE] border border-[#FF5E3A]/20 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2 mb-2.5">
            <Send className="w-4 h-4 text-[#FF5E3A]" />
            <h3 className="font-bold text-xs uppercase tracking-wider text-[#291A17]">
              Generate Custom UPI Payment Link (Vale Enterprises)
            </h3>
          </div>
          <form onSubmit={handleCreateLink} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-[#806761] uppercase tracking-widest mb-1">
                Select Customer / Lead
              </label>
              <select
                value={selectedLeadForLink}
                onChange={(e) => setSelectedLeadForLink(e.target.value)}
                className="w-full bg-white border border-[#FF5E3A]/20 rounded-full px-3.5 py-2 text-xs text-[#291A17] focus:outline-none focus:border-[#FF5E3A]"
              >
                {leads.map((l) => (
                  <option key={l.id} value={l.id} className="bg-white text-[#291A17]">
                    {l.name} ({l.phone}) - {l.interestedProductName || 'Laptop'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#806761] uppercase tracking-widest mb-1">
                Amount (₹ INR)
              </label>
              <input
                type="number"
                min="1"
                value={linkAmount}
                onChange={(e) => setLinkAmount(parseInt(e.target.value, 10) || 0)}
                className="w-full bg-white border border-[#FF5E3A]/20 rounded-full px-3.5 py-2 text-xs text-[#291A17] focus:outline-none focus:border-[#FF5E3A] font-mono font-bold"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full py-2.5 rounded-full bg-gradient-to-r from-[#FF5E3A] to-[#FF8367] hover:from-[#E24823] hover:to-[#FF5E3A] text-white font-black text-xs transition-transform hover:scale-[1.01] flex items-center justify-center gap-1.5 shadow-[0_4px_14px_rgba(255,94,58,0.25)] cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Generate &amp; Dispatch Link</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        {[
          { id: 'ALL', label: `All (${payments.length})` },
          { id: 'VERIFIED_PAID', label: 'Verified Paid' },
          { id: 'PENDING', label: 'Pending Webhooks' },
          { id: 'FAILED', label: 'Failed' },
          { id: 'UNKNOWN', label: 'Unknown' },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setStatusFilter(f.id)}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
              statusFilter === f.id
                ? 'bg-gradient-to-r from-[#FF5E3A] to-[#FF8367] text-white shadow-sm'
                : 'bg-[#FFF0EB] text-[#806761] hover:text-[#291A17]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* 3. Clean Transactions List with Webhook Simulators */}
      <div className="space-y-2.5 pt-1">
        {filteredPayments.map((record) => {
          const meta = statusMeta[record.status];
          const Icon = meta.icon;
          const isPending = record.status === 'PENDING';

          return (
            <div
              key={record.id}
              className="p-4 rounded-[26px] bg-[#FDF9F7] border border-[#FF5E3A]/15 hover:border-[#FF5E3A]/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm"
            >
              {/* Left Column: Transaction Details */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${meta.badge}`}>
                    <Icon className="w-3 h-3" />
                    {meta.label}
                  </span>
                  <span className="font-mono text-[11px] text-[#806761]">
                    Ref: {record.referenceNumber || 'N/A'}
                  </span>
                  {record.isOffline && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#FFEAE3] text-[#FF5E3A] border border-[#FF5E3A]/30">
                      IN-STORE SALE
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-0.5">
                  <h4 className="font-black text-sm text-[#291A17]">{record.customerName}</h4>
                  <span className="text-xs text-[#806761]">•</span>
                  <span className="text-xs text-[#291A17] font-semibold">{record.productName}</span>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#806761] font-mono">
                  <span>Method: <strong className="text-[#291A17]">{record.method.replace('_', ' ')}</strong></span>
                  <span>•</span>
                  <span>{record.createdAt}</span>
                  {record.utr && (
                    <>
                      <span>•</span>
                      <span className="text-[#2E7D32] font-bold">UTR: {record.utr}</span>
                    </>
                  )}
                </div>

                {record.failureReason && (
                  <p className="text-[11px] text-[#DC2626] font-semibold pt-0.5">
                    Decline Reason: {record.failureReason}
                  </p>
                )}
              </div>

              {/* Right Column: Amount & Simulator Buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#FF5E3A]/10">
                <div className="text-left md:text-right">
                  <div className="text-2xl font-black text-[#291A17] tabular-nums font-mono">
                    ₹{record.amount.toLocaleString('en-IN')}<span className="text-sm font-bold text-[#806761]">.00</span>
                  </div>
                  <span className="text-[10px] text-[#806761] font-mono block">
                    {record.verifiedAt || 'Awaiting webhook reconciliation'}
                  </span>
                </div>

                {/* Simulated Webhook Controls for testing */}
                {isPending && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => simulatePaymentWebhook(record.id, 'VERIFIED_PAID')}
                      className="px-3.5 py-1.5 rounded-full bg-[#2E7D32] hover:bg-[#1B4D1F] text-white font-bold text-xs flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
                      title="Simulate bank webhook confirmation of payment"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Simulate UPI Success</span>
                    </button>
                    <button
                      onClick={() => simulatePaymentWebhook(record.id, 'FAILED')}
                      className="px-3.5 py-1.5 rounded-full bg-[#FEE2E2] hover:bg-[#FECACA] text-[#DC2626] border border-[#DC2626]/20 text-xs font-bold transition-colors cursor-pointer"
                    >
                      Fail
                    </button>
                  </div>
                )}

                {record.status === 'FAILED' && (
                  <button
                    onClick={() => {
                      setSelectedLeadId(record.leadId);
                      setActiveView('inbox');
                    }}
                    className="px-3.5 py-1.5 rounded-full bg-[#FFEAE3] hover:bg-[#FFD4C7] text-[#FF5E3A] border border-[#FF5E3A]/30 text-xs font-bold flex items-center gap-1"
                  >
                    <span>Follow-up Lead</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
