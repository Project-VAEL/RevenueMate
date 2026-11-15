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
  Laptop,
  Cpu,
  HardDrive,
  Monitor,
  Battery,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { MessageChannel } from '@/types';

export function LeadDetail() {
  const {
    selectedLead,
    products,
    approvals,
    approveRequest,
    rejectRequest,
    generatePaymentLink,
    sendCustomMerchantMessage,
    setIsOfflineSaleModalOpen,
    setIsStockUpdateModalOpen,
    setSelectedProductForUpdate,
    markLeadLost,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'CHAT' | 'SPECS' | 'APPROVAL'>('CHAT');
  const [customReply, setCustomReply] = useState('');

  if (!selectedLead) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-white border border-[#FF5E3A]/15 rounded-[32px] p-8 text-center text-[#806761] shadow-[0_10px_30px_rgba(220,75,40,0.06)]">
        <MessageSquare className="w-10 h-10 text-[#FF8367] mb-2" />
        <h3 className="font-bold text-[#291A17] text-sm">Select a Lead from the Inbox</h3>
        <p className="text-xs text-[#806761] mt-1 max-w-sm">
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
    <div className="flex flex-col h-full bg-white border border-[#FF5E3A]/15 rounded-[32px] p-5 overflow-hidden shadow-[0_10px_30px_rgba(220,75,40,0.06)]">
      {/* 1. Header: Customer Information & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#FF5E3A]/10">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-[#291A17] tracking-tight">
              {selectedLead.name}
            </h2>
            <PriorityBadge priority={selectedLead.priority} />
            {selectedLead.isFollowupSuppressed && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FDF9F7] text-[#806761] border border-[#FF5E3A]/15 flex items-center gap-1">
                <Ban className="w-3 h-3 text-[#FF5E3A]" />
                Suppressed
              </span>
            )}
          </div>
          <div className="flex items-center gap-2.5 text-xs text-[#806761] mt-1">
            <span className="flex items-center gap-1">
              <Phone className="w-3 h-3 text-[#FF5E3A]" />
              {selectedLead.phone}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 font-semibold text-[#291A17]">
              <ChannelIcon className="w-3 h-3 text-[#FF5E3A]" />
              {selectedLead.channel}
            </span>
            <span>•</span>
            <span className="text-[#806761] font-mono text-[10px]">
              {selectedLead.createdAt}
            </span>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {selectedLead.status !== 'SALE_RECORDED' && (
            <button
              onClick={() => setIsOfflineSaleModalOpen(true)}
              className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#FF5E3A] to-[#FF8367] hover:from-[#E24823] hover:to-[#FF5E3A] text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-[0_4px_14px_rgba(255,94,58,0.25)]"
              title="Record In-store Cash/UPI purchase & suppress follow-ups"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Record Offline Sale</span>
            </button>
          )}

          {selectedLead.status !== 'SALE_RECORDED' && selectedLead.status !== 'LOST' && (
            <button
              onClick={() =>
                generatePaymentLink(selectedLead.id, selectedLead.quotedAmount || 49990)
              }
              className="px-3 py-1.5 rounded-full bg-[#FFEAE3] hover:bg-[#FFD4C7] text-[#FF5E3A] border border-[#FF5E3A]/30 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>UPI Link</span>
            </button>
          )}

          {selectedLead.status !== 'LOST' && selectedLead.status !== 'SALE_RECORDED' && (
            <button
              onClick={() => markLeadLost(selectedLead.id, 'Customer unresponsive')}
              className="px-2.5 py-1.5 rounded-full bg-[#FFF0EB] hover:bg-[#FFEAE3] text-[#806761] hover:text-[#291A17] text-xs font-semibold transition-colors"
            >
              Lost
            </button>
          )}
        </div>
      </div>

      {/* 2. Layered Stacking Segmented Tabs */}
      <div className="flex items-center justify-between gap-2 pt-2.5 pb-2 border-b border-[#FF5E3A]/10">
        <div className="flex items-center gap-1.5 bg-[#FFF0EB] p-1 rounded-full">
          <button
            onClick={() => setActiveTab('CHAT')}
            className={`px-3.5 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'CHAT'
                ? 'bg-gradient-to-r from-[#FF5E3A] to-[#FF8367] text-white shadow-sm'
                : 'text-[#806761] hover:text-[#291A17]'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Chat &amp; Timeline</span>
          </button>

          <button
            onClick={() => setActiveTab('SPECS')}
            className={`px-3.5 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'SPECS'
                ? 'bg-gradient-to-r from-[#FF5E3A] to-[#FF8367] text-white shadow-sm'
                : 'text-[#806761] hover:text-[#291A17]'
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>Specs &amp; Stock</span>
            {matchedProduct?.status === 'UNKNOWN' && (
              <span className="w-2 h-2 rounded-full bg-[#E24823] animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('APPROVAL')}
            className={`px-3.5 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 relative ${
              activeTab === 'APPROVAL'
                ? 'bg-gradient-to-r from-[#FF5E3A] to-[#FF8367] text-white shadow-sm'
                : 'text-[#806761] hover:text-[#291A17]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Offer Review</span>
            {pendingApproval && (
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-[#E24823] text-white ml-0.5">
                1
              </span>
            )}
          </button>
        </div>

        {/* Interested Product Pill */}
        {matchedProduct && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF3EE] border border-[#FF5E3A]/15 text-xs">
            <span className="font-bold text-[#291A17] truncate max-w-[170px]">
              {matchedProduct.name}
            </span>
            <span className="font-black text-[#FF5E3A] font-mono">
              ₹{selectedLead.quotedAmount?.toLocaleString('en-IN') || matchedProduct.price.toLocaleString('en-IN')}
            </span>
          </div>
        )}
      </div>

      {/* 3. Layer Content Views */}

      {/* TAB 1: Chat & Conversation Timeline */}
      {activeTab === 'CHAT' && (
        <div className="flex-1 flex flex-col min-h-0 pt-2">
          {/* Subtle Priority Banner */}
          <div className="p-2.5 mb-2 rounded-2xl bg-[#FFF3EE] border border-[#FF5E3A]/15 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#FF5E3A]" />
              <span className="text-[11px] text-[#806761] line-clamp-1">
                <strong className="text-[#291A17]">AI Priority Rationale:</strong> {selectedLead.priorityRationale}
              </span>
            </div>
            <button
              onClick={() => setActiveTab('SPECS')}
              className="text-[10px] font-bold text-[#FF5E3A] hover:underline shrink-0 ml-2"
            >
              View Specs →
            </button>
          </div>

          {/* Conversation Stream */}
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 min-h-[160px]">
            {selectedLead.timeline.map((event) => {
              const isCustomer = event.sender === 'customer';
              const isSystem = event.sender === 'system';

              if (isSystem) {
                return (
                  <div key={event.id} className="flex justify-center my-1.5">
                    <div className="max-w-md p-2 rounded-xl bg-[#FFF0EB] border border-[#FF5E3A]/15 text-center">
                      <p className="text-[10px] text-[#806761] font-mono leading-relaxed">{event.text}</p>
                      <span className="text-[9px] text-[#806761]/70 mt-0.5 block">{event.timestamp}</span>
                    </div>
                  </div>
                );
              }

              if (event.type === 'offline_sale') {
                return (
                  <div key={event.id} className="flex justify-center my-1.5">
                    <div className="max-w-md p-2.5 rounded-2xl bg-[#E8F5E9] border border-[#2E7D32]/30 text-center shadow-sm">
                      <div className="flex items-center justify-center gap-1.5 text-xs font-black text-[#2E7D32] uppercase">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        In-Store Sale Confirmed
                      </div>
                      <p className="text-xs text-[#1B4D1F] font-bold mt-0.5">{event.text}</p>
                      <span className="text-[10px] text-[#2E7D32] mt-0.5 block font-mono font-medium">
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
                    className={`max-w-[85%] rounded-2xl p-3.5 shadow-sm ${
                      isCustomer
                        ? 'bg-[#FDF9F7] text-[#291A17] border border-[#FF5E3A]/15 rounded-tl-sm'
                        : 'bg-gradient-to-r from-[#FF5E3A] to-[#FF8367] text-white rounded-tr-sm shadow-[0_4px_14px_rgba(255,94,58,0.22)]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 text-[9px] opacity-80 mb-1 font-mono">
                      <span className="font-bold">
                        {isCustomer ? selectedLead.name : 'Vale Enterprises (Rajesh Vale)'}
                      </span>
                      <span>{event.timestamp}</span>
                    </div>
                    <p className="text-xs leading-relaxed whitespace-pre-wrap font-medium">{event.text}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Message Reply Box */}
          <form onSubmit={handleSendReply} className="pt-2.5 mt-2 border-t border-[#FF5E3A]/10">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={customReply}
                onChange={(e) => setCustomReply(e.target.value)}
                placeholder={`Reply to ${selectedLead.name} via ${selectedLead.channel}...`}
                className="flex-1 bg-[#FFF0EB] border border-[#FF5E3A]/20 rounded-full px-4 py-2 text-xs text-[#291A17] placeholder-[#806761] focus:outline-none focus:border-[#FF5E3A] focus:ring-1 focus:ring-[#FF5E3A]/30 transition-all font-medium"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-full bg-gradient-to-r from-[#FF5E3A] to-[#E24823] hover:from-[#E24823] hover:to-[#FF5E3A] text-white font-bold text-xs transition-transform hover:scale-105 flex items-center gap-1.5 shrink-0 shadow-[0_4px_14px_rgba(255,94,58,0.28)]"
              >
                <span>Send</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: Specs & Stock Verification */}
      {activeTab === 'SPECS' && (
        <div className="flex-1 overflow-y-auto space-y-3.5 pt-2.5 pr-1">
          {matchedProduct ? (
            <>
              {/* Product Header & Pricing */}
              <div className="p-4 rounded-2xl bg-[#FFF3EE] border border-[#FF5E3A]/15 flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FFEAE3] text-[#FF5E3A]">
                      {matchedProduct.brand} • {matchedProduct.category}
                    </span>
                    <span className="text-[10px] text-[#806761] font-mono font-bold">
                      SKU: {matchedProduct.sku}
                    </span>
                  </div>
                  <h3 className="text-base font-black text-[#291A17]">
                    {matchedProduct.name}
                  </h3>
                  <p className="text-xs text-[#806761] mt-1">
                    {matchedProduct.notes}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-2xl font-black text-[#291A17] font-mono">
                    ₹{matchedProduct.price.toLocaleString('en-IN')}
                  </div>
                  <span className="text-[10px] text-[#806761]">Authorized Retail Price</span>
                </div>
              </div>

              {/* Hardware Specifications Grid (from CSV) */}
              <div className="p-4 rounded-2xl bg-[#FDF9F7] border border-[#FF5E3A]/15 space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-[#291A17] flex items-center gap-1.5">
                  <Laptop className="w-3.5 h-3.5 text-[#FF5E3A]" />
                  Verified Hardware Specifications
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  {matchedProduct.processor && (
                    <div className="p-2.5 rounded-xl bg-white border border-[#FF5E3A]/10">
                      <span className="text-[10px] font-bold text-[#806761] uppercase tracking-wider flex items-center gap-1">
                        <Cpu className="w-3 h-3 text-[#FF5E3A]" /> Processor
                      </span>
                      <p className="font-bold text-[#291A17] mt-0.5">{matchedProduct.processor}</p>
                    </div>
                  )}

                  {matchedProduct.memory && (
                    <div className="p-2.5 rounded-xl bg-white border border-[#FF5E3A]/10">
                      <span className="text-[10px] font-bold text-[#806761] uppercase tracking-wider flex items-center gap-1">
                        <HardDrive className="w-3 h-3 text-[#FF5E3A]" /> Memory / RAM
                      </span>
                      <p className="font-bold text-[#291A17] mt-0.5">{matchedProduct.memory}</p>
                    </div>
                  )}

                  {matchedProduct.storage && (
                    <div className="p-2.5 rounded-xl bg-white border border-[#FF5E3A]/10">
                      <span className="text-[10px] font-bold text-[#806761] uppercase tracking-wider flex items-center gap-1">
                        <HardDrive className="w-3 h-3 text-[#FF5E3A]" /> Solid State Storage
                      </span>
                      <p className="font-bold text-[#291A17] mt-0.5">{matchedProduct.storage}</p>
                    </div>
                  )}

                  {matchedProduct.graphics && (
                    <div className="p-2.5 rounded-xl bg-white border border-[#FF5E3A]/10">
                      <span className="text-[10px] font-bold text-[#806761] uppercase tracking-wider flex items-center gap-1">
                        <Laptop className="w-3 h-3 text-[#FF5E3A]" /> GPU Graphics
                      </span>
                      <p className="font-bold text-[#291A17] mt-0.5">{matchedProduct.graphics}</p>
                    </div>
                  )}

                  {matchedProduct.display && (
                    <div className="p-2.5 rounded-xl bg-white border border-[#FF5E3A]/10 col-span-1 sm:col-span-2">
                      <span className="text-[10px] font-bold text-[#806761] uppercase tracking-wider flex items-center gap-1">
                        <Monitor className="w-3 h-3 text-[#FF5E3A]" /> Display Panel
                      </span>
                      <p className="font-bold text-[#291A17] mt-0.5">{matchedProduct.display}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Physical Warehouse Inventory Audit Card */}
              <div className="p-4 rounded-2xl bg-[#FFF3EE] border border-[#FF5E3A]/15 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Boxes className="w-4 h-4 text-[#FF5E3A]" />
                    <span className="text-xs font-black uppercase tracking-wider text-[#291A17]">
                      Physical Shelf Audit State
                    </span>
                  </div>

                  {/* Stock Status Badge */}
                  <div>
                    {matchedProduct.status === 'IN_STOCK' && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E8F5E9] text-[#2E7D32] border border-[#2E7D32]/30">
                        ✓ In Stock ({matchedProduct.stockQuantity} units)
                      </span>
                    )}
                    {matchedProduct.status === 'LOW_STOCK' && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FEF3C7] text-[#D97706] border border-[#F59E0B]/30">
                        ⚡ Low Stock ({matchedProduct.stockQuantity} unit left)
                      </span>
                    )}
                    {matchedProduct.status === 'OUT_OF_STOCK' && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FEE2E2] text-[#DC2626] border border-[#DC2626]/30">
                        ✕ Out of Stock (0)
                      </span>
                    )}
                    {matchedProduct.status === 'UNKNOWN' && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-[#FFEAE3] text-[#E24823] border border-[#FF5E3A]/40 flex items-center gap-1 animate-pulse">
                        <AlertTriangle className="w-3 h-3" />
                        STOCK UNKNOWN (Check Shelf)
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-[#806761] pt-1 border-t border-[#FF5E3A]/10 font-mono">
                  <span>Location: <strong className="text-[#291A17]">{matchedProduct.rackLocation}</strong></span>
                  <span>Last Audit: <strong className="text-[#291A17]">{matchedProduct.lastCheckedAt}</strong></span>
                </div>

                {/* Audit Action Button */}
                <button
                  onClick={() => {
                    setSelectedProductForUpdate(matchedProduct);
                    setIsStockUpdateModalOpen(true);
                  }}
                  className="w-full mt-2 py-2.5 rounded-full bg-gradient-to-r from-[#FF5E3A] to-[#FF8367] hover:from-[#E24823] hover:to-[#FF5E3A] text-white text-xs font-black transition-all shadow-[0_4px_14px_rgba(255,94,58,0.25)] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Boxes className="w-3.5 h-3.5" />
                  <span>Update Physical Inventory Count</span>
                </button>
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-[#806761]">
              <p className="text-xs">No specific laptop SKU matched to this enquiry yet.</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Follow-up & Offer Approvals */}
      {activeTab === 'APPROVAL' && (
        <div className="flex-1 overflow-y-auto space-y-3 pt-2.5 pr-1">
          {pendingApproval ? (
            <div className="p-4 rounded-2xl bg-[#FEF3C7]/60 border border-[#F59E0B]/35 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#D97706]" />
                  <span className="text-[10px] font-black text-[#D97706] uppercase tracking-wider">
                    Follow-up Awaiting Approval
                  </span>
                </div>
                <span className="text-[10px] font-mono text-[#D97706] font-bold flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  35m SLA Expiry
                </span>
              </div>

              <div>
                <h4 className="text-xs font-black text-[#291A17]">{pendingApproval.actionTitle}</h4>
                <p className="text-xs text-[#806761] mt-0.5">{pendingApproval.payloadSummary}</p>
              </div>

              {/* Exact WhatsApp Message Box */}
              <div className="p-3 rounded-xl bg-white border border-[#F59E0B]/20 text-xs text-[#291A17] font-sans leading-relaxed shadow-sm">
                <span className="text-[9px] uppercase font-mono tracking-widest text-[#D97706] block mb-1 font-bold">
                  Proposed WhatsApp Dispatch:
                </span>
                &ldquo;{pendingApproval.draftMessage}&rdquo;
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-[#F59E0B]/20 text-xs">
                <span className="text-[11px] text-[#806761] font-mono">
                  Approver: <strong className="text-[#291A17]">{pendingApproval.approverName}</strong>
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => rejectRequest(pendingApproval.id, 'Merchant custom follow-up')}
                    className="px-3.5 py-1.5 rounded-full bg-[#FFF0EB] hover:bg-[#FFEAE3] text-[#806761] font-bold text-xs"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => {
                      approveRequest(pendingApproval.id);
                      setActiveTab('CHAT');
                    }}
                    className="px-4 py-1.5 rounded-full bg-gradient-to-r from-[#FF5E3A] to-[#FF8367] hover:from-[#E24823] hover:to-[#FF5E3A] text-white font-black text-xs shadow-[0_4px_14px_rgba(255,94,58,0.25)]"
                  >
                    ✓ Approve &amp; Send to WhatsApp
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-16 text-center text-[#806761]">
              <CheckCircle2 className="w-10 h-10 text-[#2E7D32] mx-auto mb-2" />
              <h4 className="text-xs font-bold text-[#291A17]">No Pending Approvals</h4>
              <p className="text-[11px] text-[#806761] mt-0.5">
                All automated messages and offers for {selectedLead.name} are fully approved or sent.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
