'use client';

import React, { useState } from 'react';
import { useStore } from '@/context/StoreContext';
import { PriorityBadge } from './PriorityBadge';
import { InstagramIcon } from '@/components/common/Icons';
import {
  MessageSquare,
  Footprints,
  Globe,
  Phone,
  Send,
  ShieldCheck,
  CreditCard,
  PlusCircle,
  AlertTriangle,
  CheckCircle2,
  Boxes,
  Ban,
  Clock,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { MessageChannel, StockStatus } from '@/types';

export function LeadDetail() {
  const {
    selectedLead,
    products,
    approvals,
    payments,
    approveRequest,
    rejectRequest,
    generatePaymentLink,
    sendCustomMerchantMessage,
    setIsOfflineSaleModalOpen,
    setIsStockUpdateModalOpen,
    setSelectedProductForUpdate,
    markLeadLost,
  } = useStore();

  const [customReply, setCustomReply] = useState('');

  if (!selectedLead) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#18181C] border border-white/[0.08] rounded-3xl p-8 text-center text-zinc-400">
        <MessageSquare className="w-12 h-12 text-zinc-600 mb-3" />
        <h3 className="font-bold text-white text-base">Select a Lead from the Inbox</h3>
        <p className="text-xs text-zinc-400 mt-1 max-w-sm">
          Click on any customer in the inbox on the left to inspect conversation timeline, stock
          availability, and execute next workflow actions.
        </p>
      </div>
    );
  }

  // Find interested product
  const matchedProduct = products.find((p) => p.id === selectedLead.interestedProductId);

  // Find pending approval if any
  const pendingApproval = approvals.find(
    (a) => a.leadId === selectedLead.id && a.status === 'PENDING'
  );

  // Find payment record if any
  const paymentRecord = payments.find((p) => p.id === selectedLead.paymentId);

  const channelIcons: Record<MessageChannel, React.ElementType> = {
    WHATSAPP: MessageSquare,
    INSTAGRAM: InstagramIcon,
    WALK_IN: Footprints,
    WEBSITE: Globe,
  };
  const ChannelIcon = channelIcons[selectedLead.channel] || MessageSquare;

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customReply.trim()) return;
    sendCustomMerchantMessage(selectedLead.id, customReply.trim());
    setCustomReply('');
  };

  return (
    <div className="flex flex-col h-full bg-[#18181C] border border-white/[0.08] rounded-3xl p-4 md:p-6 overflow-hidden">
      {/* 1. Header: Customer Information & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg md:text-xl font-black text-white tracking-tight">
              {selectedLead.name}
            </h2>
            <PriorityBadge priority={selectedLead.priority} />
            {selectedLead.isFollowupSuppressed && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-300 border border-zinc-700 flex items-center gap-1">
                <Ban className="w-3 h-3 text-rose-400" />
                Follow-ups Suppressed
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1">
            <span className="flex items-center gap-1">
              <Phone className="w-3 h-3 text-zinc-500" />
              {selectedLead.phone}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <ChannelIcon className="w-3.5 h-3.5 text-purple-400" />
              {selectedLead.channel}
            </span>
            <span>•</span>
            <span className="text-zinc-400">Created: {selectedLead.createdAt}</span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {selectedLead.status !== 'SALE_RECORDED' && (
            <button
              onClick={() => setIsOfflineSaleModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
              title="Record Cash/UPI purchase to complete sale & suppress follow-ups"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Record Offline Sale</span>
            </button>
          )}

          {selectedLead.status !== 'SALE_RECORDED' && selectedLead.status !== 'LOST' && (
            <button
              onClick={() =>
                generatePaymentLink(selectedLead.id, selectedLead.quotedAmount || 2500)
              }
              className="px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Generate UPI Link</span>
            </button>
          )}

          {selectedLead.status !== 'LOST' && selectedLead.status !== 'SALE_RECORDED' && (
            <button
              onClick={() => markLeadLost(selectedLead.id, 'Customer unresponsive after 48h')}
              className="px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-xs transition-colors"
              title="Mark lead lost"
            >
              Lost
            </button>
          )}
        </div>
      </div>

      {/* 2. Bento Summary Box: Explainable Priority + Stock Check Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 my-4">
        {/* Visible Explanation for Priority */}
        <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-white/[0.06] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-zinc-400 mb-1">
              <span className="uppercase tracking-wider">AI Priority Explanation</span>
              <span className="text-[10px] text-purple-400 font-mono">RULE-ENGINE</span>
            </div>
            <p className="text-xs text-zinc-200 leading-relaxed font-medium">
              {selectedLead.priorityRationale}
            </p>
          </div>
          <p className="text-[10px] text-zinc-400 mt-2">
            Evaluated on: enquiry recency, SKU specificity, budget alignment &amp; deadline.
          </p>
        </div>

        {/* Stock Check Helper */}
        <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-white/[0.06] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-zinc-400 mb-1">
              <span className="uppercase tracking-wider flex items-center gap-1.5">
                <Boxes className="w-3.5 h-3.5 text-cyan-400" />
                Live Stock Check Helper
              </span>
              {matchedProduct && (
                <span className="text-[10px] text-zinc-400 font-mono">{matchedProduct.sku}</span>
              )}
            </div>

            {matchedProduct ? (
              <div className="mt-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white truncate max-w-[200px]">
                    {matchedProduct.name}
                  </span>
                  <span className="text-xs font-bold text-white">
                    ₹{matchedProduct.price.toLocaleString('en-IN')}
                  </span>
                </div>

                {/* Stock State Badge */}
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2">
                    {matchedProduct.status === 'IN_STOCK' && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        IN STOCK ({matchedProduct.stockQuantity} units)
                      </span>
                    )}
                    {matchedProduct.status === 'LOW_STOCK' && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        LOW STOCK ({matchedProduct.stockQuantity} unit left)
                      </span>
                    )}
                    {matchedProduct.status === 'OUT_OF_STOCK' && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        OUT OF STOCK
                      </span>
                    )}
                    {matchedProduct.status === 'UNKNOWN' && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-amber-400" />
                        STOCK UNKNOWN (Verification Needed)
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-zinc-400">
                    Checked: {matchedProduct.lastCheckedAt}
                  </span>
                </div>

                {/* Warning if stock unknown */}
                {matchedProduct.status === 'UNKNOWN' && (
                  <div className="mt-2 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 flex items-center justify-between">
                    <span>Physical stock unverified. Quotations paused.</span>
                    <button
                      onClick={() => {
                        setSelectedProductForUpdate(matchedProduct);
                        setIsStockUpdateModalOpen(true);
                      }}
                      className="px-2 py-0.5 rounded-lg bg-amber-500 text-zinc-950 font-bold text-[10px]"
                    >
                      Verify Now
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-zinc-400 mt-1">
                No specific catalogue SKU matched to this enquiry yet.
              </p>
            )}
          </div>
          <p className="text-[10px] text-zinc-400 mt-2">
            Location: {matchedProduct?.rackLocation || 'Front Showcase'}
          </p>
        </div>
      </div>

      {/* 3. Pending Follow-up Approval Card (if any) */}
      {pendingApproval && (
        <div className="mb-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-zinc-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-amber-300 uppercase tracking-wide">
                Follow-up Awaiting Your Approval
              </span>
            </div>
            <span className="text-[11px] font-mono text-amber-400/90 font-semibold flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Expiring in 38m
            </span>
          </div>

          <p className="text-xs font-semibold text-white">{pendingApproval.actionTitle}</p>
          <div className="p-3 my-2 rounded-xl bg-black/40 border border-white/10 text-xs text-zinc-300 font-sans leading-relaxed">
            &ldquo;{pendingApproval.draftMessage}&rdquo;
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-[11px] text-zinc-400">
              Assigned Approver: <strong className="text-zinc-200">{pendingApproval.approverName}</strong>
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => rejectRequest(pendingApproval.id, 'Merchant custom follow-up preferred')}
                className="px-3 py-1 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition-colors"
              >
                Reject &amp; Suppress
              </button>
              <button
                onClick={() => approveRequest(pendingApproval.id)}
                className="px-3.5 py-1 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold text-xs transition-colors shadow-sm"
              >
                ✓ Approve &amp; Dispatch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Payment Integrity Status (if any) */}
      {paymentRecord && (
        <div
          className={`mb-4 p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
            paymentRecord.status === 'VERIFIED_PAID'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : paymentRecord.status === 'PENDING'
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              : paymentRecord.status === 'FAILED'
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              : 'bg-zinc-800/80 border-zinc-700 text-zinc-300'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <CreditCard className="w-4 h-4 shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider">
                  Payment Status: {paymentRecord.status.replace('_', ' ')}
                </span>
                <span className="text-xs font-mono font-bold text-white">
                  ₹{paymentRecord.amount.toLocaleString('en-IN')}
                </span>
              </div>
              <p className="text-[11px] text-zinc-300 mt-0.5">
                Method: {paymentRecord.method.replace('_', ' ')} • Ref:{' '}
                {paymentRecord.referenceNumber || 'N/A'}{' '}
                {paymentRecord.utr ? `• UTR: ${paymentRecord.utr}` : ''}
              </p>
            </div>
          </div>

          {paymentRecord.status === 'VERIFIED_PAID' && (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500 text-zinc-950">
              BANK CONFIRMED
            </span>
          )}
          {paymentRecord.status === 'PENDING' && (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-400 text-zinc-950">
              AWAITING WEBHOOK
            </span>
          )}
          {paymentRecord.status === 'FAILED' && (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500 text-white">
              DECLINED
            </span>
          )}
        </div>
      )}

      {/* 5. Full Conversation Timeline */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-[220px]">
        <div className="text-center my-1">
          <span className="px-3 py-1 rounded-full bg-zinc-900 border border-white/[0.06] text-[10px] font-mono text-zinc-400 uppercase tracking-widest">
            Conversation &amp; Audit Timeline
          </span>
        </div>

        {selectedLead.timeline.map((event) => {
          const isCustomer = event.sender === 'customer';
          const isMerchant = event.sender === 'merchant';
          const isSystem = event.sender === 'system';

          if (isSystem) {
            return (
              <div key={event.id} className="flex justify-center my-2">
                <div className="max-w-md p-2.5 rounded-2xl bg-zinc-900/90 border border-white/[0.06] text-center">
                  <p className="text-[11px] text-zinc-300 font-mono leading-relaxed">{event.text}</p>
                  <span className="text-[9px] text-zinc-400 mt-1 block">{event.timestamp}</span>
                </div>
              </div>
            );
          }

          if (event.type === 'offline_sale') {
            return (
              <div key={event.id} className="flex justify-center my-2">
                <div className="max-w-md p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-300 uppercase">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Offline Sale Confirmed
                  </div>
                  <p className="text-xs text-white font-medium mt-1">{event.text}</p>
                  <span className="text-[10px] text-emerald-400/80 mt-1 block">
                    {event.timestamp} • Automated follow-ups permanently suppressed
                  </span>
                </div>
              </div>
            );
          }

          return (
            <div
              key={event.id}
              className={`flex flex-col ${isCustomer ? 'items-start' : 'items-end'}`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-3xl p-4 shadow-sm ${
                  isCustomer
                    ? 'bg-zinc-800/90 text-white border border-white/10 rounded-tl-sm'
                    : 'bg-purple-600 text-white rounded-tr-sm shadow-purple-900/20'
                }`}
              >
                <div className="flex items-center justify-between gap-3 text-[10px] opacity-75 mb-1">
                  <span className="font-semibold">
                    {isCustomer ? selectedLead.name : 'Merchant (Kavita Sharma)'}
                  </span>
                  <span>{event.timestamp}</span>
                </div>
                <p className="text-xs leading-relaxed whitespace-pre-wrap">{event.text}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* 6. Message Input & Dispatch Console */}
      <form onSubmit={handleSendReply} className="pt-3 mt-2 border-t border-white/[0.08]">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={customReply}
            onChange={(e) => setCustomReply(e.target.value)}
            placeholder={`Reply to ${selectedLead.name} via ${selectedLead.channel}...`}
            className="flex-1 bg-[#121214] border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 transition-colors"
          />
          <button
            type="submit"
            className="px-4 py-2.5 rounded-2xl bg-purple-500 hover:bg-purple-400 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shrink-0"
          >
            <span>Send</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
        <p className="text-[10px] text-zinc-400 mt-1.5">
          Dispatched via simulated merchant omnichannel gateway. No fake delivery checkmarks shown.
        </p>
      </form>
    </div>
  );
}
