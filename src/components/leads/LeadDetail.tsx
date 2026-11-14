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
} from 'lucide-react';
import { MessageChannel } from '@/types';

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
      <div className="flex flex-col items-center justify-center h-full bg-[#191A1E] border border-white/[0.07] rounded-[32px] p-8 text-center text-zinc-500">
        <MessageSquare className="w-10 h-10 text-zinc-600 mb-2" />
        <h3 className="font-bold text-white text-sm">Select a Lead from the Inbox</h3>
        <p className="text-xs text-zinc-500 mt-1 max-w-sm">
          Click on any customer in the inbox to inspect conversation timeline, stock
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
    <div className="flex flex-col h-full bg-[#191A1E] border border-white/[0.07] rounded-[32px] p-5 overflow-hidden">
      {/* 1. Header: Customer Information & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-white tracking-tight">
              {selectedLead.name}
            </h2>
            <PriorityBadge priority={selectedLead.priority} />
            {selectedLead.isFollowupSuppressed && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-300 border border-zinc-700 flex items-center gap-1">
                <Ban className="w-3 h-3 text-[#EE7A5C]" />
                Suppressed
              </span>
            )}
          </div>
          <div className="flex items-center gap-2.5 text-xs text-zinc-400 mt-1">
            <span className="flex items-center gap-1">
              <Phone className="w-3 h-3 text-zinc-500" />
              {selectedLead.phone}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <ChannelIcon className="w-3 h-3 text-[#6B5CE7]" />
              {selectedLead.channel}
            </span>
            <span>•</span>
            <span className="text-zinc-500 font-mono text-[10px]">
              {selectedLead.createdAt}
            </span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {selectedLead.status !== 'SALE_RECORDED' && (
            <button
              onClick={() => setIsOfflineSaleModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-[#94CCA0] hover:bg-[#A5DDB1] text-zinc-950 font-black text-xs flex items-center gap-1.5 transition-colors shadow-sm"
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
              className="px-3 py-1.5 rounded-xl bg-[#6B5CE7]/20 hover:bg-[#6B5CE7]/30 text-purple-300 border border-[#6B5CE7]/40 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>UPI Link</span>
            </button>
          )}

          {selectedLead.status !== 'LOST' && selectedLead.status !== 'SALE_RECORDED' && (
            <button
              onClick={() => markLeadLost(selectedLead.id, 'Customer unresponsive')}
              className="px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-xs font-medium transition-colors"
            >
              Lost
            </button>
          )}
        </div>
      </div>

      {/* 2. Priority Rationale + Stock Check Helper */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 my-3">
        {/* Visible Explanation for Priority */}
        <div className="p-3.5 rounded-2xl bg-[#141518] border border-white/[0.05] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[10px] font-bold text-zinc-400 mb-1">
              <span className="uppercase tracking-widest">AI Priority Explanation</span>
              <span className="text-[#6B5CE7] font-mono">RULE ENGINE</span>
            </div>
            <p className="text-xs text-zinc-200 leading-relaxed font-medium">
              {selectedLead.priorityRationale}
            </p>
          </div>
          <p className="text-[10px] text-zinc-500 mt-2 font-mono">
            Scored on: recency, SKU intent &amp; purchase velocity
          </p>
        </div>

        {/* Stock Check Helper */}
        <div className="p-3.5 rounded-2xl bg-[#141518] border border-white/[0.05] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[10px] font-bold text-zinc-400 mb-1">
              <span className="uppercase tracking-widest flex items-center gap-1.5">
                <Boxes className="w-3.5 h-3.5 text-[#94CCA0]" />
                Live Stock Check Helper
              </span>
              {matchedProduct && (
                <span className="text-zinc-500 font-mono text-[10px]">{matchedProduct.sku}</span>
              )}
            </div>

            {matchedProduct ? (
              <div className="mt-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white truncate max-w-[180px]">
                    {matchedProduct.name}
                  </span>
                  <span className="text-xs font-black text-white font-mono">
                    ₹{matchedProduct.price.toLocaleString('en-IN')}
                  </span>
                </div>

                {/* Stock State Badge */}
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-1.5">
                    {matchedProduct.status === 'IN_STOCK' && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#94CCA0]/20 text-[#94CCA0] border border-[#94CCA0]/30">
                        IN STOCK ({matchedProduct.stockQuantity} units)
                      </span>
                    )}
                    {matchedProduct.status === 'LOW_STOCK' && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#F7B955]/20 text-[#F7B955] border border-[#F7B955]/30">
                        LOW STOCK ({matchedProduct.stockQuantity} unit left)
                      </span>
                    )}
                    {matchedProduct.status === 'OUT_OF_STOCK' && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        OUT OF STOCK
                      </span>
                    )}
                    {matchedProduct.status === 'UNKNOWN' && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#F7B955]/20 text-[#F7B955] border border-[#F7B955]/40 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-[#F7B955]" />
                        STOCK UNKNOWN (Check Shelf)
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    {matchedProduct.lastCheckedAt}
                  </span>
                </div>

                {matchedProduct.status === 'UNKNOWN' && (
                  <div className="mt-2 p-2 rounded-xl bg-[#F7B955]/10 border border-[#F7B955]/20 text-[10px] text-[#F7B955] flex items-center justify-between">
                    <span>Quotes paused until count verified.</span>
                    <button
                      onClick={() => {
                        setSelectedProductForUpdate(matchedProduct);
                        setIsStockUpdateModalOpen(true);
                      }}
                      className="px-2 py-0.5 rounded-lg bg-[#F7B955] text-zinc-950 font-bold"
                    >
                      Verify
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-zinc-500 mt-1">
                No specific catalogue SKU matched to this enquiry yet.
              </p>
            )}
          </div>
          <p className="text-[10px] text-zinc-500 mt-2 font-mono">
            Shelf: {matchedProduct?.rackLocation || 'Front Showcase'}
          </p>
        </div>
      </div>

      {/* 3. Pending Follow-up Approval Card (if any) */}
      {pendingApproval && (
        <div className="mb-3 p-3.5 rounded-2xl bg-[#F7B955]/10 border border-[#F7B955]/30 text-zinc-200">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#F7B955]" />
              <span className="text-[10px] font-bold text-[#F7B955] uppercase tracking-wider">
                Follow-up Awaiting Approval
              </span>
            </div>
            <span className="text-[10px] font-mono text-[#F7B955] font-semibold flex items-center gap-1">
              <Clock className="w-3 h-3" />
              38m SLA
            </span>
          </div>

          <p className="text-xs font-bold text-white">{pendingApproval.actionTitle}</p>
          <div className="p-2.5 my-2 rounded-xl bg-black/50 border border-white/5 text-xs text-zinc-300 font-sans leading-relaxed">
            &ldquo;{pendingApproval.draftMessage}&rdquo;
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-[10px] text-zinc-400">
              Approver: <strong className="text-white">{pendingApproval.approverName}</strong>
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => rejectRequest(pendingApproval.id, 'Merchant custom follow-up')}
                className="px-2.5 py-1 rounded-xl bg-[#22242A] hover:bg-zinc-800 text-zinc-300 text-xs font-semibold"
              >
                Reject
              </button>
              <button
                onClick={() => approveRequest(pendingApproval.id)}
                className="px-3 py-1 rounded-xl bg-[#F7B955] hover:bg-amber-300 text-zinc-950 font-black text-xs shadow-sm"
              >
                ✓ Approve &amp; Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Full Conversation Timeline */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 min-h-[160px]">
        {selectedLead.timeline.map((event) => {
          const isCustomer = event.sender === 'customer';
          const isSystem = event.sender === 'system';

          if (isSystem) {
            return (
              <div key={event.id} className="flex justify-center my-1.5">
                <div className="max-w-md p-2 rounded-xl bg-[#141518] border border-white/[0.04] text-center">
                  <p className="text-[10px] text-zinc-400 font-mono leading-relaxed">{event.text}</p>
                  <span className="text-[9px] text-zinc-600 mt-0.5 block">{event.timestamp}</span>
                </div>
              </div>
            );
          }

          if (event.type === 'offline_sale') {
            return (
              <div key={event.id} className="flex justify-center my-1.5">
                <div className="max-w-md p-2.5 rounded-2xl bg-[#94CCA0]/15 border border-[#94CCA0]/40 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-xs font-black text-[#94CCA0] uppercase">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Offline Sale Confirmed
                  </div>
                  <p className="text-xs text-white font-medium mt-0.5">{event.text}</p>
                  <span className="text-[10px] text-[#94CCA0]/80 mt-0.5 block font-mono">
                    {event.timestamp} • Follow-ups permanently suppressed
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
                className={`max-w-[85%] rounded-2xl p-3.5 shadow-sm ${
                  isCustomer
                    ? 'bg-[#22242A] text-white border border-white/[0.06] rounded-tl-sm'
                    : 'bg-[#6B5CE7] text-white rounded-tr-sm shadow-purple-900/20'
                }`}
              >
                <div className="flex items-center justify-between gap-3 text-[9px] opacity-75 mb-1 font-mono">
                  <span className="font-bold">
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

      {/* 5. Message Input & Dispatch Console */}
      <form onSubmit={handleSendReply} className="pt-2.5 mt-2 border-t border-white/[0.06]">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={customReply}
            onChange={(e) => setCustomReply(e.target.value)}
            placeholder={`Reply to ${selectedLead.name} via ${selectedLead.channel}...`}
            className="flex-1 bg-[#141518] border border-white/10 rounded-2xl px-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#6B5CE7] transition-colors"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-2xl bg-[#6B5CE7] hover:bg-[#5848DA] text-white font-bold text-xs transition-colors flex items-center gap-1.5 shrink-0"
          >
            <span>Send</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
}
