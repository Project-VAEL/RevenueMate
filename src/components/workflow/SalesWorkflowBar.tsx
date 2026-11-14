'use client';

import React from 'react';
import { useStore } from '@/context/StoreContext';
import { WorkflowStage } from '@/types';
import {
  MessageSquare,
  UserCheck,
  Zap,
  Boxes,
  ShieldCheck,
  CreditCard,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';

interface StageMeta {
  id: WorkflowStage;
  stepNumber: number;
  label: string;
  shortDesc: string;
  icon: React.ElementType;
  activeColor: string;
}

const STAGES: StageMeta[] = [
  {
    id: 'enquiry',
    stepNumber: 1,
    label: 'Enquiry',
    shortDesc: 'Omnichannel message',
    icon: MessageSquare,
    activeColor: 'from-purple-500 to-indigo-500',
  },
  {
    id: 'lead',
    stepNumber: 2,
    label: 'Lead',
    shortDesc: 'Profile & SKU match',
    icon: UserCheck,
    activeColor: 'from-indigo-500 to-blue-500',
  },
  {
    id: 'priority',
    stepNumber: 3,
    label: 'Priority',
    shortDesc: 'Intent & urgency score',
    icon: Zap,
    activeColor: 'from-amber-500 to-orange-500',
  },
  {
    id: 'stock_check',
    stepNumber: 4,
    label: 'Stock Check',
    shortDesc: 'Inventory verification',
    icon: Boxes,
    activeColor: 'from-cyan-500 to-teal-500',
  },
  {
    id: 'followup_approval',
    stepNumber: 5,
    label: 'Follow-up Approval',
    shortDesc: 'Merchant human-in-loop',
    icon: ShieldCheck,
    activeColor: 'from-yellow-500 to-amber-500',
  },
  {
    id: 'payment_pending',
    stepNumber: 6,
    label: 'Payment Status',
    shortDesc: 'UPI link & webhook',
    icon: CreditCard,
    activeColor: 'from-rose-500 to-pink-500',
  },
  {
    id: 'sale_recorded',
    stepNumber: 7,
    label: 'Sale Recorded',
    shortDesc: 'Online/Offline (Suppressed)',
    icon: CheckCircle2,
    activeColor: 'from-emerald-500 to-teal-400',
  },
];

export function SalesWorkflowBar() {
  const { leads, activeView, setActiveView, setSelectedLeadId } = useStore();

  // Count leads currently in each stage
  const getStageCount = (stageId: WorkflowStage) => {
    return leads.filter((l) => l.currentStage === stageId).length;
  };

  const handleStageClick = (stageId: WorkflowStage) => {
    if (stageId === 'followup_approval') {
      setActiveView('approvals');
    } else if (stageId === 'stock_check') {
      setActiveView('catalogue');
    } else if (stageId === 'payment_pending' || stageId === 'sale_recorded') {
      setActiveView('payments');
    } else {
      setActiveView('inbox');
    }

    const firstMatchingLead = leads.find((l) => l.currentStage === stageId);
    if (firstMatchingLead) {
      setSelectedLeadId(firstMatchingLead.id);
    }
  };

  return (
    <div className="w-full bg-[#18181C] border border-white/[0.08] rounded-3xl p-5 md:p-6">
      {/* Header of the workflow bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-pulse" />
            <h3 className="font-bold text-sm tracking-wide text-white uppercase">
              End-to-End Sales Workflow Pipeline
            </h3>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Real-time stage tracking from incoming enquiry to confirmed offline/online sale
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
          <span>7 Automated Guardrails Active</span>
        </div>
      </div>

      {/* Workflow Stepper Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
        {STAGES.map((stage, idx) => {
          const Icon = stage.icon;
          const count = getStageCount(stage.id);
          const hasLeads = count > 0;

          return (
            <div
              key={stage.id}
              onClick={() => handleStageClick(stage.id)}
              className={`relative rounded-2xl p-3 border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                hasLeads
                  ? 'bg-zinc-900/90 border-white/15 hover:border-purple-400/50 hover:bg-zinc-800/80 shadow-sm'
                  : 'bg-zinc-900/30 border-white/[0.05] text-zinc-500 hover:border-white/10'
              }`}
            >
              {/* Top: Step Number & Count Badge */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold text-zinc-400">
                  0{stage.stepNumber}
                </span>
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                    hasLeads
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      : 'bg-zinc-800 text-zinc-500'
                  }`}
                >
                  {count} {count === 1 ? 'lead' : 'leads'}
                </span>
              </div>

              {/* Middle: Icon & Title */}
              <div className="flex items-center gap-2 my-1">
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                    hasLeads
                      ? 'bg-gradient-to-br ' + stage.activeColor + ' text-white shadow-sm'
                      : 'bg-zinc-800 text-zinc-500'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="overflow-hidden">
                  <h4
                    className={`text-xs font-bold leading-tight truncate ${
                      hasLeads ? 'text-white' : 'text-zinc-400'
                    }`}
                  >
                    {stage.label}
                  </h4>
                  <p className="text-[10px] text-zinc-400 truncate mt-0.5">{stage.shortDesc}</p>
                </div>
              </div>

              {/* Arrow connector */}
              {idx < STAGES.length - 1 && (
                <ChevronRight className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 z-10 pointer-events-none" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

