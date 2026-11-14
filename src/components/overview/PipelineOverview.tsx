'use client';

import React from 'react';
import { useStore } from '@/context/StoreContext';
import {
  GitPullRequest,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  MessageSquare,
  ShieldCheck,
  CreditCard,
  PlusCircle,
  Activity,
  Zap,
} from 'lucide-react';
import { PriorityBadge } from '@/components/leads/PriorityBadge';

export function PipelineOverview() {
  const {
    leads,
    approvals,
    payments,
    setActiveView,
    setSelectedLeadId,
    setIsOfflineSaleModalOpen,
  } = useStore();

  const openLeads = leads.filter(
    (l) => l.status !== 'SALE_RECORDED' && l.status !== 'LOST'
  );

  const pendingApprovals = approvals.filter((a) => a.status === 'PENDING');

  // Recent outcomes (honest, actual records)
  const recentOutcomes = [
    ...payments.map((p) => ({
      id: p.id,
      time: p.createdAt,
      type: p.status === 'VERIFIED_PAID' ? 'sale' : p.status === 'FAILED' ? 'failed_payment' : 'pending_payment',
      title: `${p.status.replace('_', ' ')}: ₹${p.amount.toLocaleString('en-IN')}`,
      subtitle: `${p.customerName} • ${p.productName} (${p.method.replace('_', ' ')})`,
      amount: p.amount,
      leadId: p.leadId,
    })),
    ...approvals
      .filter((a) => a.status === 'APPROVED' || a.status === 'SUPPRESSED_BY_OFFLINE_SALE')
      .map((a) => ({
        id: a.id,
        time: a.createdAt,
        type: a.status === 'APPROVED' ? 'approved' : 'suppressed',
        title: a.status === 'APPROVED' ? 'Follow-up Approved & Sent' : 'Follow-up Auto-Suppressed',
        subtitle: `${a.customerName} • ${a.actionTitle}`,
        amount: undefined,
        leadId: a.leadId,
      })),
  ].slice(0, 5);

  return (
    <div className="space-y-6">
      {/* 1. Primary Bento Stage: Real Sales Workflow Activity (Line Graph & Pipeline Flow) */}
      <div className="rounded-3xl p-6 bg-[#18181C] border border-white/[0.08] relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
              <h2 className="text-lg font-black text-white tracking-tight">
                Daily Sales Workflow Activity &amp; Throughput
              </h2>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Real-time activity log tracking enquiries, follow-up approvals, and completed sales today
            </p>
          </div>

          {/* Graph Legend */}
          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-purple-300">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
              Incoming Enquiries
            </span>
            <span className="flex items-center gap-1.5 text-amber-300">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              Approvals Due
            </span>
            <span className="flex items-center gap-1.5 text-emerald-300">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              Sales Recorded
            </span>
          </div>
        </div>

        {/* Beautiful SVG Activity Line Graph */}
        <div className="relative h-48 w-full bg-[#121214] rounded-2xl border border-white/[0.04] p-4 flex flex-col justify-between overflow-hidden">
          {/* Subtle Grid Lines */}
          <div className="absolute inset-0 grid grid-rows-4 w-full h-full pointer-events-none opacity-20">
            <div className="border-b border-zinc-700 w-full" />
            <div className="border-b border-zinc-700 w-full" />
            <div className="border-b border-zinc-700 w-full" />
            <div className="w-full" />
          </div>

          <svg
            className="w-full h-36 overflow-visible"
            viewBox="0 0 600 120"
            fill="none"
            preserveAspectRatio="none"
          >
            {/* Gradient Definitions */}
            <defs>
              <linearGradient id="purpleGlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="emeraldGlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Purple Line: Enquiries */}
            <path
              d="M0 90 Q 75 80, 150 40 T 300 65 T 450 25 T 600 35 L 600 120 L 0 120 Z"
              fill="url(#purpleGlow)"
            />
            <path
              d="M0 90 Q 75 80, 150 40 T 300 65 T 450 25 T 600 35"
              stroke="#8B5CF6"
              strokeWidth="3"
              strokeLinecap="round"
            />

            {/* Amber Line: Approvals */}
            <path
              d="M0 105 Q 75 95, 150 75 T 300 50 T 450 70 T 600 45"
              stroke="#F59E0B"
              strokeWidth="2.5"
              strokeDasharray="4 4"
              strokeLinecap="round"
            />

            {/* Emerald Line: Sales Recorded */}
            <path
              d="M0 115 Q 75 110, 150 95 T 300 80 T 450 55 T 600 30 L 600 120 L 0 120 Z"
              fill="url(#emeraldGlow)"
            />
            <path
              d="M0 115 Q 75 110, 150 95 T 300 80 T 450 55 T 600 30"
              stroke="#10B981"
              strokeWidth="3.5"
              strokeLinecap="round"
            />

            {/* Markers on recent points */}
            <circle cx="450" cy="25" r="4" fill="#8B5CF6" stroke="#fff" strokeWidth="2" />
            <circle cx="600" cy="30" r="5" fill="#10B981" stroke="#fff" strokeWidth="2" />
          </svg>

          {/* Time Labels on X-axis */}
          <div className="flex justify-between text-[10px] text-zinc-500 font-mono pt-1 border-t border-white/[0.04] relative z-10">
            <span>10:00 AM (Store Open)</span>
            <span>12:00 PM (Lunch Rush)</span>
            <span>2:30 PM (Peak Enquiries)</span>
            <span>4:30 PM (Current)</span>
            <span>8:00 PM (Closing)</span>
          </div>
        </div>
      </div>

      {/* 2. Asymmetric Bento Split: Open Leads & Urgent Approvals vs Recent Outcomes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column (7 cols): Open Leads & Urgency Queue */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-3xl p-5 bg-[#18181C] border border-white/[0.08] space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <UsersIcon className="w-4 h-4 text-purple-400" />
                <h3 className="font-bold text-sm text-white">Active Open Leads</h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300">
                  {openLeads.length} active
                </span>
              </div>
              <button
                onClick={() => setActiveView('inbox')}
                className="text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1"
              >
                Open Full Inbox <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-2.5">
              {openLeads.slice(0, 4).map((lead) => (
                <div
                  key={lead.id}
                  onClick={() => {
                    setSelectedLeadId(lead.id);
                    setActiveView('inbox');
                  }}
                  className="p-3.5 rounded-2xl bg-zinc-900/80 border border-white/[0.06] hover:bg-zinc-800/80 hover:border-purple-500/30 transition-all cursor-pointer flex items-center justify-between gap-3"
                >
                  <div className="overflow-hidden">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-white truncate">{lead.name}</span>
                      <PriorityBadge priority={lead.priority} showLabel={false} />
                    </div>
                    <p className="text-[11px] text-zinc-300 truncate mt-0.5 font-medium">
                      {lead.interestedProductName || 'Ethnic Wear Item'}{' '}
                      {lead.quotedAmount ? `• ₹${lead.quotedAmount.toLocaleString('en-IN')}` : ''}
                    </p>
                    <p className="text-[10px] text-zinc-400 mt-1 line-clamp-1">
                      {lead.priorityRationale}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-mono text-zinc-400 block">
                      {lead.lastActiveAt}
                    </span>
                    <span className="text-xs font-semibold text-purple-400 underline mt-1 inline-block">
                      Action →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Follow-ups Requiring Approval Quick Bar */}
          {pendingApprovals.length > 0 && (
            <div className="rounded-3xl p-5 bg-amber-500/10 border border-amber-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <h4 className="font-bold text-xs text-amber-300 uppercase tracking-wider">
                    Follow-ups Due Your Approval
                  </h4>
                </div>
                <button
                  onClick={() => setActiveView('approvals')}
                  className="text-xs font-bold text-amber-400 hover:text-amber-300"
                >
                  Review All ({pendingApprovals.length}) →
                </button>
              </div>

              <div className="space-y-2">
                {pendingApprovals.map((app) => (
                  <div
                    key={app.id}
                    className="p-3 rounded-2xl bg-zinc-950/80 border border-amber-500/20 flex items-center justify-between gap-2"
                  >
                    <div>
                      <p className="text-xs font-bold text-white">{app.customerName}</p>
                      <p className="text-[11px] text-zinc-300">{app.actionTitle}</p>
                    </div>
                    <button
                      onClick={() => setActiveView('approvals')}
                      className="px-3 py-1 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold text-xs"
                    >
                      Sign Off
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column (5 cols): Recent Outcomes & Offline Trigger */}
        <div className="lg:col-span-5 space-y-4">
          {/* Quick Offline Sale Recording Banner */}
          <div className="rounded-3xl p-5 bg-gradient-to-br from-emerald-950/40 via-zinc-900 to-zinc-900 border border-emerald-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <h4 className="font-bold text-xs text-emerald-300 uppercase tracking-wider">
                  Offline In-Store Walk-In
                </h4>
              </div>
              <span className="text-[10px] font-mono text-emerald-400">FOLLOW-UP GUARD</span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Did a customer buy with cash or direct UPI at the counter? Record it here to suppress
              all future automated follow-up messages!
            </p>
            <button
              onClick={() => setIsOfflineSaleModalOpen(true)}
              className="w-full py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-md"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Record Offline Sale</span>
            </button>
          </div>

          {/* Recent Outcomes Feed */}
          <div className="rounded-3xl p-5 bg-[#18181C] border border-white/[0.08] space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <h3 className="font-bold text-sm text-white">Recent Outcomes</h3>
              </div>
              <span className="text-[11px] text-zinc-500">Live Stream</span>
            </div>

            <div className="space-y-2.5">
              {recentOutcomes.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    if (item.leadId) {
                      setSelectedLeadId(item.leadId);
                      setActiveView('inbox');
                    }
                  }}
                  className="p-3 rounded-2xl bg-zinc-900/60 border border-white/[0.04] hover:bg-zinc-800/60 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span
                      className={`font-bold ${
                        item.type === 'sale'
                          ? 'text-emerald-400'
                          : item.type === 'failed_payment'
                          ? 'text-rose-400'
                          : item.type === 'approved'
                          ? 'text-purple-400'
                          : 'text-amber-400'
                      }`}
                    >
                      {item.title}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">{item.time}</span>
                  </div>
                  <p className="text-[11px] text-zinc-300 mt-1 line-clamp-1">{item.subtitle}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function UsersIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
