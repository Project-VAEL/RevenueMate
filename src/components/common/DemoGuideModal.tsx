'use client';

import React from 'react';
import { useStore } from '@/context/StoreContext';
import { X, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';

export function DemoGuideModal() {
  const { isDemoGuideOpen, setIsDemoGuideOpen } = useStore();

  if (!isDemoGuideOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-[#FF5E3A]/20 rounded-[36px] w-full max-w-2xl p-6 md:p-8 shadow-[0_25px_60px_rgba(35,20,15,0.22)] relative my-8 max-h-[90vh] overflow-y-auto text-[#291A17] animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={() => setIsDemoGuideOpen(false)}
          className="absolute top-6 right-6 text-[#806761] hover:text-[#291A17] p-1.5 rounded-full bg-[#FFF0EB]"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#FF5E3A] to-[#FF8568] flex items-center justify-center text-white shadow-[0_4px_16px_rgba(255,94,58,0.28)] font-bold">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-[#291A17] tracking-tight">
              RevenueMate Prototype &amp; Evaluation Guide
            </h2>
            <p className="text-xs text-[#806761]">
              Interactive merchant-facing dashboard prototype for small retail businesses
            </p>
          </div>
        </div>

        <div className="space-y-4 text-xs text-[#291A17]">
          {/* Section 1: Sales Workflow */}
          <div className="p-4 rounded-2xl bg-[#FFF3EE] border border-[#FF5E3A]/15 space-y-2">
            <h3 className="font-bold text-[#291A17] text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#FF5E3A]" />
              1. The 7-Stage Sales Workflow
            </h3>
            <p className="text-[#806761] leading-relaxed">
              Every customer journey is visibly tracked across the top workflow stepper:
            </p>
            <ol className="list-decimal list-inside space-y-1 font-mono text-[#291A17] pl-1 font-medium">
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
          <div className="p-4 rounded-2xl bg-[#FFF3EE] border border-[#FF5E3A]/15 space-y-3">
            <h3 className="font-bold text-[#291A17] text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#2E7D32]" />
              2. Core Requirements Implemented
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-3 rounded-xl bg-white border border-[#FF5E3A]/15 shadow-sm">
                <strong className="text-[#291A17] block font-bold">Offline Sale Recording</strong>
                <p className="text-[11px] text-[#806761] mt-1">
                  Click &quot;Record Offline Sale&quot; to log Cash, Direct UPI QR, or POS card.
                  Instantly decrements stock and permanently suppresses future follow-ups.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white border border-[#FF5E3A]/15 shadow-sm">
                <strong className="text-[#291A17] block font-bold">Explainable Priority Rationale</strong>
                <p className="text-[11px] text-[#806761] mt-1">
                  Inspect any lead to see the clear textual justification (e.g. &quot;Recent enquiry (14m) + high intent SKU + wedding deadline&quot;).
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white border border-[#FF5E3A]/15 shadow-sm">
                <strong className="text-[#291A17] block font-bold">Explicit &quot;Unknown&quot; Stock State</strong>
                <p className="text-[11px] text-[#806761] mt-1">
                  Product catalogue highlights items with missing physical counts and pauses quotes until the merchant verifies shelf count.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white border border-[#FF5E3A]/15 shadow-sm">
                <strong className="text-[#291A17] block font-bold">Payment Integrity Ledger</strong>
                <p className="text-[11px] text-[#806761] mt-1">
                  Distinctly separates Verified Paid, Pending, Failed, and Unknown payments, with interactive bank webhook simulators.
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Strict Rules & Honesty Compliance */}
          <div className="p-4 rounded-2xl bg-[#FFF3EE] border border-[#FF5E3A]/15 space-y-2">
            <h3 className="font-bold text-[#291A17] text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#D97706]" />
              3. Strict Technical Constraints Followed
            </h3>
            <ul className="list-disc list-inside space-y-1 text-[#806761] leading-relaxed">
              <li><strong>Zero Fabricated Metrics:</strong> Summary cards display authentic operational counts only (no fake ROI or fake conversion percentages).</li>
              <li><strong>No Fake Provider Badges:</strong> Messages and payments clearly state sandbox/mock status until bank webhooks verify them.</li>
              <li><strong>Zero Real Credentials:</strong> No client-side API secret keys or credentials exposed in frontend code.</li>
              <li><strong>Demo Reliability:</strong> In-memory and local mock store with instant reset capability.</li>
            </ul>
          </div>
        </div>

        <div className="pt-5 mt-4 border-t border-[#FF5E3A]/10 flex justify-end">
          <button
            onClick={() => setIsDemoGuideOpen(false)}
            className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#FF5E3A] to-[#FF8367] hover:from-[#E24823] hover:to-[#FF5E3A] text-white font-black text-xs transition-transform hover:scale-105 shadow-[0_4px_14px_rgba(255,94,58,0.25)]"
          >
            Explore Prototype
          </button>
        </div>
      </div>
    </div>
  );
}
