'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/context/StoreContext';
import { PaymentMethod } from '@/types';
import {
  X,
  PlusCircle,
  Banknote,
  QrCode,
  CreditCard,
  Ban,
  CheckCircle2,
  Store,
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

  // Prepopulate modal with currently active lead or defaults
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

  // When selected lead changes in dropdown
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

  // When selected product changes in dropdown
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
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#18181C] border border-white/10 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 my-8">
        {/* Close Button */}
        <button
          onClick={() => setIsOfflineSaleModalOpen(false)}
          className="absolute top-5 right-5 text-zinc-400 hover:text-white p-1 rounded-xl bg-zinc-800"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-white">Record Offline In-Store Purchase</h3>
            <p className="text-xs text-zinc-400">Cash, Counter UPI QR, or POS Terminal</p>
          </div>
        </div>

        {/* CRITICAL WORKFLOW NOTIFICATION */}
        <div className="p-3.5 mb-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 flex items-start gap-3">
          <Ban className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-bold text-white block">Automatic Follow-up Suppression:</span>
            Recording this purchase will immediately mark the lead as{' '}
            <strong className="text-emerald-300 font-bold">Sale Recorded</strong>, decrement stock,
            and <strong className="text-emerald-300 font-bold">permanently cancel all pending WhatsApp follow-ups</strong> to ensure the customer is never spammed.
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Mode Switcher */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
              Customer Origin
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setLeadMode('EXISTING')}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                  leadMode === 'EXISTING'
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/50'
                    : 'bg-zinc-900 border-white/[0.08] text-zinc-400'
                }`}
              >
                Existing Lead / Enquiry
              </button>
              <button
                type="button"
                onClick={() => {
                  setLeadMode('WALK_IN');
                  setCustomerName('Walk-in Customer');
                  setCustomerPhone('');
                }}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                  leadMode === 'WALK_IN'
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/50'
                    : 'bg-zinc-900 border-white/[0.08] text-zinc-400'
                }`}
              >
                New Walk-In Shopper
              </button>
            </div>
          </div>

          {/* Existing Lead Selector */}
          {leadMode === 'EXISTING' && (
            <div>
              <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                Select Lead to Convert
              </label>
              <select
                value={selectedLeadId}
                onChange={(e) => handleLeadSelect(e.target.value)}
                className="w-full bg-[#121214] border border-white/10 rounded-2xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                required
              >
                {leads
                  .filter((l) => l.status !== 'SALE_RECORDED')
                  .map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} ({l.phone}) - {l.interestedProductName || 'Ethnic Wear'}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Customer Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                Customer Name
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Vikram Mehta"
                className="w-full bg-[#121214] border border-white/10 rounded-2xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                Phone Number (Optional)
              </label>
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="+91 98200 12345"
                className="w-full bg-[#121214] border border-white/10 rounded-2xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Product Selector */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
              Purchased Product / SKU
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => handleProductSelect(e.target.value)}
              className="w-full bg-[#121214] border border-white/10 rounded-2xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
              required
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (SKU: {p.sku}) — ₹{p.price.toLocaleString('en-IN')}{' '}
                  {p.stockQuantity !== null ? `[${p.stockQuantity} in stock]` : '[Stock Unknown]'}
                </option>
              ))}
            </select>
          </div>

          {/* Final Amount */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
              Final Recorded Price (₹ INR)
            </label>
            <input
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(parseInt(e.target.value, 10) || 0)}
              className="w-full bg-[#121214] border border-white/10 rounded-2xl px-3.5 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-emerald-500"
              required
            />
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
              In-Store Payment Mode
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                {
                  id: 'DIRECT_UPI_QR' as PaymentMethod,
                  label: 'Counter UPI QR',
                  icon: QrCode,
                },
                {
                  id: 'CASH' as PaymentMethod,
                  label: 'Store Cash',
                  icon: Banknote,
                },
                {
                  id: 'POS_CARD' as PaymentMethod,
                  label: 'POS Terminal',
                  icon: CreditCard,
                },
              ].map((m) => {
                const Icon = m.icon;
                const isSelected = paymentMethod === m.id;
                return (
                  <button
                    type="button"
                    key={m.id}
                    onClick={() => setPaymentMethod(m.id)}
                    className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                      isSelected
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60 shadow-sm'
                        : 'bg-zinc-900 border-white/[0.06] text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
              Receipt Note / Internal Memo
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Scanned counter QR code, soundbox announced payment."
              className="w-full bg-[#121214] border border-white/10 rounded-2xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={() => setIsOfflineSaleModalOpen(false)}
              className="px-4 py-2.5 rounded-2xl bg-zinc-800 text-zinc-300 hover:bg-zinc-700 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-black transition-colors flex items-center gap-1.5 shadow-md"
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
