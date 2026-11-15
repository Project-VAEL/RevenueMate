'use client';

import React, { useState } from 'react';
import { useStore } from '@/context/StoreContext';
import {
  Banknote,
  CreditCard,
  QrCode,
  ArrowUpDown,
  TrendingUp,
  CheckCircle2,
} from 'lucide-react';
import { PaymentMethod } from '@/types';

export function RightPanel() {
  const {
    leads,
    products,
    metrics,
    recordOfflineSale,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'RECORD' | 'APPROVE'>('RECORD');
  const [selectedLeadId, setSelectedLeadId] = useState<string>(leads[0]?.id || '');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('DIRECT_UPI_QR');

  const currentLead = leads.find((l) => l.id === selectedLeadId) || leads[0];
  const matchedProduct = products.find((p) => p.id === currentLead?.interestedProductId) || products[0];
  const chargeAmount = currentLead?.quotedAmount || matchedProduct?.price || 78900;

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
      {/* 1. Stacked Payment Channels with Krishi-Rakshak Expressive Tiles */}
      <div className="space-y-2">
        {/* Item 1: Cash in Drawer */}
        <div className="p-3.5 rounded-2xl bg-white border border-[#FF5E3A]/15 hover:border-[#FF5E3A]/30 flex items-center justify-between transition-colors shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#E8F5E9] text-[#2E7D32] flex items-center justify-center">
              <Banknote className="w-4 h-4" />
            </div>
            <div>
              <h5 className="text-xs font-bold text-[#291A17]">Cash in Drawer</h5>
              <p className="text-[10px] text-[#806761]">Physical Register</p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E8F5E9] text-[#2E7D32] border border-[#2E7D32]/20">
            ↗ +2.5%
          </span>
        </div>

        {/* Item 2: POS Card Terminal */}
        <div className="p-3.5 rounded-2xl bg-white border border-[#FF5E3A]/15 hover:border-[#FF5E3A]/30 flex items-center justify-between transition-colors shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#FFEAE3] text-[#FF5E3A] flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h5 className="text-xs font-bold text-[#291A17]">POS Terminal</h5>
              <p className="text-[10px] text-[#806761]">Wireless Swipes</p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E8F5E9] text-[#2E7D32] border border-[#2E7D32]/20">
            ↗ +12.4%
          </span>
        </div>

        {/* Item 3: Active Warm Terracotta Card */}
        <div className="rounded-[28px] p-5 bg-gradient-to-br from-[#FF5E3A] to-[#FF8367] text-white shadow-[0_12px_28px_rgba(255,94,58,0.25)] relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center font-bold">
                <QrCode className="w-4 h-4" />
              </div>
              <span className="text-sm font-black text-white">Direct UPI Soundbox</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-[#FF5E3A] flex items-center gap-0.5 shadow-sm">
              <TrendingUp className="w-3 h-3" />
              +24.2%
            </span>
          </div>

          <div className="text-3xl font-black tracking-tight text-white mt-1 tabular-nums">
            ₹{metrics.todaySalesAmount.toLocaleString('en-IN')}<span className="text-lg font-bold opacity-85">.00</span>
          </div>
          <p className="text-[11px] font-semibold text-white/90 mt-1">
            {metrics.offlineSalesCount} in-store walk-in sales confirmed
          </p>
        </div>
      </div>

      {/* 2. Expressive Action Panel */}
      <div className="rounded-[32px] p-5 bg-white border border-[#FF5E3A]/15 text-[#291A17] shadow-[0_10px_30px_rgba(220,75,40,0.06)] flex flex-col justify-between min-h-[380px]">
        <div>
          {/* Header tabs */}
          <div className="flex items-center gap-4 mb-3">
            <button
              onClick={() => setActiveTab('RECORD')}
              className={`text-base font-black transition-all ${
                activeTab === 'RECORD' ? 'text-[#291A17] border-b-2 border-[#FF5E3A] pb-0.5' : 'text-[#806761] hover:text-[#291A17]'
              }`}
            >
              Record Sale
            </button>
            <button
              onClick={() => setActiveTab('APPROVE')}
              className={`text-base font-black transition-all ${
                activeTab === 'APPROVE' ? 'text-[#291A17] border-b-2 border-[#FF5E3A] pb-0.5' : 'text-[#806761] hover:text-[#291A17]'
              }`}
            >
              Instant Sign-off
            </button>
          </div>

          {/* Container 1: YOU CHARGE */}
          <div className="rounded-2xl border border-[#FF5E3A]/15 bg-[#FFF0EB] p-3.5 relative">
            <div className="flex items-center justify-between mb-1">
              {/* Dropdown with customer */}
              <div className="flex items-center gap-1.5 font-bold text-xs">
                <div className="w-5 h-5 rounded-full bg-[#FF5E3A] text-white flex items-center justify-center text-[10px]">
                  {currentLead.name[0]}
                </div>
                <select
                  value={selectedLeadId}
                  onChange={(e) => setSelectedLeadId(e.target.value)}
                  className="bg-transparent font-black text-xs text-[#291A17] focus:outline-none cursor-pointer"
                >
                  {leads.map((l) => (
                    <option key={l.id} value={l.id} className="bg-white text-[#291A17]">
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>

              <span className="text-[9px] font-mono font-bold tracking-wider uppercase text-[#806761]">
                YOU CHARGE
              </span>
            </div>

            <p className="text-[10px] text-[#806761] font-medium truncate">
              {matchedProduct.name}
            </p>

            <div className="text-2xl font-black text-[#291A17] mt-1 tabular-nums">
              ₹{chargeAmount.toLocaleString('en-IN')}
            </div>

            <div className="flex items-center justify-between text-[10px] font-mono text-[#806761] mt-1">
              <span>Shelf: {matchedProduct.rackLocation}</span>
              <span>Stock: {matchedProduct.stockQuantity ?? 'Unknown'}</span>
            </div>
          </div>

          {/* Floating Coral circular swap button */}
          <div className="flex justify-center -my-3 relative z-10">
            <button
              onClick={() => {
                setPaymentMethod(paymentMethod === 'DIRECT_UPI_QR' ? 'CASH' : 'DIRECT_UPI_QR');
              }}
              className="w-9 h-9 rounded-full bg-[#FF5E3A] hover:bg-[#E24823] text-white flex items-center justify-center shadow-[0_4px_14px_rgba(255,94,58,0.35)] hover:scale-105 transition-transform"
              title="Toggle payment mode"
            >
              <ArrowUpDown className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>

          {/* Container 2: YOU RECORD */}
          <div className="rounded-2xl border border-[#FF5E3A]/15 bg-[#FFF0EB] p-3.5 relative">
            <div className="flex items-center justify-between mb-1">
              {/* Dropdown with payment method */}
              <div className="flex items-center gap-1.5 font-bold text-xs">
                <div className="w-5 h-5 rounded-full bg-[#2E7D32] text-white flex items-center justify-center text-[10px]">
                  ✓
                </div>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="bg-transparent font-black text-xs text-[#291A17] focus:outline-none cursor-pointer"
                >
                  <option value="DIRECT_UPI_QR" className="bg-white text-[#291A17]">
                    Direct Counter UPI QR
                  </option>
                  <option value="CASH" className="bg-white text-[#291A17]">
                    Store Cash in Drawer
                  </option>
                  <option value="POS_CARD" className="bg-white text-[#291A17]">
                    Store POS Card
                  </option>
                </select>
              </div>

              <span className="text-[9px] font-mono font-bold tracking-wider uppercase text-[#806761]">
                YOU RECORD
              </span>
            </div>

            <p className="text-[10px] text-[#806761] font-medium">
              Auto-suppresses pending WhatsApp follow-ups
            </p>

            <div className="text-2xl font-black text-[#291A17] mt-1 tabular-nums">
              ₹{chargeAmount.toLocaleString('en-IN')}
            </div>

            <div className="text-[10px] font-mono text-[#806761] mt-1">
              Receipt: REC-AUTO • Status: Instant Verified
            </div>
          </div>
        </div>

        {/* Big Coral CTA Button */}
        <div className="pt-3">
          <button
            onClick={handleQuickRecord}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#FF5E3A] to-[#E24823] hover:from-[#E24823] hover:to-[#FF5E3A] text-white font-black text-xs tracking-wide transition-transform hover:scale-[1.02] shadow-[0_8px_24px_rgba(255,94,58,0.3)] flex items-center justify-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4 text-white" />
            <span>Confirm &amp; Suppress Follow-ups</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
