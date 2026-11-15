'use client';

import React from 'react';
import { useStore } from '@/context/StoreContext';
import { PriorityBadge } from './PriorityBadge';
import { InstagramIcon } from '@/components/common/Icons';
import {
  MessageSquare,
  Footprints,
  Globe,
  Clock,
  Ban,
} from 'lucide-react';
import { MessageChannel } from '@/types';

export function LeadInbox() {
  const {
    leads,
    selectedLeadId,
    setSelectedLeadId,
    filterStatus,
    setFilterStatus,
    filterPriority,
    setFilterPriority,
    searchQuery,
  } = useStore();

  const channelIcons: Record<MessageChannel, React.ElementType> = {
    WHATSAPP: MessageSquare,
    INSTAGRAM: InstagramIcon,
    WALK_IN: Footprints,
    WEBSITE: Globe,
  };

  const channelLabels: Record<MessageChannel, string> = {
    WHATSAPP: 'WhatsApp',
    INSTAGRAM: 'Instagram',
    WALK_IN: 'Walk-In',
    WEBSITE: 'Website',
  };

  const filteredLeads = leads.filter((lead) => {
    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = lead.name.toLowerCase().includes(q);
      const matchPhone = lead.phone.toLowerCase().includes(q);
      const matchProduct = (lead.interestedProductName || '').toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchProduct) return false;
    }

    // Status filter
    if (filterStatus !== 'ALL') {
      if (filterStatus === 'APPROVAL_PENDING' && lead.status !== 'APPROVAL_PENDING') return false;
      if (filterStatus === 'PAYMENT_PENDING' && lead.status !== 'PAYMENT_PENDING') return false;
      if (filterStatus === 'SALE_RECORDED' && lead.status !== 'SALE_RECORDED') return false;
      if (filterStatus === 'NEW_ENQUIRY' && lead.status !== 'NEW_ENQUIRY') return false;
      if (filterStatus === 'LOST' && lead.status !== 'LOST') return false;
    }

    // Priority filter
    if (filterPriority !== 'ALL' && lead.priority !== filterPriority) {
      return false;
    }

    return true;
  });

  return (
    <div className="flex flex-col h-full bg-white border border-[#FF5E3A]/15 rounded-[32px] p-5 shadow-[0_10px_30px_rgba(220,75,40,0.06)]">
      {/* Header & Filter Pills */}
      <div className="flex flex-col gap-3 pb-4 border-b border-[#FF5E3A]/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-black text-sm uppercase tracking-wider text-[#291A17]">Lead Inbox</h3>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FFEAE3] text-[#FF5E3A] border border-[#FF5E3A]/25">
              {filteredLeads.length} leads
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-[#806761] font-mono">
            <Clock className="w-3 h-3 text-[#FF5E3A]" />
            <span>Sorted by urgency</span>
          </div>
        </div>

        {/* Status Filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'ALL', label: 'All' },
            { id: 'NEW_ENQUIRY', label: 'Enquiries' },
            { id: 'APPROVAL_PENDING', label: 'Approvals' },
            { id: 'PAYMENT_PENDING', label: 'Payment' },
            { id: 'SALE_RECORDED', label: 'Recorded' },
            { id: 'LOST', label: 'Lost' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFilterStatus(item.id)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                filterStatus === item.id
                  ? 'bg-gradient-to-r from-[#FF5E3A] to-[#FF8367] text-white shadow-sm'
                  : 'bg-[#FFF0EB] hover:bg-[#FFEAE3] text-[#806761] hover:text-[#291A17]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Priority Filters */}
        <div className="flex items-center gap-2 pt-1">
          <span className="text-[10px] font-bold text-[#806761] uppercase tracking-widest">
            Priority:
          </span>
          {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map((p) => (
            <button
              key={p}
              onClick={() => setFilterPriority(p)}
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-all ${
                filterPriority === p
                  ? p === 'HIGH'
                    ? 'bg-[#FFEAE3] text-[#E24823] border border-[#FF5E3A]/30'
                    : p === 'MEDIUM'
                    ? 'bg-[#FEF3C7] text-[#D97706] border border-[#F59E0B]/30'
                    : p === 'LOW'
                    ? 'bg-[#FDF9F7] text-[#806761] border border-[#FF5E3A]/15'
                    : 'bg-[#291A17] text-white'
                  : 'text-[#806761] hover:text-[#291A17]'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Leads List */}
      <div className="flex-1 overflow-y-auto space-y-2 mt-3 pr-1">
        {filteredLeads.length === 0 ? (
          <div className="py-12 text-center text-[#806761]">
            <p className="text-xs font-semibold text-[#291A17]">No leads match this filter</p>
            <button
              onClick={() => {
                setFilterStatus('ALL');
                setFilterPriority('ALL');
              }}
              className="mt-3 px-3 py-1 rounded-full bg-[#FFF0EB] text-xs font-bold text-[#FF5E3A]"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          filteredLeads.map((lead) => {
            const isSelected = selectedLeadId === lead.id;
            const ChannelIcon = channelIcons[lead.channel] || MessageSquare;

            return (
              <div
                key={lead.id}
                onClick={() => setSelectedLeadId(lead.id)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer text-left relative overflow-hidden ${
                  isSelected
                    ? 'bg-[#FFF0EB] border-[#FF5E3A]/40 shadow-sm ring-1 ring-[#FF5E3A]/30'
                    : 'bg-white border-[#FF5E3A]/10 hover:bg-[#FFF3EE]/70 hover:border-[#FF5E3A]/20'
                }`}
              >
                {/* Active indicator bar */}
                {isSelected && (
                  <span className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#FF5E3A]" />
                )}

                {/* Top Row: Name, Channel, and Priority */}
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 truncate">
                    <span className="font-bold text-xs text-[#291A17] truncate">{lead.name}</span>
                    <span className="inline-flex items-center gap-1 text-[10px] text-[#806761]">
                      <ChannelIcon className="w-3 h-3 text-[#FF5E3A] shrink-0" />
                      <span>{channelLabels[lead.channel]}</span>
                    </span>
                  </div>
                  <PriorityBadge priority={lead.priority} />
                </div>

                {/* Middle Row: Product & Price */}
                {lead.interestedProductName && (
                  <div className="flex items-center justify-between text-xs text-[#806761] mb-1.5">
                    <span className="truncate text-[#291A17] font-semibold max-w-[180px]">
                      {lead.interestedProductName}
                    </span>
                    {lead.quotedAmount && (
                      <span className="font-black text-[#291A17] shrink-0 ml-2 font-mono">
                        ₹{lead.quotedAmount.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                )}

                {/* Priority Rationale Snippet */}
                <div className="p-2 rounded-xl bg-[#FFF3EE] border border-[#FF5E3A]/10 text-[10px] text-[#806761] mb-2 leading-relaxed">
                  <span className="font-bold text-[#E24823]">Why Priority: </span>
                  {lead.priorityRationale}
                </div>

                {/* Status Pills & Flags */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#FF5E3A]/10 text-[10px]">
                  <div className="flex items-center gap-1.5">
                    {lead.status === 'APPROVAL_PENDING' && (
                      <span className="px-2 py-0.5 rounded-full font-bold bg-[#FEF3C7] text-[#D97706] border border-[#F59E0B]/30">
                        Approval Due
                      </span>
                    )}
                    {lead.status === 'PAYMENT_PENDING' && (
                      <span className="px-2 py-0.5 rounded-full font-bold bg-[#FFEAE3] text-[#E24823] border border-[#FF5E3A]/30">
                        Payment Pending
                      </span>
                    )}
                    {lead.status === 'SALE_RECORDED' && (
                      <span className="px-2 py-0.5 rounded-full font-bold bg-[#E8F5E9] text-[#2E7D32] border border-[#2E7D32]/30">
                        Sale Recorded
                      </span>
                    )}
                    {lead.isFollowupSuppressed && (
                      <span className="px-2 py-0.5 rounded-full font-bold bg-[#FDF9F7] text-[#806761] border border-[#FF5E3A]/15 flex items-center gap-1">
                        <Ban className="w-2.5 h-2.5 text-[#FF5E3A]" />
                        Suppressed
                      </span>
                    )}
                  </div>

                  <span className="text-[#806761] font-mono text-[9px]">{lead.lastActiveAt}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
