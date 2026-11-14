'use client';

import React from 'react';
import { StoreProvider, useStore } from '@/context/StoreContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopHeader } from '@/components/layout/TopHeader';
import { RightPanel } from '@/components/layout/RightPanel';
import { MetricsGrid } from '@/components/metrics/MetricsGrid';
import { SalesWorkflowBar } from '@/components/workflow/SalesWorkflowBar';
import { PipelineOverview } from '@/components/overview/PipelineOverview';
import { LeadInbox } from '@/components/leads/LeadInbox';
import { LeadDetail } from '@/components/leads/LeadDetail';
import { StockCatalogue } from '@/components/catalogue/StockCatalogue';
import { ApprovalPanel } from '@/components/approvals/ApprovalPanel';
import { PaymentStatusView } from '@/components/payments/PaymentStatusView';
import { RecordOfflineSaleModal } from '@/components/offline/RecordOfflineSaleModal';
import { StockUpdateModal } from '@/components/catalogue/StockUpdateModal';
import { DemoGuideModal } from '@/components/common/DemoGuideModal';

function DashboardContent() {
  const { activeView } = useStore();

  return (
    <div className="flex min-h-screen bg-[#121214] text-white selection:bg-purple-500 selection:text-black">
      {/* 1. Left Minimalist Geometric Sidebar */}
      <Sidebar />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-8">
        {/* Top Header */}
        <TopHeader />

        <main className="flex-1 flex flex-col gap-5 mt-4">
          {/* Top Row: Prominent Bento Summary Cards (Purple, Yellow, Coral, Mint) */}
          <MetricsGrid />

          {/* Interactive 7-Stage Sales Workflow Stepper */}
          <div className="px-4 md:px-6">
            <SalesWorkflowBar />
          </div>

          {/* Main Stage & Asymmetrical Right-Side Panel */}
          <div className="flex flex-col xl:flex-row gap-5 px-4 md:px-6 flex-1 items-start">
            {/* Center Stage Card Container */}
            <div className="flex-1 w-full min-w-0">
              {activeView === 'pipeline' && <PipelineOverview />}

              {activeView === 'inbox' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-full items-start">
                  <div className="lg:col-span-5 h-[760px]">
                    <LeadInbox />
                  </div>
                  <div className="lg:col-span-7 h-[760px]">
                    <LeadDetail />
                  </div>
                </div>
              )}

              {activeView === 'catalogue' && <StockCatalogue />}

              {activeView === 'approvals' && <ApprovalPanel />}

              {activeView === 'payments' && <PaymentStatusView />}
            </div>

            {/* Right-Side Panel (Distinct Solid Contrasting Anchor) */}
            <RightPanel />
          </div>
        </main>
      </div>

      {/* Interactive Modals */}
      <RecordOfflineSaleModal />
      <StockUpdateModal />
      <DemoGuideModal />
    </div>
  );
}

export default function Home() {
  return (
    <StoreProvider>
      <DashboardContent />
    </StoreProvider>
  );
}
