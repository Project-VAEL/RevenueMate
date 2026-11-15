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
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-[#FF5E3A]/20 rounded-[36px] w-full max-w-lg p-6 md:p-7 shadow-[0_25px_60px_rgba(35,20,15,0.22)] relative my-8 animate-in fade-in zoom-in-95 duration-200 text-[#291A17]">
        {/* Close Button */}
        <button
          onClick={() => setIsOfflineSaleModalOpen(false)}
          className="absolute top-6 right-6 text-[#806761] hover:text-[#291A17] p-1.5 rounded-full bg-[#FFF0EB] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#FF5E3A] to-[#FF8568] text-white flex items-center justify-center font-bold shadow-[0_4px_14px_rgba(255,94,58,0.28)]">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-base text-[#291A17] tracking-tight">Record In-Store Offline Sale</h3>
            <p className="text-xs text-[#806761]">Direct Counter UPI QR, Store Cash, or POS Swipes (Vale Enterprises)</p>
          </div>
        </div>

        {/* Follow-up Suppression Notification */}
        <div className="p-3.5 mb-5 rounded-2xl bg-[#E8F5E9] border border-[#2E7D32]/30 text-[#1B4D1F] flex items-start gap-2.5">
          <Ban className="w-4 h-4 text-[#2E7D32] shrink-0 mt-0.5" />
          <div className="text-[11px] leading-relaxed">
            <strong className="text-[#1B4D1F] block font-bold">Automatic Follow-up Suppression:</strong>
            Logging this in-store payment immediately marks the customer as{' '}
            <strong className="text-[#2E7D32] font-black">Sale Recorded</strong> and{' '}
            <strong className="text-[#2E7D32] font-black">permanently cancels all queued WhatsApp follow-ups</strong> to avoid customer annoyance.
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Mode Switcher */}
          <div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setLeadMode('EXISTING')}
                className={`py-2 px-3 rounded-full text-xs font-bold transition-all ${
                  leadMode === 'EXISTING'
                    ? 'bg-gradient-to-r from-[#FF5E3A] to-[#FF8367] text-white shadow-sm'
                    : 'bg-[#FFF0EB] text-[#806761] hover:text-[#291A17]'
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
                className={`py-2 px-3 rounded-full text-xs font-bold transition-all ${
                  leadMode === 'WALK_IN'
                    ? 'bg-gradient-to-r from-[#FF5E3A] to-[#FF8367] text-white shadow-sm'
                    : 'bg-[#FFF0EB] text-[#806761] hover:text-[#291A17]'
                }`}
              >
                New In-Store Walk-In
              </button>
            </div>
          </div>

          {/* Existing Lead Selector */}
          {leadMode === 'EXISTING' && (
            <div>
              <label className="block text-[10px] font-bold text-[#806761] uppercase tracking-widest mb-1">
                Select Customer Lead
              </label>
              <select
                value={selectedLeadId}
                onChange={(e) => handleLeadSelect(e.target.value)}
                className="w-full bg-[#FFF0EB] border border-[#FF5E3A]/20 rounded-2xl px-3 py-2.5 text-xs text-[#291A17] focus:outline-none focus:border-[#FF5E3A]"
                required
              >
                {leads
                  .filter((l) => l.status !== 'SALE_RECORDED')
                  .map((l) => (
                    <option key={l.id} value={l.id} className="bg-white text-[#291A17]">
                      {l.name} ({l.phone}) - {l.interestedProductName || 'Ethnic Wear'}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Customer Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[10px] font-bold text-[#806761] uppercase tracking-widest mb-1">
                Customer Name
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Vikram Mehta"
                className="w-full bg-[#FFF0EB] border border-[#FF5E3A]/20 rounded-2xl px-3 py-2 text-xs text-[#291A17] focus:outline-none focus:border-[#FF5E3A]"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[#806761] uppercase tracking-widest mb-1">
                Phone Number
              </label>
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="+91 98200 12345"
                className="w-full bg-[#FFF0EB] border border-[#FF5E3A]/20 rounded-2xl px-3 py-2 text-xs text-[#291A17] focus:outline-none focus:border-[#FF5E3A]"
              />
            </div>
          </div>

          {/* Product Selector */}
          <div>
            <label className="block text-[10px] font-bold text-[#806761] uppercase tracking-widest mb-1">
              Purchased Product / SKU
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => handleProductSelect(e.target.value)}
              className="w-full bg-[#FFF0EB] border border-[#FF5E3A]/20 rounded-2xl px-3 py-2 text-xs text-[#291A17] focus:outline-none focus:border-[#FF5E3A]"
              required
            >
              {products.map((p) => (
                <option key={p.id} value={p.id} className="bg-white text-[#291A17]">
                  {p.name} (SKU: {p.sku}) — ₹{p.price.toLocaleString('en-IN')}{' '}
                  {p.stockQuantity !== null ? `[${p.stockQuantity} in stock]` : '[Stock Unknown]'}
                </option>
              ))}
            </select>
          </div>

          {/* Final Recorded Amount */}
          <div>
            <label className="block text-[10px] font-bold text-[#806761] uppercase tracking-widest mb-1">
              Final In-Store Amount (₹ INR)
            </label>
            <input
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(parseInt(e.target.value, 10) || 0)}
              className="w-full bg-[#FFF0EB] border border-[#FF5E3A]/20 rounded-2xl px-3.5 py-2.5 text-base font-black text-[#291A17] focus:outline-none focus:border-[#FF5E3A] font-mono"
              required
            />
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-[10px] font-bold text-[#806761] uppercase tracking-widest mb-1.5">
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
                        ? 'bg-[#FFEAE3] text-[#FF5E3A] border-[#FF5E3A]/60 shadow-sm'
                        : 'bg-[#FFF0EB] border-[#FF5E3A]/15 text-[#806761] hover:text-[#291A17]'
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
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#FF5E3A]/10">
            <button
              type="button"
              onClick={() => setIsOfflineSaleModalOpen(false)}
              className="px-4 py-2.5 rounded-full bg-[#FFF0EB] text-[#806761] hover:text-[#291A17] text-xs font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-full bg-gradient-to-r from-[#FF5E3A] to-[#E24823] hover:from-[#E24823] hover:to-[#FF5E3A] text-white text-xs font-black transition-all flex items-center gap-1.5 shadow-[0_8px_24px_rgba(255,94,58,0.3)] cursor-pointer"
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
