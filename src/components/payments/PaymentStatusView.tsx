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
  AlertTriangle,
  RotateCw,
  Plus,
  Send,
  Zap,
} from 'lucide-react';
import { StaleWarningBanner } from '@/components/common/StateBanners';

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

  const statusMeta: Record<
    PaymentVerificationStatus,
    { label: string; badge: string; icon: React.ElementType; desc: string }
  > = {
    VERIFIED_PAID: {
      label: 'VERIFIED PAID',
      badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      icon: CheckCircle2,
      desc: 'Settlement confirmed by Bank Gateway / POS receipt with UTR. Ready for dispatch.',
    },
    PENDING: {
      label: 'PENDING',
      badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      icon: Clock,
      desc: 'Payment link active. Awaiting customer authorization and bank webhook confirmation.',
    },
    FAILED: {
      label: 'FAILED',
      badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
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
    <div className="flex flex-col h-full bg-[#18181C] border border-white/[0.08] rounded-3xl p-5 md:p-6 space-y-5">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
            <h2 className="text-lg md:text-xl font-black text-white tracking-tight">
              Payment &amp; Order Status Tracker
            </h2>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Honest ledger distinguishing Verified Paid, Pending, Failed, and Unknown statuses.
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
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                statusFilter === f.id
                  ? 'bg-rose-500 text-zinc-950 font-bold'
                  : 'bg-zinc-900 border border-white/[0.06] text-zinc-300 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Warning Banner for UNKNOWN payments */}
      {unknownPayments.length > 0 && (
        <StaleWarningBanner
          type="error"
          title={`Critical: ${unknownPayments.length} Payment with UNKNOWN verification status`}
          message="POS swipe or gateway webhook was not reconciled. Never ship inventory or mark orders fulfilled until verified via bank statement."
        />
      )}

      {/* 3. Status Definition Legend (Neo-brutalist Bento Row) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {(['VERIFIED_PAID', 'PENDING', 'FAILED', 'UNKNOWN'] as PaymentVerificationStatus[]).map(
          (statusKey) => {
            const meta = statusMeta[statusKey];
            const count = payments.filter((p) => p.status === statusKey).length;
            const Icon = meta.icon;

            return (
              <div
                key={statusKey}
                onClick={() => setStatusFilter(statusKey)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  statusFilter === statusKey
                    ? 'bg-zinc-800/90 border-white/30 ring-1 ring-white/20'
                    : 'bg-zinc-900/60 border-white/[0.06] hover:bg-zinc-800/60'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${meta.badge}`}>
                    {meta.label}
                  </span>
                  <span className="text-sm font-black text-white">{count}</span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-tight">{meta.desc}</p>
              </div>
            );
          }
        )}
      </div>

      {/* 4. Transactions List with Webhook Simulators */}
      <div className="space-y-3">
        {filteredPayments.map((record) => {
          const meta = statusMeta[record.status];
          const Icon = meta.icon;
          const isPending = record.status === 'PENDING';

          return (
            <div
              key={record.id}
              className="p-4 md:p-5 rounded-3xl bg-zinc-900/90 border border-white/[0.08] hover:border-white/15 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              {/* Left Column: Transaction Details */}
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border flex items-center gap-1 ${meta.badge}`}>
                    <Icon className="w-3.5 h-3.5" />
                    {meta.label}
                  </span>
                  <span className="font-mono text-xs text-zinc-400">
                    Ref: {record.referenceNumber || 'N/A'}
                  </span>
                  {record.isOffline && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      OFFLINE SALE
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <h4 className="font-bold text-sm text-white">{record.customerName}</h4>
                  <span className="text-xs text-zinc-400">•</span>
                  <span className="text-xs text-zinc-300 font-medium">{record.productName}</span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400 pt-0.5">
                  <span>Method: <strong className="text-zinc-200">{record.method.replace('_', ' ')}</strong></span>
                  <span>•</span>
                  <span>Created: {record.createdAt}</span>
                  {record.utr && (
                    <>
                      <span>•</span>
                      <span className="font-mono text-emerald-400">UTR: {record.utr}</span>
                    </>
                  )}
                </div>

                {record.failureReason && (
                  <p className="text-xs text-rose-400 font-medium pt-1">
                    Decline Reason: {record.failureReason}
                  </p>
                )}

                {record.notes && (
                  <p className="text-[11px] text-zinc-500 pt-0.5">{record.notes}</p>
                )}
              </div>

              {/* Right Column: Amount & Webhook Simulator Buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-white/[0.06]">
                <div className="text-left md:text-right">
                  <div className="text-xl font-black text-white">
                    ₹{record.amount.toLocaleString('en-IN')}
                  </div>
                  <span className="text-[10px] text-zinc-400">
                    {record.verifiedAt || 'Awaiting settlement'}
                  </span>
                </div>

                {/* Simulated Bank Webhook Actions for demo testing */}
                {isPending && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => simulatePaymentWebhook(record.id, 'VERIFIED_PAID')}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs flex items-center gap-1 shadow-sm transition-colors"
                      title="Simulate bank webhook confirmation of payment"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Simulate UPI Success</span>
                    </button>
                    <button
                      onClick={() => simulatePaymentWebhook(record.id, 'FAILED')}
                      className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-rose-950 text-rose-300 border border-rose-500/20 text-xs font-semibold transition-colors"
                      title="Simulate bank gateway timeout / decline"
                    >
                      Simulate Fail
                    </button>
                  </div>
                )}

                {record.status === 'FAILED' && (
                  <button
                    onClick={() => {
                      setSelectedLeadId(record.leadId);
                      setActiveView('inbox');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-xs font-semibold flex items-center gap-1.5"
                  >
                    <span>Follow up with Customer</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 5. Tool: Generate New UPI Payment Link */}
      <div className="p-5 rounded-3xl bg-zinc-900 border border-white/[0.08] mt-4">
        <div className="flex items-center gap-2 mb-3">
          <Send className="w-4 h-4 text-purple-400" />
          <h3 className="font-bold text-sm text-white">Generate Custom UPI Payment Link</h3>
        </div>
        <form onSubmit={handleCreateLink} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-zinc-400 uppercase mb-1">
              Select Customer / Lead
            </label>
            <select
              value={selectedLeadForLink}
              onChange={(e) => setSelectedLeadForLink(e.target.value)}
              className="w-full bg-[#121214] border border-white/10 rounded-2xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
            >
              {leads.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} ({l.phone}) - {l.interestedProductName || 'Ethnic Wear'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-zinc-400 uppercase mb-1">
              Amount (₹ INR)
            </label>
            <input
              type="number"
              min="1"
              value={linkAmount}
              onChange={(e) => setLinkAmount(parseInt(e.target.value, 10) || 0)}
              className="w-full bg-[#121214] border border-white/10 rounded-2xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full py-2.5 rounded-2xl bg-purple-500 hover:bg-purple-400 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Generate &amp; Dispatch Link</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
