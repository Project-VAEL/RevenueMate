'use client';

import React from 'react';
import { StoreProvider, useStore } from '@/context/StoreContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopHeader } from '@/components/layout/TopHeader';
import { RightPanel } from '@/components/layout/RightPanel';
import { MetricsGrid } from '@/components/metrics/MetricsGrid';
import { PipelineOverview } from '@/components/overview/PipelineOverview';
import { LeadInbox } from '@/components/leads/LeadInbox';
import { LeadDetail } from '@/components/leads/LeadDetail';
import { StockCatalogue } from '@/components/catalogue/StockCatalogue';
import { ApprovalPanel } from '@/components/approvals/ApprovalPanel';
import { PaymentStatusView } from '@/components/payments/PaymentStatusView';
import { RecordOfflineSaleModal } from '@/components/offline/RecordOfflineSaleModal';
import { StockUpdateModal } from '@/components/catalogue/StockUpdateModal';
import { DemoGuideModal } from '@/components/common/DemoGuideModal';
import { WorkflowStepBanner } from '@/components/common/WorkflowStepBanner';

function DashboardContent() {
  const { activeView, setActiveView } = useStore();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_50%_20%,#FEE0D5_0%,#FAD7CB_50%,#F4CBC0_100%)] flex items-center justify-center p-0 md:p-4 lg:p-6 select-none font-sans text-[#291A17]">
      {/* Outer Rounded Tablet/Desktop Frame with Krishi-Rakshak warm theme */}
      <div className="w-full max-w-[1520px] bg-[#FFF3EE] border border-[#FF5E3A]/20 rounded-none md:rounded-[40px] shadow-[0_25px_60px_rgba(35,20,15,0.18)] overflow-hidden flex min-h-[920px]">
        {/* 1. Left Minimalist Geometric Sidebar */}
        <Sidebar />

        {/* 2. Main Content Canvas */}
        <div className="flex-1 flex flex-col min-w-0 p-3 md:p-6 overflow-y-auto">
          {/* Top Header */}
          <TopHeader />

          <main className="flex-1 flex flex-col gap-4 mt-2">
            {/* VIEW 1: Pipeline Overview - Master Bento Dashboard with Center Stage + Right Panel */}
            {activeView === 'pipeline' && (
              <>
                <MetricsGrid />
                <div className="flex flex-col xl:flex-row gap-4 flex-1 items-start mt-1">
                  <div className="flex-1 w-full min-w-0">
                    <PipelineOverview />
                  </div>
                  <RightPanel />
                </div>
              </>
            )}

            {/* VIEW 2: Lead Inbox & Detail - Full Width Split Screen with Step Banner */}
            {activeView === 'inbox' && (
              <div className="space-y-4">
                <WorkflowStepBanner
                  stepNumber={1}
                  stageName="CUSTOMER ENQUIRIES & LIVE TIMELINE"
                  title="Incoming Laptop Enquiries & Intent Evaluation"
                  description="Vale Enterprises Lead Inbox: Select an enquiry on the left to see customer WhatsApp chat, check stock on showroom shelves, or authorize special quotations."
                  primaryActionLabel="View Stock Catalogue"
                  onPrimaryAction={() => setActiveView('catalogue')}
                />
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                  <div className="lg:col-span-5 xl:col-span-4 min-h-[760px] h-[760px]">
                    <LeadInbox />
                  </div>
                  <div className="lg:col-span-7 xl:col-span-8 min-h-[760px] h-[760px]">
                    <LeadDetail />
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 3: Stock Catalogue - Full Width Product Grid */}
            {activeView === 'catalogue' && (
              <StockCatalogue />
            )}

            {/* VIEW 4: Approvals - Full Width Owner Sign-Off Queue */}
            {activeView === 'approvals' && (
              <ApprovalPanel />
            )}

            {/* VIEW 5: Payments - Full Width Settlement Ledger */}
            {activeView === 'payments' && (
              <PaymentStatusView />
            )}
          </main>
        </div>
      </div>

      {/* Modals */}
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
