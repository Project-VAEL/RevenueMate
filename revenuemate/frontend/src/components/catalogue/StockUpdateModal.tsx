'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/context/StoreContext';
import { StockStatus } from '@/types';
import { X, Boxes } from 'lucide-react';

export function StockUpdateModal() {
  const {
    isStockUpdateModalOpen,
    setIsStockUpdateModalOpen,
    selectedProductForUpdate,
    updateProductStock,
  } = useStore();

  const [quantity, setQuantity] = useState<string>('3');
  const [status, setStatus] = useState<StockStatus>('IN_STOCK');
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (selectedProductForUpdate) {
      setQuantity(
        selectedProductForUpdate.stockQuantity !== null
          ? selectedProductForUpdate.stockQuantity.toString()
          : ''
      );
      setStatus(selectedProductForUpdate.status);
      setNotes(selectedProductForUpdate.notes || '');
    }
  }, [selectedProductForUpdate]);

  if (!isStockUpdateModalOpen || !selectedProductForUpdate) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = status === 'UNKNOWN' ? null : parseInt(quantity, 10) || 0;
    updateProductStock(selectedProductForUpdate.id, qty, status, notes);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-[#FF5E3A]/20 rounded-[36px] w-full max-w-md p-6 md:p-7 shadow-[0_25px_60px_rgba(35,20,15,0.22)] relative animate-in fade-in zoom-in-95 duration-200 text-[#291A17]">
        <button
          onClick={() => setIsStockUpdateModalOpen(false)}
          className="absolute top-6 right-6 text-[#806761] hover:text-[#291A17] p-1.5 rounded-full bg-[#FFF0EB]"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-[#FFEAE3] text-[#FF5E3A] flex items-center justify-center">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-base text-[#291A17] tracking-tight">Physical Stock Verification</h3>
            <p className="text-xs text-[#806761]">Update warehouse inventory count</p>
          </div>
        </div>

        <div className="p-3.5 mb-4 rounded-2xl bg-[#FFF3EE] border border-[#FF5E3A]/15">
          <p className="font-bold text-xs text-[#291A17]">{selectedProductForUpdate.name}</p>
          <p className="text-[11px] text-[#806761] mt-0.5 font-mono">
            SKU: {selectedProductForUpdate.sku} • Shelf: {selectedProductForUpdate.rackLocation}
          </p>
          <p className="text-[10px] text-[#806761] mt-1 font-mono">
            Last Checked: {selectedProductForUpdate.lastCheckedAt}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-[#806761] uppercase tracking-widest mb-1.5">
              Availability State
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'IN_STOCK' as StockStatus, label: 'In Stock', active: 'bg-[#E8F5E9] text-[#2E7D32] border-[#2E7D32]' },
                { id: 'LOW_STOCK' as StockStatus, label: 'Low Stock (1-2)', active: 'bg-[#FEF3C7] text-[#D97706] border-[#F59E0B]' },
                { id: 'OUT_OF_STOCK' as StockStatus, label: 'Out of Stock (0)', active: 'bg-[#FEE2E2] text-[#DC2626] border-[#DC2626]' },
                { id: 'UNKNOWN' as StockStatus, label: 'Unknown (Needs count)', active: 'bg-[#FFEAE3] text-[#E24823] border-[#FF5E3A]' },
              ].map((s) => (
                <button
                  type="button"
                  key={s.id}
                  onClick={() => {
                    setStatus(s.id);
                    if (s.id === 'OUT_OF_STOCK') setQuantity('0');
                  }}
                  className={`p-2.5 rounded-2xl border text-xs font-bold text-left transition-all ${
                    status === s.id
                      ? s.active + ' ring-1'
                      : 'bg-[#FFF0EB] border-[#FF5E3A]/15 text-[#806761] hover:text-[#291A17]'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {status !== 'UNKNOWN' && (
            <div>
              <label className="block text-[10px] font-bold text-[#806761] uppercase tracking-widest mb-1">
                Verified Quantity Count
              </label>
              <input
                type="number"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Number of units in physical stock"
                className="w-full bg-[#FFF0EB] border border-[#FF5E3A]/20 rounded-2xl px-4 py-2.5 text-xs text-[#291A17] placeholder-[#806761] focus:outline-none focus:border-[#FF5E3A] font-mono font-bold"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-[#806761] uppercase tracking-widest mb-1">
              Verification Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Physically counted 3 sarees on Aisle A Shelf 3."
              className="w-full bg-[#FFF0EB] border border-[#FF5E3A]/20 rounded-2xl px-4 py-2 text-xs text-[#291A17] placeholder-[#806761] focus:outline-none focus:border-[#FF5E3A]"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsStockUpdateModalOpen(false)}
              className="px-4 py-2 rounded-full bg-[#FFF0EB] text-[#806761] hover:text-[#291A17] text-xs font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-full bg-gradient-to-r from-[#FF5E3A] to-[#FF8367] hover:from-[#E24823] hover:to-[#FF5E3A] text-white text-xs font-black shadow-[0_4px_14px_rgba(255,94,58,0.25)] transition-all cursor-pointer"
            >
              Save Verification
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
