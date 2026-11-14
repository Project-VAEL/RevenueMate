'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/context/StoreContext';
import { PaymentMethod } from '@/types';
import {
  X,
  Banknote,
  QrCode,
  CreditCard,
  Ban,
  CheckCircle2,
  Store,
  ArrowUpDown,
} from 'lucide-react';

export function RecordOfflineSaleModal() {
  const {
    isOfflineSaleModalOpen,
    setIsOfflineSaleModalOpen,
    leads,
    products,
    selectedLead,
    recordOfflineSale,
  } = useStore();

  const [leadMode, setLeadMode] = useState<'EXISTING' | 'WALK_IN'>('EXISTING');
  const [selectedLeadId, setSelectedLeadId] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('DIRECT_UPI_QR');
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (isOfflineSaleModalOpen) {
      if (selectedLead && selectedLead.status !== 'SALE_RECORDED') {
        setLeadMode('EXISTING');
        setSelectedLeadId(selectedLead.id);
        setCustomerName(selectedLead.name);
        setCustomerPhone(selectedLead.phone);
        if (selectedLead.interestedProductId) {
          setSelectedProductId(selectedLead.interestedProductId);
          const p = products.find((prod) => prod.id === selectedLead.interestedProductId);
          setAmount(selectedLead.quotedAmount || p?.price || 0);
        } else if (products.length > 0) {
          setSelectedProductId(products[0].id);
          setAmount(products[0].price);
        }
      } else {
        setLeadMode('WALK_IN');
        setCustomerName('In-Store Walk-in');
        setCustomerPhone('');
        if (products.length > 0) {
          setSelectedProductId(products[0].id);
          setAmount(products[0].price);
        }
      }
    }
  }, [isOfflineSaleModalOpen, selectedLead, products]);

  const handleLeadSelect = (id: string) => {
    setSelectedLeadId(id);
    const l = leads.find((lead) => lead.id === id);
    if (l) {
      setCustomerName(l.name);
      setCustomerPhone(l.phone);
      if (l.interestedProductId) {
        setSelectedProductId(l.interestedProductId);
        const p = products.find((prod) => prod.id === l.interestedProductId);
        setAmount(l.quotedAmount || p?.price || 0);
      }
    }
  };

  const handleProductSelect = (id: string) => {
    setSelectedProductId(id);
    const p = products.find((prod) => prod.id === id);
    if (p) {
      setAmount(p.price);
    }
  };

  if (!isOfflineSaleModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !selectedProductId || amount <= 0) return;

    recordOfflineSale({
      leadId: leadMode === 'EXISTING' ? selectedLeadId : undefined,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim() || undefined,
      productId: selectedProductId,
      amount: amount,
      paymentMethod: paymentMethod,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#191A1E] border border-white/[0.08] rounded-[36px] w-full max-w-lg p-6 md:p-7 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 my-8">
        {/* Close Button */}
        <button
          onClick={() => setIsOfflineSaleModalOpen(false)}
          className="absolute top-6 right-6 text-zinc-400 hover:text-white p-1.5 rounded-full bg-[#22242A] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-[#94CCA0]/20 text-[#94CCA0] flex items-center justify-center font-bold">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-base text-white tracking-tight">Record In-Store Offline Sale</h3>
            <p className="text-xs text-zinc-400">Direct Counter UPI QR, Store Cash, or POS Swipes</p>
          </div>
        </div>

        {/* Follow-up Suppression Notification */}
        <div className="p-3.5 mb-5 rounded-2xl bg-[#94CCA0]/15 border border-[#94CCA0]/30 text-emerald-100 flex items-start gap-2.5">
          <Ban className="w-4 h-4 text-[#94CCA0] shrink-0 mt-0.5" />
          <div className="text-[11px] leading-relaxed">
            <strong className="text-white block font-bold">Automatic Follow-up Suppression:</strong>
            Logging this in-store payment immediately marks the customer as{' '}
            <strong className="text-[#94CCA0] font-bold">Sale Recorded</strong> and{' '}
            <strong className="text-[#94CCA0] font-bold">permanently cancels all queued WhatsApp follow-ups</strong> to avoid customer annoyance.
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Mode Switcher */}
          <div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setLeadMode('EXISTING')}
                className={`py-2 px-3 rounded-2xl text-xs font-bold transition-all ${
                  leadMode === 'EXISTING'
                    ? 'bg-white text-zinc-950 shadow-sm'
                    : 'bg-[#141518] text-zinc-400 hover:text-white'
                }`}
              >
                Existing Lead
              </button>
              <button
                type="button"
                onClick={() => {
                  setLeadMode('WALK_IN');
                  setCustomerName('Walk-in Customer');
                  setCustomerPhone('');
                }}
                className={`py-2 px-3 rounded-2xl text-xs font-bold transition-all ${
                  leadMode === 'WALK_IN'
                    ? 'bg-white text-zinc-950 shadow-sm'
                    : 'bg-[#141518] text-zinc-400 hover:text-white'
                }`}
              >
                New In-Store Walk-In
              </button>
            </div>
          </div>

          {/* Existing Lead Selector */}
          {leadMode === 'EXISTING' && (
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">
                Select Customer Lead
              </label>
              <select
                value={selectedLeadId}
                onChange={(e) => handleLeadSelect(e.target.value)}
                className="w-full bg-[#141518] border border-white/10 rounded-2xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#94CCA0]"
                required
              >
                {leads
                  .filter((l) => l.status !== 'SALE_RECORDED')
                  .map((l) => (
                    <option key={l.id} value={l.id} className="bg-zinc-900 text-white">
                      {l.name} ({l.phone}) - {l.interestedProductName || 'Ethnic Wear'}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Customer Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">
                Customer Name
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Vikram Mehta"
                className="w-full bg-[#141518] border border-white/10 rounded-2xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#94CCA0]"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">
                Phone Number
              </label>
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="+91 98200 12345"
                className="w-full bg-[#141518] border border-white/10 rounded-2xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#94CCA0]"
              />
            </div>
          </div>

          {/* Product Selector */}
          <div>
            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">
              Purchased Product / SKU
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => handleProductSelect(e.target.value)}
              className="w-full bg-[#141518] border border-white/10 rounded-2xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#94CCA0]"
              required
            >
              {products.map((p) => (
                <option key={p.id} value={p.id} className="bg-zinc-900 text-white">
                  {p.name} (SKU: {p.sku}) — ₹{p.price.toLocaleString('en-IN')}{' '}
                  {p.stockQuantity !== null ? `[${p.stockQuantity} in stock]` : '[Stock Unknown]'}
                </option>
              ))}
            </select>
          </div>

          {/* Final Recorded Amount */}
          <div>
            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">
              Final In-Store Amount (₹ INR)
            </label>
            <input
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(parseInt(e.target.value, 10) || 0)}
              className="w-full bg-[#141518] border border-white/10 rounded-2xl px-3.5 py-2.5 text-base font-black text-white focus:outline-none focus:border-[#94CCA0] font-mono"
              required
            />
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">
              Payment Method
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'DIRECT_UPI_QR' as PaymentMethod, label: 'Counter UPI QR', icon: QrCode },
                { id: 'CASH' as PaymentMethod, label: 'Store Cash', icon: Banknote },
                { id: 'POS_CARD' as PaymentMethod, label: 'POS Terminal', icon: CreditCard },
              ].map((m) => {
                const Icon = m.icon;
                const isSelected = paymentMethod === m.id;
                return (
                  <button
                    type="button"
                    key={m.id}
                    onClick={() => setPaymentMethod(m.id)}
                    className={`p-2.5 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                      isSelected
                        ? 'bg-[#94CCA0]/20 text-[#94CCA0] border-[#94CCA0]/60 shadow-sm'
                        : 'bg-[#141518] border-white/[0.05] text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-[11px]">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={() => setIsOfflineSaleModalOpen(false)}
              className="px-4 py-2.5 rounded-2xl bg-[#22242A] text-zinc-300 hover:bg-zinc-800 text-xs font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-2xl bg-[#94CCA0] hover:bg-[#A5DDB1] text-zinc-950 text-xs font-black transition-all flex items-center gap-1.5 shadow-lg cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm &amp; Suppress Follow-ups</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
