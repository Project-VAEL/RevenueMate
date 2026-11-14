'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/context/StoreContext';
import { StockStatus } from '@/types';
import { X, AlertTriangle, CheckCircle2, Boxes } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#18181C] border border-white/10 rounded-3xl w-full max-w-md p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={() => setIsStockUpdateModalOpen(false)}
          className="absolute top-5 right-5 text-zinc-400 hover:text-white p-1 rounded-xl bg-zinc-800"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-white">Physical Stock Verification</h3>
            <p className="text-xs text-zinc-400">Update warehouse inventory count</p>
          </div>
        </div>

        <div className="p-3 mb-4 rounded-2xl bg-zinc-900 border border-white/[0.06]">
          <p className="font-bold text-xs text-white">{selectedProductForUpdate.name}</p>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            SKU: {selectedProductForUpdate.sku} • Location: {selectedProductForUpdate.rackLocation}
          </p>
          <p className="text-[11px] text-zinc-500 mt-1">
            Last Checked: {selectedProductForUpdate.lastCheckedAt}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
              Availability State
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'IN_STOCK' as StockStatus, label: 'In Stock', color: 'border-emerald-500 text-emerald-300' },
                { id: 'LOW_STOCK' as StockStatus, label: 'Low Stock (1-2 left)', color: 'border-amber-500 text-amber-300' },
                { id: 'OUT_OF_STOCK' as StockStatus, label: 'Out of Stock (0)', color: 'border-rose-500 text-rose-300' },
                { id: 'UNKNOWN' as StockStatus, label: 'Unknown (Needs count)', color: 'border-zinc-500 text-zinc-300' },
              ].map((s) => (
                <button
                  type="button"
                  key={s.id}
                  onClick={() => {
                    setStatus(s.id);
                    if (s.id === 'OUT_OF_STOCK') setQuantity('0');
                  }}
                  className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all ${
                    status === s.id
                      ? 'bg-zinc-800 ' + s.color + ' ring-1'
                      : 'bg-zinc-900/50 border-white/[0.08] text-zinc-400 hover:text-white'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {status !== 'UNKNOWN' && (
            <div>
              <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                Verified Quantity Count
              </label>
              <input
                type="number"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Number of units in physical stock"
                className="w-full bg-[#121214] border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
              Verification Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Physically counted 3 sarees on Aisle A Shelf 3."
              className="w-full bg-[#121214] border border-white/10 rounded-2xl px-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsStockUpdateModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 hover:bg-zinc-700 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 text-xs font-bold transition-colors"
            >
              Save Verification
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

