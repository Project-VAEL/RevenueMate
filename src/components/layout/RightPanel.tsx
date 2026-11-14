'use client';

import React, { useState } from 'react';
import { useStore } from '@/context/StoreContext';
import {
  Banknote,
  CreditCard,
  QrCode,
  ArrowUpDown,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Boxes,
} from 'lucide-react';
import { PaymentMethod } from '@/types';

export function RightPanel() {
  const {
    leads,
    products,
    metrics,
    recordOfflineSale,
    setIsOfflineSaleModalOpen,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'RECORD' | 'APPROVE'>('RECORD');
  const [selectedLeadId, setSelectedLeadId] = useState<string>(leads[0]?.id || '');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('DIRECT_UPI_QR');

  const currentLead = leads.find((l) => l.id === selectedLeadId) || leads[0];
  const matchedProduct = products.find((p) => p.id === currentLead?.interestedProductId) || products[0];
  const chargeAmount = currentLead?.quotedAmount || matchedProduct?.price || 18500;

  const handleQuickRecord = () => {
    recordOfflineSale({
      leadId: currentLead.id,
      customerName: currentLead.name,
      customerPhone: currentLead.phone,
      productId: matchedProduct.id,
      amount: chargeAmount,
      paymentMethod: paymentMethod,
      notes: 'Quick recorded from side panel. Follow-ups automatically suppressed.',
    });
  };

  return (
    <aside className="w-full xl:w-[330px] shrink-0 space-y-3.5">
      {/* 1. Stacked Payment Channels matching top right in reference image */}
      <div className="space-y-2">
        {/* Item 1: Cash in Drawer */}
        <div className="p-3.5 rounded-2xl bg-[#191A1E] border border-white/[0.06] hover:border-white/10 flex items-center justify-between transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-zinc-800 text-zinc-300 flex items-center justify-center">
              <Banknote className="w-4 h-4" />
            </div>
            <div>
              <h5 className="text-xs font-bold text-white">Cash in Drawer</h5>
              <p className="text-[10px] text-zinc-400">Physical Register</p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#94CCA0]/20 text-[#94CCA0]">
            ↗ +2.5%
          </span>
        </div>

        {/* Item 2: POS Card Terminal */}
        <div className="p-3.5 rounded-2xl bg-[#191A1E] border border-white/[0.06] hover:border-white/10 flex items-center justify-between transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-zinc-800 text-zinc-300 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h5 className="text-xs font-bold text-white">POS Terminal</h5>
              <p className="text-[10px] text-zinc-400">Wireless Swipes</p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#94CCA0]/20 text-[#94CCA0]">
            ↗ +12.4%
          </span>
        </div>

        {/* Item 3: Active Solid Terracotta Card matching Crypto card in reference */}
        <div className="rounded-[28px] p-5 bg-[#EE7A5C] text-zinc-950 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-black/15 text-zinc-950 flex items-center justify-center font-bold">
                <QrCode className="w-4 h-4" />
              </div>
              <span className="text-sm font-black text-zinc-950">Direct UPI Soundbox</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/15 text-zinc-950 flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" />
              +24.2%
            </span>
          </div>

          <div className="text-3xl font-black tracking-tight text-zinc-950 mt-1 tabular-nums">
            ₹{metrics.todaySalesAmount.toLocaleString('en-IN')}<span className="text-lg font-bold">.00</span>
          </div>
          <p className="text-[11px] font-semibold text-zinc-950/80 mt-1">
            {metrics.offlineSalesCount} in-store walk-in sales confirmed
          </p>
        </div>
      </div>

      {/* 2. The Iconic Giant Pastel Mint-Green Panel matching Buy/Sell card in reference */}
      <div className="rounded-[32px] p-5 bg-[#94CCA0] text-zinc-950 shadow-xl flex flex-col justify-between min-h-[380px]">
        <div>
          {/* Header tabs matching Buy / Sell */}
          <div className="flex items-center gap-4 mb-3">
            <button
              onClick={() => setActiveTab('RECORD')}
              className={`text-base font-black transition-opacity ${
                activeTab === 'RECORD' ? 'opacity-100' : 'opacity-40 hover:opacity-75'
              }`}
            >
              Record Sale
            </button>
            <button
              onClick={() => setActiveTab('APPROVE')}
              className={`text-base font-black transition-opacity ${
                activeTab === 'APPROVE' ? 'opacity-100' : 'opacity-40 hover:opacity-75'
              }`}
            >
              Instant Sign-off
            </button>
          </div>

          {/* Container 1: YOU CHARGE */}
          <div className="rounded-2xl border border-emerald-900/15 bg-emerald-900/10 p-3.5 relative">
            <div className="flex items-center justify-between mb-1">
              {/* Dropdown with customer */}
              <div className="flex items-center gap-1.5 font-bold text-xs">
                <div className="w-5 h-5 rounded-full bg-zinc-950 text-white flex items-center justify-center text-[10px]">
                  {currentLead.name[0]}
                </div>
                <select
                  value={selectedLeadId}
                  onChange={(e) => setSelectedLeadId(e.target.value)}
                  className="bg-transparent font-black text-xs text-zinc-950 focus:outline-none cursor-pointer"
                >
                  {leads.map((l) => (
                    <option key={l.id} value={l.id} className="bg-zinc-900 text-white">
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>

              <span className="text-[9px] font-mono font-bold tracking-wider uppercase text-emerald-950/70">
                YOU CHARGE
              </span>
            </div>

            <p className="text-[10px] text-emerald-950/80 font-medium truncate">
              {matchedProduct.name}
            </p>

            <div className="text-2xl font-black text-zinc-950 mt-1 tabular-nums">
              ₹{chargeAmount.toLocaleString('en-IN')}
            </div>

            <div className="flex items-center justify-between text-[10px] font-mono text-emerald-950/70 mt-1">
              <span>Shelf: {matchedProduct.rackLocation}</span>
              <span>Stock: {matchedProduct.stockQuantity ?? 'Unknown'}</span>
            </div>
          </div>

          {/* Floating black circular swap button matching ⇅ in reference image */}
          <div className="flex justify-center -my-3 relative z-10">
            <button
              onClick={() => {
                setPaymentMethod(paymentMethod === 'DIRECT_UPI_QR' ? 'CASH' : 'DIRECT_UPI_QR');
              }}
              className="w-9 h-9 rounded-full bg-zinc-950 text-white flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
              title="Toggle payment mode"
            >
              <ArrowUpDown className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>

          {/* Container 2: YOU RECORD */}
          <div className="rounded-2xl border border-emerald-900/15 bg-emerald-900/10 p-3.5 relative">
            <div className="flex items-center justify-between mb-1">
              {/* Dropdown with payment method */}
              <div className="flex items-center gap-1.5 font-bold text-xs">
                <div className="w-5 h-5 rounded-full bg-zinc-950 text-white flex items-center justify-center text-[10px]">
                  ✓
                </div>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="bg-transparent font-black text-xs text-zinc-950 focus:outline-none cursor-pointer"
                >
                  <option value="DIRECT_UPI_QR" className="bg-zinc-900 text-white">
                    Direct Counter UPI QR
                  </option>
                  <option value="CASH" className="bg-zinc-900 text-white">
                    Store Cash in Drawer
                  </option>
                  <option value="POS_CARD" className="bg-zinc-900 text-white">
                    Store POS Card
                  </option>
                </select>
              </div>

              <span className="text-[9px] font-mono font-bold tracking-wider uppercase text-emerald-950/70">
                YOU RECORD
              </span>
            </div>

            <p className="text-[10px] text-emerald-950/80 font-medium">
              Auto-suppresses pending WhatsApp follow-ups
            </p>

            <div className="text-2xl font-black text-zinc-950 mt-1 tabular-nums">
              ₹{chargeAmount.toLocaleString('en-IN')}
            </div>

            <div className="text-[10px] font-mono text-emerald-950/70 mt-1">
              Receipt: REC-AUTO • Status: Instant Verified
            </div>
          </div>
        </div>

        {/* Big Black Pill Action Button matching reference CTA */}
        <div className="pt-3">
          <button
            onClick={handleQuickRecord}
            className="w-full py-3.5 rounded-2xl bg-zinc-950 hover:bg-zinc-900 text-white font-black text-xs tracking-wide transition-transform hover:scale-[1.02] shadow-xl flex items-center justify-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4 text-[#94CCA0]" />
            <span>Confirm &amp; Suppress Follow-ups</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
