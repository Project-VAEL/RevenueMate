'use client';

import React, { useState } from 'react';
import { useStore } from '@/context/StoreContext';
import { Product, StockStatus } from '@/types';
import {
  Boxes,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Search,
  Filter,
  Layers,
  MapPin,
} from 'lucide-react';
import { StaleWarningBanner } from '@/components/common/StateBanners';

export function StockCatalogue() {
  const {
    products,
    leads,
    setSelectedProductForUpdate,
    setIsStockUpdateModalOpen,
  } = useStore();

  const [filterState, setFilterState] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const staleOrUnknownProducts = products.filter((p) => p.status === 'UNKNOWN' || p.isStale);

  const filteredProducts = products.filter((product) => {
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchName = product.name.toLowerCase().includes(q);
      const matchSku = product.sku.toLowerCase().includes(q);
      const matchCategory = product.category.toLowerCase().includes(q);
      if (!matchName && !matchSku && !matchCategory) return false;
    }

    if (filterState === 'IN_STOCK' && product.status !== 'IN_STOCK') return false;
    if (filterState === 'LOW_STOCK' && product.status !== 'LOW_STOCK') return false;
    if (filterState === 'OUT_OF_STOCK' && product.status !== 'OUT_OF_STOCK') return false;
    if (filterState === 'UNKNOWN' && product.status !== 'UNKNOWN') return false;
    if (filterState === 'STALE' && !product.isStale) return false;

    return true;
  });

  const getLeadsWaitingCount = (productId: string) => {
    return leads.filter(
      (l) => l.interestedProductId === productId && l.status !== 'SALE_RECORDED' && l.status !== 'LOST'
    ).length;
  };

  return (
    <div className="flex flex-col h-full bg-[#191A1E] border border-white/[0.07] rounded-[32px] p-5 md:p-6 space-y-4">
      {/* 1. Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3.5 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#94CCA0]/20 text-[#94CCA0] flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
            <h2 className="text-lg md:text-xl font-black text-white tracking-tight">
              Product Catalogue &amp; Stock Verification
            </h2>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Real-time physical inventory freshness tracker. Prevents promising out-of-stock items.
          </p>
        </div>

        {/* Search */}
        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search SKU or product name..."
            className="w-full bg-[#141518] border border-white/10 rounded-2xl pl-9 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#94CCA0]"
          />
        </div>
      </div>

      {/* 2. Stale Stock Warning Banner */}
      {staleOrUnknownProducts.length > 0 && (
        <StaleWarningBanner
          type="warning"
          title={`Inventory Alert: ${staleOrUnknownProducts.length} items have UNKNOWN or STALE physical stock`}
          message="Automated follow-up quotations are paused for items with unverified stock to protect store credibility and avoid unfulfillable orders."
          actionText="Verify First Item"
          onAction={() => {
            setSelectedProductForUpdate(staleOrUnknownProducts[0]);
            setIsStockUpdateModalOpen(true);
          }}
        />
      )}

      {/* 3. Filter Chips */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mr-1">
          Filter:
        </span>
        {[
          { id: 'ALL', label: `All Items (${products.length})` },
          { id: 'IN_STOCK', label: 'In Stock' },
          { id: 'LOW_STOCK', label: 'Low Stock' },
          { id: 'OUT_OF_STOCK', label: 'Out of Stock' },
          { id: 'UNKNOWN', label: 'Unknown State (Missing Count)' },
          { id: 'STALE', label: 'Stale (>48h Unchecked)' },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilterState(f.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filterState === f.id
                ? 'bg-cyan-500 text-zinc-950 font-bold'
                : 'bg-zinc-900 border border-white/[0.06] text-zinc-300 hover:text-white hover:bg-zinc-800'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* 4. Product Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredProducts.map((product) => {
          const waitingLeads = getLeadsWaitingCount(product.id);
          const isUnknown = product.status === 'UNKNOWN';
          const isStale = product.isStale;

          return (
            <div
              key={product.id}
              className={`rounded-3xl p-5 border transition-all flex flex-col justify-between relative overflow-hidden ${
                isUnknown
                  ? 'bg-amber-950/20 border-amber-500/40 ring-1 ring-amber-500/20'
                  : 'bg-zinc-900/80 border-white/[0.08] hover:border-white/20'
              }`}
            >
              {/* Top Accent Strip */}
              <div
                className="absolute top-0 left-0 right-0 h-1.5"
                style={{ backgroundColor: product.accentColor }}
              />

              <div>
                {/* SKU & Category */}
                <div className="flex items-center justify-between text-xs text-zinc-400 mb-1 pt-1">
                  <span className="font-mono font-bold tracking-wider">{product.sku}</span>
                  <span className="px-2 py-0.5 rounded-md bg-white/[0.06] text-[10px]">
                    {product.category}
                  </span>
                </div>

                {/* Name & Price */}
                <h3 className="text-sm font-black text-white mt-1 leading-snug line-clamp-2">
                  {product.name}
                </h3>
                <div className="text-base font-black text-white mt-2">
                  ₹{product.price.toLocaleString('en-IN')}
                </div>

                {/* Notes */}
                {product.notes && (
                  <p className="text-xs text-zinc-400 mt-2 leading-relaxed bg-black/30 p-2.5 rounded-xl border border-white/[0.04]">
                    {product.notes}
                  </p>
                )}

                {/* Physical Location */}
                <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-3">
                  <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                  <span>{product.rackLocation}</span>
                </div>
              </div>

              {/* Bottom: Stock Status, Last-Updated Time, Action */}
              <div className="pt-4 mt-4 border-t border-white/[0.08] space-y-2.5">
                {/* Status Badges */}
                <div className="flex items-center justify-between">
                  <div>
                    {product.status === 'IN_STOCK' && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        ✓ {product.stockQuantity} in stock
                      </span>
                    )}
                    {product.status === 'LOW_STOCK' && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        ⚡ {product.stockQuantity} left (Low Stock)
                      </span>
                    )}
                    {product.status === 'OUT_OF_STOCK' && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        ✕ Out of Stock (0)
                      </span>
                    )}
                    {product.status === 'UNKNOWN' && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/30 text-amber-300 border border-amber-500/50 flex items-center gap-1 animate-pulse">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        UNKNOWN STATE
                      </span>
                    )}
                  </div>

                  {waitingLeads > 0 && (
                    <span className="text-[11px] font-semibold text-purple-300">
                      {waitingLeads} {waitingLeads === 1 ? 'lead' : 'leads'} interested
                    </span>
                  )}
                </div>

                {/* Last-Updated Time (Explicit requirement) */}
                <div className="flex items-center justify-between text-[11px] text-zinc-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-zinc-500" />
                    Last checked: <strong className="text-zinc-300">{product.lastCheckedAt}</strong>
                  </span>
                  {isStale && (
                    <span className="text-amber-400 font-bold uppercase text-[9px] tracking-wider">
                      STALE CHECK
                    </span>
                  )}
                </div>

                {/* Verification Trigger Button */}
                <button
                  onClick={() => {
                    setSelectedProductForUpdate(product);
                    setIsStockUpdateModalOpen(true);
                  }}
                  className={`w-full py-2 px-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                    isUnknown || isStale
                      ? 'bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-md'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-white'
                  }`}
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>
                    {isUnknown ? 'Physically Verify Unknown Stock' : 'Update / Verify Count'}
                  </span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

