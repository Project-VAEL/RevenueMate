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
    <div className="flex flex-col h-full bg-[#18181C] border border-white/[0.08] rounded-3xl p-4 md:p-5">
      {/* Header & Filter Pills */}
      <div className="flex flex-col gap-3 pb-4 border-b border-white/[0.08]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-base text-white">Lead Inbox</h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
              {filteredLeads.length} leads
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
            <Clock className="w-3.5 h-3.5" />
            <span>Sorted by urgency &amp; recency</span>
          </div>
        </div>

        {/* Status Filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'ALL', label: 'All Leads' },
            { id: 'NEW_ENQUIRY', label: 'New Enquiries' },
            { id: 'APPROVAL_PENDING', label: 'Approvals Due' },
            { id: 'PAYMENT_PENDING', label: 'Payment Pending' },
            { id: 'SALE_RECORDED', label: 'Sales Recorded' },
            { id: 'LOST', label: 'Lost' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFilterStatus(item.id)}
              className={`px-3 py-1 rounded-xl text-xs font-medium transition-colors ${
                filterStatus === item.id
                  ? 'bg-purple-500 text-white font-semibold'
                  : 'bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Priority Filters */}
        <div className="flex items-center gap-2 pt-1">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
            Priority:
          </span>
          {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map((p) => (
            <button
              key={p}
              onClick={() => setFilterPriority(p)}
              className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold transition-all ${
                filterPriority === p
                  ? p === 'HIGH'
                    ? 'bg-rose-500 text-white'
                    : p === 'MEDIUM'
                    ? 'bg-amber-500 text-zinc-950'
                    : p === 'LOW'
                    ? 'bg-zinc-600 text-white'
                    : 'bg-zinc-200 text-zinc-950'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Leads List */}
      <div className="flex-1 overflow-y-auto space-y-2.5 mt-3 pr-1 max-h-[640px]">
        {filteredLeads.length === 0 ? (
          <div className="py-12 text-center text-zinc-400">
            <p className="text-sm font-semibold text-white">No leads match this filter</p>
            <p className="text-xs text-zinc-400 mt-1">Try resetting the status or priority filters</p>
            <button
              onClick={() => {
                setFilterStatus('ALL');
                setFilterPriority('ALL');
              }}
              className="mt-3 px-3 py-1.5 rounded-xl bg-zinc-800 text-xs text-zinc-300 hover:bg-zinc-700"
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
                    ? 'bg-[#202028] border-purple-500/50 shadow-md ring-1 ring-purple-500/30'
                    : 'bg-zinc-900/60 border-white/[0.06] hover:bg-zinc-800/60 hover:border-white/15'
                }`}
              >
                {/* Active indicator bar */}
                {isSelected && (
                  <span className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-purple-500 to-indigo-500" />
                )}

                {/* Top Row: Name, Channel, and Priority */}
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2 truncate">
                    <span className="font-bold text-sm text-white truncate">{lead.name}</span>
                    <span className="inline-flex items-center gap-1 text-[11px] text-zinc-400">
                      <ChannelIcon className="w-3 h-3 text-purple-400 shrink-0" />
                      <span>{channelLabels[lead.channel]}</span>
                    </span>
                  </div>
                  <PriorityBadge priority={lead.priority} />
                </div>

                {/* Middle Row: Product & Price */}
                {lead.interestedProductName && (
                  <div className="flex items-center justify-between text-xs text-zinc-300 mb-2">
                    <span className="truncate text-zinc-300 font-medium max-w-[200px]">
                      {lead.interestedProductName}
                    </span>
                    {lead.quotedAmount && (
                      <span className="font-bold text-white shrink-0 ml-2">
                        ₹{lead.quotedAmount.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                )}

                {/* Priority Rationale Snippet (Honest AI reasoning) */}
                <div className="p-2 rounded-xl bg-black/30 border border-white/[0.04] text-[11px] text-zinc-400 mb-2 leading-relaxed">
                  <span className="font-semibold text-purple-300">Why Priority: </span>
                  {lead.priorityRationale}
                </div>

                {/* Status Pills & Flags */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-white/[0.04] text-[10px]">
                  <div className="flex items-center gap-1.5">
                    {lead.status === 'APPROVAL_PENDING' && (
                      <span className="px-2 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                        <ShieldCheck className="w-2.5 h-2.5" />
                        Approval Due
                      </span>
                    )}
                    {lead.status === 'PAYMENT_PENDING' && (
                      <span className="px-2 py-0.5 rounded-full font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        Payment Pending
                      </span>
                    )}
                    {lead.status === 'SALE_RECORDED' && (
                      <span className="px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        Sale Recorded
                      </span>
                    )}
                    {lead.isFollowupSuppressed && (
                      <span
                        className="px-2 py-0.5 rounded-full font-bold bg-zinc-800 text-zinc-300 border border-zinc-700 flex items-center gap-1"
                        title={lead.suppressionNote || 'Follow-ups suppressed'}
                      >
                        <Ban className="w-2.5 h-2.5 text-rose-400" />
                        Follow-ups Suppressed
                      </span>
                    )}
                  </div>

                  <span className="text-zinc-400 shrink-0">{lead.lastActiveAt}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
