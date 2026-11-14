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
  Sparkles,
  ShieldCheck,
  Ban,
  CheckCircle2,
} from 'lucide-react';
import { MessageChannel, LeadStatus } from '@/types';

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
    <div className="flex flex-col h-full bg-[#191A1E] border border-white/[0.07] rounded-[32px] p-5">
      {/* Header & Filter Pills */}
      <div className="flex flex-col gap-3 pb-4 border-b border-white/[0.06]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-black text-sm uppercase tracking-wider text-white">Lead Inbox</h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#6B5CE7]/20 text-[#6B5CE7] border border-[#6B5CE7]/30">
              {filteredLeads.length} leads
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 font-mono">
            <Clock className="w-3 h-3" />
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
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                filterStatus === item.id
                  ? 'bg-white text-zinc-950 font-bold shadow-sm'
                  : 'bg-[#22242A] hover:bg-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Priority Filters */}
        <div className="flex items-center gap-2 pt-1">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
            Priority:
          </span>
          {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map((p) => (
            <button
              key={p}
              onClick={() => setFilterPriority(p)}
              className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                filterPriority === p
                  ? p === 'HIGH'
                    ? 'bg-[#EE7A5C] text-zinc-950'
                    : p === 'MEDIUM'
                    ? 'bg-[#F7B955] text-zinc-950'
                    : p === 'LOW'
                    ? 'bg-zinc-700 text-white'
                    : 'bg-white text-zinc-950'
                  : 'text-zinc-500 hover:text-zinc-300'
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
          <div className="py-12 text-center text-zinc-500">
            <p className="text-xs font-semibold text-zinc-300">No leads match this filter</p>
            <button
              onClick={() => {
                setFilterStatus('ALL');
                setFilterPriority('ALL');
              }}
              className="mt-3 px-3 py-1 rounded-xl bg-[#22242A] text-xs text-zinc-300"
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
                    ? 'bg-[#22242A] border-[#6B5CE7]/60 shadow-md ring-1 ring-[#6B5CE7]/30'
                    : 'bg-[#141518]/60 border-white/[0.04] hover:bg-[#22242A]/50 hover:border-white/10'
                }`}
              >
                {/* Active indicator bar */}
                {isSelected && (
                  <span className="absolute left-0 top-0 bottom-0 w-1 bg-[#6B5CE7]" />
                )}

                {/* Top Row: Name, Channel, and Priority */}
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 truncate">
                    <span className="font-bold text-xs text-white truncate">{lead.name}</span>
                    <span className="inline-flex items-center gap-1 text-[10px] text-zinc-400">
                      <ChannelIcon className="w-3 h-3 text-[#6B5CE7] shrink-0" />
                      <span>{channelLabels[lead.channel]}</span>
                    </span>
                  </div>
                  <PriorityBadge priority={lead.priority} />
                </div>

                {/* Middle Row: Product & Price */}
                {lead.interestedProductName && (
                  <div className="flex items-center justify-between text-xs text-zinc-300 mb-1.5">
                    <span className="truncate text-zinc-300 font-medium max-w-[180px]">
                      {lead.interestedProductName}
                    </span>
                    {lead.quotedAmount && (
                      <span className="font-bold text-white shrink-0 ml-2 font-mono">
                        ₹{lead.quotedAmount.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                )}

                {/* Priority Rationale Snippet */}
                <div className="p-2 rounded-xl bg-black/40 border border-white/[0.03] text-[10px] text-zinc-400 mb-2 leading-relaxed">
                  <span className="font-bold text-[#F7B955]">Why Priority: </span>
                  {lead.priorityRationale}
                </div>

                {/* Status Pills & Flags */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-white/[0.04] text-[10px]">
                  <div className="flex items-center gap-1.5">
                    {lead.status === 'APPROVAL_PENDING' && (
                      <span className="px-2 py-0.5 rounded-full font-bold bg-[#F7B955]/20 text-[#F7B955] border border-[#F7B955]/30">
                        Approval Due
                      </span>
                    )}
                    {lead.status === 'PAYMENT_PENDING' && (
                      <span className="px-2 py-0.5 rounded-full font-bold bg-[#EE7A5C]/20 text-[#EE7A5C] border border-[#EE7A5C]/30">
                        Payment Pending
                      </span>
                    )}
                    {lead.status === 'SALE_RECORDED' && (
                      <span className="px-2 py-0.5 rounded-full font-bold bg-[#94CCA0]/20 text-[#94CCA0] border border-[#94CCA0]/30">
                        Sale Recorded
                      </span>
                    )}
                    {lead.isFollowupSuppressed && (
                      <span className="px-2 py-0.5 rounded-full font-bold bg-zinc-800 text-zinc-300 border border-zinc-700 flex items-center gap-1">
                        <Ban className="w-2.5 h-2.5 text-[#EE7A5C]" />
                        Suppressed
                      </span>
                    )}
                  </div>

                  <span className="text-zinc-500 font-mono text-[9px]">{lead.lastActiveAt}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
