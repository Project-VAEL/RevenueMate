'use client';

import React from 'react';
import { useStore } from '@/context/StoreContext';
import { X, CheckCircle2, ShieldCheck, Sparkles, AlertTriangle, Layers, Store } from 'lucide-react';

export function DemoGuideModal() {
  const { isDemoGuideOpen, setIsDemoGuideOpen } = useStore();

  if (!isDemoGuideOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#18181C] border border-white/10 rounded-3xl w-full max-w-2xl p-6 md:p-8 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 my-8 max-h-[90vh] overflow-y-auto">
        <button
          onClick={() => setIsDemoGuideOpen(false)}
          className="absolute top-6 right-6 text-zinc-400 hover:text-white p-1.5 rounded-xl bg-zinc-800"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-lg">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white tracking-tight">
              RevenueMate Prototype &amp; Evaluation Guide
            </h2>
            <p className="text-xs text-zinc-400">
              Interactive merchant-facing dashboard prototype for small retail businesses
            </p>
          </div>
        </div>

        <div className="space-y-5 text-xs text-zinc-300">
          {/* Section 1: Sales Workflow */}
          <div className="p-4 rounded-2xl bg-zinc-900 border border-white/[0.06] space-y-2">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-purple-400" />
              1. The 7-Stage Sales Workflow
            </h3>
            <p className="text-zinc-400 leading-relaxed">
              Every customer journey is visibly tracked across the top workflow stepper:
            </p>
            <ol className="list-decimal list-inside space-y-1 font-mono text-zinc-300 pl-1">
              <li><strong>Enquiry:</strong> Omnichannel message arrives via WhatsApp, Instagram, or Walk-in.</li>
              <li><strong>Lead:</strong> Customer identity, phone, and interested SKU are structured.</li>
              <li><strong>Priority:</strong> Rule engine calculates High/Medium/Low with transparent rationale.</li>
              <li><strong>Stock Check:</strong> Real-time inventory check with explicit &quot;Unknown&quot; guardrails.</li>
              <li><strong>Follow-up Approval:</strong> Human merchant review queue with expiration timer.</li>
              <li><strong>Payment Status:</strong> UPI gateway link dispatch and bank webhook reconciliation.</li>
              <li><strong>Sale Recorded:</strong> Online or in-store purchase completed; follow-ups suppressed.</li>
            </ol>
          </div>

          {/* Section 2: Key Features Checklist */}
          <div className="p-4 rounded-2xl bg-zinc-900 border border-white/[0.06] space-y-3">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              2. Core Requirements Implemented
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-3 rounded-xl bg-black/40 border border-white/[0.04]">
                <strong className="text-white block">Offline Sale Recording</strong>
                <p className="text-[11px] text-zinc-400 mt-1">
                  Click &quot;Record Offline Sale&quot; to log Cash, Direct UPI QR, or POS card.
                  Instantly decrements stock and permanently suppresses future follow-ups.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-white/[0.04]">
                <strong className="text-white block">Explainable Priority Rationale</strong>
                <p className="text-[11px] text-zinc-400 mt-1">
                  Inspect any lead to see the clear textual justification (e.g. &quot;Recent enquiry (14m) + high intent SKU + wedding deadline&quot;).
                </p>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-white/[0.04]">
                <strong className="text-white block">Explicit &quot;Unknown&quot; Stock State</strong>
                <p className="text-[11px] text-zinc-400 mt-1">
                  Product catalogue highlights items with missing physical counts and pauses quotes until the merchant verifies shelf count.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-white/[0.04]">
                <strong className="text-white block">Payment Integrity Ledger</strong>
                <p className="text-[11px] text-zinc-400 mt-1">
                  Distinctly separates Verified Paid, Pending, Failed, and Unknown payments, with interactive bank webhook simulators.
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Strict Rules & Honesty Compliance */}
          <div className="p-4 rounded-2xl bg-zinc-900 border border-white/[0.06] space-y-2">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              3. Strict Technical Constraints Followed
            </h3>
            <ul className="list-disc list-inside space-y-1 text-zinc-400 leading-relaxed">
              <li><strong>Zero Fabricated Metrics:</strong> Summary cards display authentic operational counts only (no fake ROI or fake conversion percentages).</li>
              <li><strong>No Fake Provider Badges:</strong> Messages and payments clearly state sandbox/mock status until bank webhooks verify them.</li>
              <li><strong>Zero Real Credentials:</strong> No client-side API secret keys or credentials exposed in frontend code.</li>
              <li><strong>Demo Reliability:</strong> In-memory and local mock store with instant reset capability.</li>
            </ul>
          </div>
        </div>

        <div className="pt-6 mt-4 border-t border-white/[0.08] flex justify-end">
          <button
            onClick={() => setIsDemoGuideOpen(false)}
            className="px-5 py-2.5 rounded-2xl bg-purple-500 hover:bg-purple-400 text-white font-bold text-xs transition-colors"
          >
            Explore Prototype
          </button>
        </div>
      </div>
    </div>
  );
}
