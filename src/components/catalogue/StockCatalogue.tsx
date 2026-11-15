'use client';

import React, { useState } from 'react';
import { useStore } from '@/context/StoreContext';
import { WorkflowStepBanner } from '@/components/common/WorkflowStepBanner';
import {
  AlertTriangle,
  Clock,
  Search,
  MapPin,
  CheckCircle2,
  Boxes,
  Cpu,
  Layers,
  Sparkles,
} from 'lucide-react';

export function StockCatalogue() {
  const {
    products,
    leads,
    setSelectedProductForUpdate,
    setIsStockUpdateModalOpen,
    setActiveView,
  } = useStore();

  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const staleOrUnknownProducts = products.filter((p) => p.status === 'UNKNOWN' || p.isStale);
  const inStockCount = products.filter((p) => p.status === 'IN_STOCK').length;
  const lowOrOutCount = products.filter((p) => p.status === 'LOW_STOCK' || p.status === 'OUT_OF_STOCK').length;

  const categories = [
    { id: 'ALL', label: `All Laptops (${products.length})` },
    { id: 'UNKNOWN', label: `⚠️ Unknown Count (${staleOrUnknownProducts.length})`, highlight: true },
    { id: 'Everyday & Student Laptops', label: 'Everyday & Student' },
    { id: 'Productivity Ultrabooks', label: 'Productivity Ultrabooks' },
    { id: 'Gaming & High Performance', label: 'Gaming & Performance' },
    { id: 'Enterprise & Business', label: 'Enterprise & Business' },
  ];

  const filteredProducts = products.filter((product) => {
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchName = product.name.toLowerCase().includes(q);
      const matchSku = product.sku.toLowerCase().includes(q);
      const matchCategory = product.category.toLowerCase().includes(q);
      const matchProcessor = (product.processor || '').toLowerCase().includes(q);
      if (!matchName && !matchSku && !matchCategory && !matchProcessor) return false;
    }

    if (activeCategory === 'UNKNOWN') {
      return product.status === 'UNKNOWN' || product.isStale;
    }

    if (activeCategory !== 'ALL' && product.category !== activeCategory) {
      return false;
    }

    return true;
  });

  const getLeadsWaitingCount = (productId: string) => {
    return leads.filter(
      (l) => l.interestedProductId === productId && l.status !== 'SALE_RECORDED' && l.status !== 'LOST'
    ).length;
  };

  return (
    <div className="flex flex-col space-y-4">
      {/* 1. First-Time User Guided Workflow Banner */}
      <WorkflowStepBanner
        stepNumber={3}
        stageName="STOCK VERIFICATION & PHYSICAL AUDIT"
        title="Check Laptop Availability & Confirm Physical Counts"
        description="Vale Enterprises automated AI assistant checks this stock database before sending quotations. Items marked UNKNOWN pause quotation dispatch until you count the shelf and click 'Verify Stock'."
        primaryActionLabel="View Approvals Queue"
        onPrimaryAction={() => setActiveView('approvals')}
      />

      {/* 2. Main Catalogue Container */}
      <div className="bg-white border border-[#FF5E3A]/15 rounded-[32px] p-5 md:p-6 space-y-4 shadow-[0_10px_30px_rgba(220,75,40,0.06)]">
        {/* Top Header & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#FF5E3A]/10">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2E7D32] animate-pulse" />
              <h2 className="text-base font-black uppercase tracking-wider text-[#291A17]">
                Vale Enterprises · Showroom Stock
              </h2>
            </div>
            <p className="text-xs text-[#806761] mt-0.5">
              11 commercial &amp; gaming laptop configurations loaded from shop database.
            </p>
          </div>

          {/* Quick Search */}
          <div className="relative min-w-[260px]">
            <Search className="w-3.5 h-3.5 text-[#806761] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="SEARCH CPU, MODEL, OR SKU..."
              className="w-full bg-[#FFF0EB] border border-[#FF5E3A]/20 rounded-full pl-9 pr-4 py-2 text-xs text-[#291A17] placeholder-[#806761] font-semibold focus:outline-none focus:border-[#FF5E3A] transition-colors"
            />
          </div>
        </div>

        {/* 3. Compact Single-Line Status Strip (Replaces bulky duplicate metric boxes) */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-[#FFF3EE] border border-[#FF5E3A]/15">
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <span className="font-bold text-[#291A17]">
              Inventory Status:
            </span>
            <span className="inline-flex items-center gap-1.5 font-bold text-[#2E7D32]">
              <span className="w-2 h-2 rounded-full bg-[#2E7D32]" />
              {inStockCount} Verified In Stock
            </span>
            <span className="inline-flex items-center gap-1.5 font-bold text-[#D97706]">
              <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
              {lowOrOutCount} Low / Alert
            </span>
            <span className="inline-flex items-center gap-1.5 font-black text-[#E24823]">
              <span className="w-2 h-2 rounded-full bg-[#E24823] animate-ping" />
              {staleOrUnknownProducts.length} Unknown (Action Required)
            </span>
          </div>

          <div className="text-[11px] text-[#806761] font-medium">
            💡 Tap any card to update count
          </div>
        </div>

        {/* 4. Category Segmented Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCategory(c.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeCategory === c.id
                  ? 'bg-gradient-to-r from-[#FF5E3A] to-[#FF8367] text-white shadow-sm'
                  : c.highlight
                  ? 'bg-[#FEF3C7] text-[#D97706] hover:bg-[#FDE68A] border border-[#F59E0B]/30'
                  : 'bg-[#FFF0EB] text-[#806761] hover:text-[#291A17] hover:bg-[#FFEAE3]'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* 5. Clean, Uncluttered Product Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pt-1">
          {filteredProducts.map((product) => {
            const waitingLeads = getLeadsWaitingCount(product.id);
            const isUnknown = product.status === 'UNKNOWN';
            const isLow = product.status === 'LOW_STOCK';
            const isOut = product.status === 'OUT_OF_STOCK';

            return (
              <div
                key={product.id}
                className={`rounded-[26px] p-4.5 border transition-all flex flex-col justify-between relative overflow-hidden ${
                  isUnknown
                    ? 'bg-[#FEF3C7]/45 border-[#F59E0B]/45 ring-2 ring-[#F59E0B]/20 shadow-sm'
                    : 'bg-[#FDF9F7] border-[#FF5E3A]/15 hover:border-[#FF5E3A]/35 hover:shadow-md'
                }`}
              >
                {/* Top Accent Line */}
                <div
                  className="absolute top-0 left-0 right-0 h-1.5"
                  style={{ backgroundColor: product.accentColor || '#FF5E3A' }}
                />

                <div className="space-y-2.5 pt-1">
                  {/* Category & Status Badges */}
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="px-2 py-0.5 rounded-full bg-[#FFF0EB] text-[10px] font-bold text-[#806761] truncate max-w-[130px]">
                      {product.category}
                    </span>

                    {/* Stock Status Pill */}
                    {product.status === 'IN_STOCK' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E8F5E9] text-[#2E7D32] border border-[#2E7D32]/25 shrink-0">
                        ✓ {product.stockQuantity} in stock
                      </span>
                    )}
                    {isLow && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FEF3C7] text-[#D97706] border border-[#F59E0B]/30 shrink-0">
                        ⚡ {product.stockQuantity} left (Low)
                      </span>
                    )}
                    {isOut && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FEE2E2] text-[#DC2626] border border-[#DC2626]/30 shrink-0">
                        ✕ Out of stock
                      </span>
                    )}
                    {isUnknown && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#E24823] text-white flex items-center gap-1 shrink-0 shadow-sm animate-pulse">
                        <AlertTriangle className="w-3 h-3" />
                        UNKNOWN
                      </span>
                    )}
                  </div>

                  {/* Laptop Name & SKU */}
                  <div>
                    <span className="font-mono text-[10px] font-bold text-[#806761] uppercase tracking-wider block">
                      {product.sku}
                    </span>
                    <h3 className="text-sm font-black text-[#291A17] mt-0.5 leading-snug line-clamp-2">
                      {product.name}
                    </h3>
                  </div>

                  {/* Key Specifications (Structured & Clean) */}
                  <div className="bg-[#FFF0EB]/80 rounded-2xl p-2.5 border border-[#FF5E3A]/10 space-y-1 text-[11px] text-[#806761]">
                    {product.processor && (
                      <div className="flex items-center gap-1.5 truncate">
                        <Cpu className="w-3.5 h-3.5 text-[#FF5E3A] shrink-0" />
                        <span className="truncate font-semibold text-[#291A17]">{product.processor}</span>
                      </div>
                    )}
                    {product.memory && (
                      <div className="flex items-center gap-1.5 truncate">
                        <Layers className="w-3.5 h-3.5 text-[#806761] shrink-0" />
                        <span className="truncate">{product.memory} · {product.storage}</span>
                      </div>
                    )}
                  </div>

                  {/* Price & Shelf Location */}
                  <div className="flex items-baseline justify-between pt-1">
                    <div className="text-2xl font-black text-[#291A17] tabular-nums">
                      ₹{product.price.toLocaleString('en-IN')}
                      <span className="text-xs font-bold text-[#806761]">.00</span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] text-[#806761] font-semibold">
                      <MapPin className="w-3 h-3 text-[#FF5E3A]" />
                      <span>{product.rackLocation}</span>
                    </div>
                  </div>

                  {/* Waiting Leads Indicator */}
                  {waitingLeads > 0 && (
                    <div className="text-[10px] font-bold text-[#E24823] bg-[#FFEAE3] px-2 py-1 rounded-xl flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      <span>{waitingLeads} customer {waitingLeads === 1 ? 'enquiry' : 'enquiries'} waiting for this laptop</span>
                    </div>
                  )}
                </div>

                {/* Bottom Action Button */}
                <div className="pt-3 mt-3 border-t border-[#FF5E3A]/10">
                  <button
                    onClick={() => {
                      setSelectedProductForUpdate(product);
                      setIsStockUpdateModalOpen(true);
                    }}
                    className={`w-full py-2 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      isUnknown
                        ? 'bg-gradient-to-r from-[#FF5E3A] to-[#FF8367] hover:from-[#E24823] hover:to-[#FF5E3A] text-white shadow-[0_4px_14px_rgba(255,94,58,0.3)]'
                        : 'bg-[#FFF0EB] hover:bg-[#FFEAE3] text-[#291A17] hover:text-[#FF5E3A] border border-[#FF5E3A]/20'
                    }`}
                  >
                    <span>{isUnknown ? '⚠️ Count Shelf & Verify' : 'Update Stock Count'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
