'use client';

import React, { useState } from 'react';
import { useStore } from '@/context/StoreContext';
import {
  AlertTriangle,
  Clock,
  RefreshCw,
  Search,
  MapPin,
} from 'lucide-react';

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
  const inStockCount = products.filter((p) => p.status === 'IN_STOCK').length;
  const lowOrOutCount = products.filter((p) => p.status === 'LOW_STOCK' || p.status === 'OUT_OF_STOCK').length;

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
    <div className="flex flex-col h-full bg-white border border-[#FF5E3A]/15 rounded-[32px] p-5 md:p-6 space-y-4 shadow-[0_10px_30px_rgba(220,75,40,0.06)]">
      {/* 1. Header & Quick Inventory Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-[#FF5E3A]/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2E7D32] animate-pulse" />
            <h2 className="text-base font-black uppercase tracking-wider text-[#291A17]">
              Catalogue &amp; Stock Verification
            </h2>
          </div>
          <p className="text-xs text-[#806761] mt-0.5">
            Real-time physical inventory audit. Prevents quoting unconfirmed stock to customers.
          </p>
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 text-[#806761] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="SEARCH SKU, CATEGORY, FABRIC..."
            className="w-full bg-[#FFF0EB] border border-[#FF5E3A]/20 rounded-full pl-9 pr-4 py-2 text-xs text-[#291A17] placeholder-[#806761] focus:outline-none focus:border-[#FF5E3A] transition-colors"
          />
        </div>
      </div>

      {/* 2. Top Metric Cards Row with Krishi-Rakshak Expressive Tokens */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total SKUs */}
        <div className="p-3.5 rounded-2xl bg-[#FFF3EE] border border-[#FF5E3A]/15">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#806761]">
            TOTAL SKUS
          </span>
          <div className="text-2xl font-black text-[#291A17] mt-0.5 tabular-nums">
            {products.length} <span className="text-xs font-normal text-[#806761]">Items</span>
          </div>
        </div>

        {/* In Stock */}
        <div className="p-3.5 rounded-2xl bg-[#E8F5E9] border border-[#2E7D32]/25">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#2E7D32]">
            VERIFIED IN STOCK
          </span>
          <div className="text-2xl font-black text-[#2E7D32] mt-0.5 tabular-nums">
            {inStockCount} <span className="text-xs font-normal opacity-85">Ready</span>
          </div>
        </div>

        {/* Low / Out of Stock */}
        <div className="p-3.5 rounded-2xl bg-[#FEF3C7] border border-[#F59E0B]/30">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#D97706]">
            LOW / OUT OF STOCK
          </span>
          <div className="text-2xl font-black text-[#D97706] mt-0.5 tabular-nums">
            {lowOrOutCount} <span className="text-xs font-normal opacity-85">Alert</span>
          </div>
        </div>

        {/* Physical Check Required */}
        <div className="p-3.5 rounded-2xl bg-[#FFEAE3] border border-[#FF5E3A]/30">
          <span className="text-[10px] font-black uppercase tracking-wider text-[#E24823]">
            UNKNOWN COUNT
          </span>
          <div className="text-2xl font-black text-[#E24823] mt-0.5 tabular-nums">
            {staleOrUnknownProducts.length} <span className="text-xs font-normal opacity-90">Verify</span>
          </div>
        </div>
      </div>

      {/* 3. Filter Pills */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        {[
          { id: 'ALL', label: `All Items (${products.length})` },
          { id: 'IN_STOCK', label: 'In Stock' },
          { id: 'LOW_STOCK', label: 'Low Stock' },
          { id: 'OUT_OF_STOCK', label: 'Out of Stock' },
          { id: 'UNKNOWN', label: 'Unknown State (Missing Count)' },
          { id: 'STALE', label: 'Stale Check (>48h)' },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilterState(f.id)}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
              filterState === f.id
                ? 'bg-gradient-to-r from-[#FF5E3A] to-[#FF8367] text-white shadow-sm'
                : 'bg-[#FFF0EB] text-[#806761] hover:text-[#291A17] hover:bg-[#FFEAE3]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* 4. Product Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
        {filteredProducts.map((product) => {
          const waitingLeads = getLeadsWaitingCount(product.id);
          const isUnknown = product.status === 'UNKNOWN';
          const isStale = product.isStale;

          return (
            <div
              key={product.id}
              className={`rounded-[28px] p-5 border transition-all flex flex-col justify-between relative overflow-hidden ${
                isUnknown
                  ? 'bg-[#FEF3C7]/40 border-[#F59E0B]/40 ring-1 ring-[#F59E0B]/20'
                  : 'bg-[#FDF9F7] border-[#FF5E3A]/15 hover:border-[#FF5E3A]/30'
              }`}
            >
              {/* Top Accent Strip */}
              <div
                className="absolute top-0 left-0 right-0 h-1"
                style={{ backgroundColor: product.accentColor }}
              />

              <div>
                {/* SKU & Category Badges */}
                <div className="flex items-center justify-between text-xs text-[#806761] mb-1 pt-1">
                  <span className="font-mono font-bold text-[11px] tracking-wider text-[#806761]">
                    {product.sku}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#FFEAE3] text-[10px] font-bold text-[#FF5E3A]">
                    {product.category}
                  </span>
                </div>

                {/* Name */}
                <h3 className="text-sm font-black text-[#291A17] mt-1 leading-snug line-clamp-2">
                  {product.name}
                </h3>

                {/* Big Price with .00 */}
                <div className="text-2xl font-black text-[#291A17] mt-2 tabular-nums">
                  ₹{product.price.toLocaleString('en-IN')}<span className="text-sm font-bold text-[#806761]">.00</span>
                </div>

                {/* Demand Wave / Sparkline */}
                <div className="my-2 py-0.5">
                  <svg className="w-full h-5 overflow-visible" viewBox="0 0 100 16" fill="none">
                    <path
                      d="M0 10 L 20 10 L 35 4 L 50 12 L 65 6 L 80 14 L 100 8"
                      stroke={isUnknown ? '#F59E0B' : '#FF5E3A'}
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                {/* Notes */}
                {product.notes && (
                  <p className="text-[11px] text-[#806761] leading-relaxed bg-[#FFF0EB] p-2.5 rounded-xl border border-[#FF5E3A]/10">
                    {product.notes}
                  </p>
                )}

                {/* Shelf Location */}
                <div className="flex items-center gap-1.5 text-[11px] text-[#806761] mt-2.5">
                  <MapPin className="w-3.5 h-3.5 text-[#FF5E3A]" />
                  <span>{product.rackLocation}</span>
                </div>
              </div>

              {/* Bottom: Stock Status, Last-Updated Time, Action */}
              <div className="pt-3.5 mt-3 border-t border-[#FF5E3A]/10 space-y-2">
                <div className="flex items-center justify-between">
                  {/* Status Pill */}
                  <div>
                    {product.status === 'IN_STOCK' && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E8F5E9] text-[#2E7D32] border border-[#2E7D32]/30">
                        ✓ {product.stockQuantity} in stock
                      </span>
                    )}
                    {product.status === 'LOW_STOCK' && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FEF3C7] text-[#D97706] border border-[#F59E0B]/30">
                        ⚡ {product.stockQuantity} left (Low)
                      </span>
                    )}
                    {product.status === 'OUT_OF_STOCK' && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FEE2E2] text-[#DC2626] border border-[#DC2626]/30">
                        ✕ Out of Stock (0)
                      </span>
                    )}
                    {product.status === 'UNKNOWN' && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FEF3C7] text-[#D97706] border border-[#F59E0B]/40 flex items-center gap-1 animate-pulse">
                        <AlertTriangle className="w-3 h-3" />
                        UNKNOWN STATE
                      </span>
                    )}
                  </div>

                  {waitingLeads > 0 && (
                    <span className="text-[10px] font-bold text-[#FF5E3A]">
                      {waitingLeads} {waitingLeads === 1 ? 'lead' : 'leads'} waiting
                    </span>
                  )}
                </div>

                {/* Last-Updated Time */}
                <div className="flex items-center justify-between text-[10px] text-[#806761] font-mono">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#FF5E3A]" />
                    Last checked: <strong className="text-[#291A17]">{product.lastCheckedAt}</strong>
                  </span>
                  {isStale && (
                    <span className="text-[#D97706] font-bold uppercase text-[9px]">
                      STALE
                    </span>
                  )}
                </div>

                {/* Verification Trigger Button */}
                <button
                  onClick={() => {
                    setSelectedProductForUpdate(product);
                    setIsStockUpdateModalOpen(true);
                  }}
                  className={`w-full py-2 px-3 rounded-full text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    isUnknown || isStale
                      ? 'bg-gradient-to-r from-[#FF5E3A] to-[#FF8367] hover:from-[#E24823] hover:to-[#FF5E3A] text-white shadow-[0_4px_14px_rgba(255,94,58,0.25)]'
                      : 'bg-[#FFF0EB] hover:bg-[#FFEAE3] text-[#291A17]'
                  }`}
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>
                    {isUnknown ? 'Physically Verify Unknown Count' : 'Update / Verify Count'}
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
