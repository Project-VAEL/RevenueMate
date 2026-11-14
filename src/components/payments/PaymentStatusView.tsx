'use client';

import React, { useState } from 'react';
import { useStore } from '@/context/StoreContext';
import { PaymentVerificationStatus, PaymentMethod } from '@/types';
import {
  CreditCard,
  CheckCircle2,
  Clock,
  XCircle,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  Zap,
  Plus,
  Send,
  TrendingUp,
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
  const [linkAmount, setLinkAmount] = useState<number>(3499);

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
      badge: 'bg-[#94CCA0]/20 text-[#94CCA0] border-[#94CCA0]/40',
      icon: CheckCircle2,
      desc: 'Settlement confirmed by Bank Gateway / POS receipt with UTR. Ready for dispatch.',
    },
    PENDING: {
      label: 'PENDING',
      badge: 'bg-[#F7B955]/20 text-[#F7B955] border-[#F7B955]/40',
      icon: Clock,
      desc: 'Payment link active. Awaiting customer authorization and bank webhook confirmation.',
    },
    FAILED: {
      label: 'FAILED',
      badge: 'bg-[#EE7A5C]/20 text-[#EE7A5C] border-[#EE7A5C]/40',
      icon: XCircle,
      desc: 'Bank gateway decline or UPI timeout. Requires merchant retry or manual intervention.',
    },
    UNKNOWN: {
      label: 'UNKNOWN / UNCONFIRMED',
      badge: 'bg-zinc-800 text-zinc-300 border-zinc-700',
      icon: HelpCircle,
      desc: 'Provider status unconfirmed. Do NOT dispatch items until verified on net banking.',
    },
  };

  const handleCreateLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeadForLink || linkAmount <= 0) return;
    generatePaymentLink(selectedLeadForLink, linkAmount);
  };

  return (
    <div className="flex flex-col h-full bg-[#191A1E] border border-white/[0.07] rounded-[32px] p-5 md:p-6 space-y-4">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#EE7A5C] animate-pulse" />
            <h2 className="text-base font-black uppercase tracking-wider text-white">
              Payment &amp; Order Status Ledger
            </h2>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Truthful transaction ledger separating Verified Paid, Pending, Failed, and Unknown states.
          </p>
        </div>

        {/* Filter Chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'ALL', label: `All (${payments.length})` },
            { id: 'VERIFIED_PAID', label: 'Verified Paid' },
            { id: 'PENDING', label: 'Pending' },
            { id: 'FAILED', label: 'Failed' },
            { id: 'UNKNOWN', label: 'Unknown' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                statusFilter === f.id
                  ? 'bg-white text-zinc-950 font-black shadow-sm'
                  : 'bg-[#22242A] border border-white/[0.05] text-zinc-400 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Top Metric Cards Row matching reference styling */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Verified Paid */}
        <div className="p-3.5 rounded-2xl bg-[#141518] border border-white/[0.05]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#94CCA0]">
            VERIFIED PAID
          </span>
          <div className="text-2xl font-black text-[#94CCA0] mt-0.5 tabular-nums">
            {paidPayments.length} <span className="text-xs font-normal opacity-80">Settled</span>
          </div>
        </div>

        {/* Pending Links */}
        <div className="p-3.5 rounded-2xl bg-[#141518] border border-white/[0.05]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#F7B955]">
            AWAITING WEBHOOK
          </span>
          <div className="text-2xl font-black text-[#F7B955] mt-0.5 tabular-nums">
            {pendingPayments.length} <span className="text-xs font-normal opacity-80">Active</span>
          </div>
        </div>

        {/* Failed / Declined */}
        <div className="p-3.5 rounded-2xl bg-[#141518] border border-white/[0.05]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#EE7A5C]">
            FAILED / RETRY
          </span>
          <div className="text-2xl font-black text-[#EE7A5C] mt-0.5 tabular-nums">
            {failedPayments.length} <span className="text-xs font-normal opacity-80">Intervene</span>
          </div>
        </div>

        {/* Unknown State */}
        <div className="p-3.5 rounded-2xl bg-[#EE7A5C]/15 border border-[#EE7A5C]/30">
          <span className="text-[10px] font-black uppercase tracking-wider text-[#EE7A5C]">
            UNKNOWN SETTLEMENT
          </span>
          <div className="text-2xl font-black text-[#EE7A5C] mt-0.5 tabular-nums">
            {unknownPayments.length} <span className="text-xs font-normal opacity-90">Hold Order</span>
          </div>
        </div>
      </div>

      {/* 3. Transactions List with Webhook Simulator */}
      <div className="space-y-3 pt-1">
        {filteredPayments.map((record) => {
          const meta = statusMeta[record.status];
          const Icon = meta.icon;
          const isPending = record.status === 'PENDING';

          return (
            <div
              key={record.id}
              className="p-4 rounded-[28px] bg-[#141518] border border-white/[0.06] hover:border-white/12 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              {/* Left Column: Transaction Details */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${meta.badge}`}>
                    <Icon className="w-3 h-3" />
                    {meta.label}
                  </span>
                  <span className="font-mono text-[11px] text-zinc-500">
                    Ref: {record.referenceNumber || 'N/A'}
                  </span>
                  {record.isOffline && (
                    <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-[#6B5CE7]/20 text-[#6B5CE7] border border-[#6B5CE7]/30">
                      OFFLINE SALE
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <h4 className="font-bold text-sm text-white">{record.customerName}</h4>
                  <span className="text-xs text-zinc-600">•</span>
                  <span className="text-xs text-zinc-300 font-medium">{record.productName}</span>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 text-[11px] text-zinc-400 font-mono pt-0.5">
                  <span>Method: <strong className="text-zinc-200">{record.method.replace('_', ' ')}</strong></span>
                  <span>•</span>
                  <span>{record.createdAt}</span>
                  {record.utr && (
                    <>
                      <span>•</span>
                      <span className="text-[#94CCA0]">UTR: {record.utr}</span>
                    </>
                  )}
                </div>

                {record.failureReason && (
                  <p className="text-[11px] text-rose-400 font-medium pt-1">
                    Decline Reason: {record.failureReason}
                  </p>
                )}
              </div>

              {/* Right Column: Amount & Simulator Buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-white/[0.04]">
                <div className="text-left md:text-right">
                  <div className="text-2xl font-black text-white tabular-nums">
                    ₹{record.amount.toLocaleString('en-IN')}<span className="text-sm font-bold text-zinc-500">.00</span>
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono block">
                    {record.verifiedAt || 'Awaiting webhook reconciliation'}
                  </span>
                </div>

                {/* Simulated Webhook Controls for testing */}
                {isPending && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => simulatePaymentWebhook(record.id, 'VERIFIED_PAID')}
                      className="px-3 py-1.5 rounded-xl bg-[#94CCA0] hover:bg-[#A5DDB1] text-zinc-950 font-black text-xs flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
                      title="Simulate bank webhook confirmation of payment"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Simulate UPI Success</span>
                    </button>
                    <button
                      onClick={() => simulatePaymentWebhook(record.id, 'FAILED')}
                      className="px-3 py-1.5 rounded-xl bg-[#22242A] hover:bg-rose-950 text-rose-300 border border-rose-500/20 text-xs font-bold transition-colors cursor-pointer"
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
                    className="px-3 py-1.5 rounded-xl bg-[#6B5CE7]/20 hover:bg-[#6B5CE7]/30 text-purple-300 border border-[#6B5CE7]/40 text-xs font-bold flex items-center gap-1"
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

      {/* 4. Generate New UPI Payment Link Tool matching reference styling */}
      <div className="p-5 rounded-[28px] bg-[#141518] border border-white/[0.06] mt-3">
        <div className="flex items-center gap-2 mb-3">
          <Send className="w-4 h-4 text-[#6B5CE7]" />
          <h3 className="font-bold text-xs uppercase tracking-wider text-white">
            Generate Custom UPI Payment Link
          </h3>
        </div>
        <form onSubmit={handleCreateLink} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">
              Select Customer / Lead
            </label>
            <select
              value={selectedLeadForLink}
              onChange={(e) => setSelectedLeadForLink(e.target.value)}
              className="w-full bg-[#0F1013] border border-white/10 rounded-2xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#6B5CE7]"
            >
              {leads.map((l) => (
                <option key={l.id} value={l.id} className="bg-zinc-900 text-white">
                  {l.name} ({l.phone}) - {l.interestedProductName || 'Ethnic Wear'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">
              Amount (₹ INR)
            </label>
            <input
              type="number"
              min="1"
              value={linkAmount}
              onChange={(e) => setLinkAmount(parseInt(e.target.value, 10) || 0)}
              className="w-full bg-[#0F1013] border border-white/10 rounded-2xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#6B5CE7] font-mono font-bold"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full py-2.5 rounded-2xl bg-[#6B5CE7] hover:bg-[#5848DA] text-white font-black text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Generate &amp; Dispatch Link</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
