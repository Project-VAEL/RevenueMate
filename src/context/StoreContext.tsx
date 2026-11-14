'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  Lead,
  Product,
  ApprovalRequest,
  PaymentRecord,
  StoreMetrics,
  PaymentMethod,
  StockStatus,
  TimelineEvent,
  WorkflowStage,
} from '@/types';
import {
  INITIAL_LEADS,
  INITIAL_PRODUCTS,
  INITIAL_APPROVALS,
  INITIAL_PAYMENTS,
} from '@/data/seedData';

type ViewMode = 'pipeline' | 'inbox' | 'catalogue' | 'approvals' | 'payments';

interface StoreContextType {
  leads: Lead[];
  products: Product[];
  approvals: ApprovalRequest[];
  payments: PaymentRecord[];
  metrics: StoreMetrics;

  // Navigation & Views
  activeView: ViewMode;
  setActiveView: (view: ViewMode) => void;
  selectedLeadId: string | null;
  setSelectedLeadId: (id: string | null) => void;
  selectedLead: Lead | null;

  // Inbox Filters & Search
  filterStatus: string;
  setFilterStatus: (status: string) => void;
  filterPriority: string;
  setFilterPriority: (priority: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;

  // Modals
  isOfflineSaleModalOpen: boolean;
  setIsOfflineSaleModalOpen: (open: boolean) => void;
  isStockUpdateModalOpen: boolean;
  setIsStockUpdateModalOpen: (open: boolean) => void;
  selectedProductForUpdate: Product | null;
  setSelectedProductForUpdate: (p: Product | null) => void;
  isDemoGuideOpen: boolean;
  setIsDemoGuideOpen: (open: boolean) => void;

  // System flags
  mockMode: boolean;
  setMockMode: (val: boolean) => void;
  systemNotification: string | null;
  setSystemNotification: (msg: string | null) => void;

  // Core Workflow Actions
  approveRequest: (approvalId: string, customNote?: string) => void;
  rejectRequest: (approvalId: string, reason: string) => void;
  recordOfflineSale: (payload: {
    leadId?: string;
    customerName: string;
    customerPhone?: string;
    productId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    notes?: string;
  }) => void;
  updateProductStock: (
    productId: string,
    newQuantity: number | null,
    newStatus: StockStatus,
    notes?: string
  ) => void;
  simulateIncomingEnquiry: () => void;
  simulatePaymentWebhook: (paymentId: string, outcome: 'VERIFIED_PAID' | 'FAILED') => void;
  generatePaymentLink: (leadId: string, amount: number) => void;
  sendCustomMerchantMessage: (leadId: string, text: string) => void;
  markLeadLost: (leadId: string, reason: string) => void;
  resetDemoData: () => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [leads, setLeads] = useState<Lead[]>(INITIAL_LEADS);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [approvals, setApprovals] = useState<ApprovalRequest[]>(INITIAL_APPROVALS);
  const [payments, setPayments] = useState<PaymentRecord[]>(INITIAL_PAYMENTS);

  const [activeView, setActiveView] = useState<ViewMode>('pipeline');
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>('lead-1');

  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterPriority, setFilterPriority] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [isOfflineSaleModalOpen, setIsOfflineSaleModalOpen] = useState(false);
  const [isStockUpdateModalOpen, setIsStockUpdateModalOpen] = useState(false);
  const [selectedProductForUpdate, setSelectedProductForUpdate] = useState<Product | null>(null);
  const [isDemoGuideOpen, setIsDemoGuideOpen] = useState(false);

  const [mockMode, setMockMode] = useState<boolean>(true);
  const [systemNotification, setSystemNotification] = useState<string | null>(null);

  // Auto-clear notification after 4 seconds
  useEffect(() => {
    if (systemNotification) {
      const timer = setTimeout(() => {
        setSystemNotification(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [systemNotification]);

  const selectedLead = useMemo(() => {
    return leads.find((l) => l.id === selectedLeadId) || null;
  }, [leads, selectedLeadId]);

  // Compute real merchant workflow metrics (honest & accurate, no fabricated performance metrics)
  const metrics: StoreMetrics = useMemo(() => {
    const activeLeads = leads.filter((l) => l.status !== 'SALE_RECORDED' && l.status !== 'LOST');
    const pendingApps = approvals.filter((a) => a.status === 'PENDING');
    const nowTime = Date.now();
    const expiringApps = pendingApps.filter((a) => {
      const expiresMs = new Date(a.expiresAt).getTime();
      return expiresMs - nowTime > 0 && expiresMs - nowTime < 45 * 60 * 1000;
    });
    const pendingPays = payments.filter((p) => p.status === 'PENDING');
    const verifiedPays = payments.filter((p) => p.status === 'VERIFIED_PAID');
    const offlinePays = verifiedPays.filter((p) => p.isOffline);
    const staleProds = products.filter((p) => p.status === 'UNKNOWN' || p.isStale);

    const totalSalesAmount = verifiedPays.reduce((sum, p) => sum + p.amount, 0);

    return {
      activeLeadsCount: activeLeads.length,
      approvalsDueCount: pendingApps.length,
      expiringApprovalsCount: expiringApps.length,
      pendingPaymentsCount: pendingPays.length,
      todaySalesAmount: totalSalesAmount,
      todaySalesCount: verifiedPays.length,
      offlineSalesCount: offlinePays.length,
      staleStockCount: staleProds.length,
    };
  }, [leads, approvals, payments, products]);

  // ACTION: Approve an automated follow-up request
  const approveRequest = (approvalId: string, customNote?: string) => {
    const req = approvals.find((a) => a.id === approvalId);
    if (!req) return;

    setApprovals((prev) =>
      prev.map((a) => (a.id === approvalId ? { ...a, status: 'APPROVED' } : a))
    );

    // Update lead timeline & status
    setLeads((prev) =>
      prev.map((l) => {
        if (l.id === req.leadId) {
          const newEvent: TimelineEvent = {
            id: `t-${Date.now()}`,
            timestamp: 'Just now',
            type: 'outgoing_msg',
            sender: 'merchant',
            text: `[Approved by ${req.approverName}]: ${req.draftMessage} ${customNote ? `\n(Note: ${customNote})` : ''}`,
            metadata: {
              channel: req.channel,
              status: 'Dispatched via WhatsApp API Sandbox',
              approverName: req.approverName,
            },
          };
          return {
            ...l,
            status: 'CONTACTED',
            currentStage: 'payment_pending',
            timeline: [...l.timeline, newEvent],
          };
        }
        return l;
      })
    );

    setSystemNotification(
      `✓ Follow-up approved & dispatched to ${req.customerName}. Next stage: Payment Request.`
    );
  };

  // ACTION: Reject an automated follow-up request
  const rejectRequest = (approvalId: string, reason: string) => {
    const req = approvals.find((a) => a.id === approvalId);
    if (!req) return;

    setApprovals((prev) =>
      prev.map((a) =>
        a.id === approvalId ? { ...a, status: 'REJECTED', suppressionReason: reason } : a
      )
    );

    setLeads((prev) =>
      prev.map((l) => {
        if (l.id === req.leadId) {
          const newEvent: TimelineEvent = {
            id: `t-${Date.now()}`,
            timestamp: 'Just now',
            type: 'approval_action',
            sender: 'merchant',
            text: `Follow-up rejected by merchant: "${reason}". Automated dispatch suppressed.`,
            metadata: { approverName: req.approverName, status: 'REJECTED' },
          };
          return {
            ...l,
            timeline: [...l.timeline, newEvent],
          };
        }
        return l;
      })
    );

    setSystemNotification(`✕ Follow-up for ${req.customerName} rejected. Message suppressed.`);
  };

  // ACTION: Record Offline Sale (Cash, Direct-UPI QR, POS Card)
  // CRITICAL REQUIREMENT: Manually recording a purchase MUST immediately suppress automated follow-ups!
  const recordOfflineSale = (payload: {
    leadId?: string;
    customerName: string;
    customerPhone?: string;
    productId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    notes?: string;
  }) => {
    const product = products.find((p) => p.id === payload.productId);
    const prodName = product ? product.name : 'Custom Item';

    // 1. Create Payment Record
    const newPaymentId = `pay-${Date.now()}`;
    const newPayment: PaymentRecord = {
      id: newPaymentId,
      leadId: payload.leadId || `lead-walkin-${Date.now()}`,
      customerName: payload.customerName,
      productName: prodName,
      amount: payload.amount,
      method: payload.paymentMethod,
      status: 'VERIFIED_PAID',
      referenceNumber: `REC-${Math.floor(100000 + Math.random() * 900000)}`,
      createdAt: 'Today, Just now',
      verifiedAt: 'Instant (In-Store)',
      isOffline: true,
      notes: payload.notes || `Offline in-store sale recorded via ${payload.paymentMethod}.`,
    };

    setPayments((prev) => [newPayment, ...prev]);

    // 2. Decrement physical inventory if count is known
    if (product && product.stockQuantity !== null && product.stockQuantity > 0) {
      setProducts((prev) =>
        prev.map((p) => {
          if (p.id === payload.productId) {
            const updatedQty = (p.stockQuantity ?? 1) - 1;
            const updatedStatus: StockStatus =
              updatedQty === 0 ? 'OUT_OF_STOCK' : updatedQty === 1 ? 'LOW_STOCK' : 'IN_STOCK';
            return {
              ...p,
              stockQuantity: updatedQty,
              status: updatedStatus,
              lastCheckedAt: 'Just now (Sale recorded)',
            };
          }
          return p;
        })
      );
    }

    // 3. Handle Lead & Follow-up Suppression
    if (payload.leadId) {
      // Find and suppress any pending approvals for this lead
      setApprovals((prev) =>
        prev.map((a) => {
          if (a.leadId === payload.leadId && a.status === 'PENDING') {
            return {
              ...a,
              status: 'SUPPRESSED_BY_OFFLINE_SALE',
              suppressionReason: `Offline purchase of ₹${payload.amount.toLocaleString('en-IN')} recorded on ${new Date().toLocaleDateString()}. Automated message permanently suppressed.`,
            };
          }
          return a;
        })
      );

      // Update the Lead record
      setLeads((prev) =>
        prev.map((l) => {
          if (l.id === payload.leadId) {
            const saleEvent: TimelineEvent = {
              id: `t-${Date.now()}`,
              timestamp: 'Just now',
              type: 'offline_sale',
              sender: 'merchant',
              text: `OFFLINE PURCHASE RECORDED: Paid ₹${payload.amount.toLocaleString('en-IN')} via ${payload.paymentMethod.replace('_', ' ')}. Receipt: ${newPayment.referenceNumber}.`,
              metadata: {
                amount: payload.amount,
                paymentMethod: payload.paymentMethod,
                productName: prodName,
                status: 'VERIFIED_PAID',
              },
            };

            const suppressEvent: TimelineEvent = {
              id: `t-${Date.now() + 1}`,
              timestamp: 'Just now',
              type: 'system_event',
              sender: 'system',
              text: 'FOLLOW-UP SUPPRESSION TRIGGERED: All queued and automated follow-ups permanently suppressed because in-store purchase is confirmed.',
            };

            return {
              ...l,
              currentStage: 'sale_recorded',
              status: 'SALE_RECORDED',
              paymentId: newPaymentId,
              isFollowupSuppressed: true,
              suppressionNote: `Offline purchase completed via ${payload.paymentMethod.replace('_', ' ')}. Follow-ups suppressed.`,
              timeline: [...l.timeline, saleEvent, suppressEvent],
            };
          }
          return l;
        })
      );
    } else {
      // Create new Lead record for walk-in customer
      const newLeadId = newPayment.leadId;
      const newLead: Lead = {
        id: newLeadId,
        name: payload.customerName,
        phone: payload.customerPhone || 'Counter Walk-in',
        channel: 'WALK_IN',
        currentStage: 'sale_recorded',
        status: 'SALE_RECORDED',
        priority: 'HIGH',
        priorityRationale: 'Walk-in customer converted directly in store.',
        createdAt: 'Just now',
        lastActiveAt: 'Just now',
        interestedProductId: payload.productId,
        interestedProductName: prodName,
        quotedAmount: payload.amount,
        paymentId: newPaymentId,
        isFollowupSuppressed: true,
        suppressionNote: 'In-store walk-in sale. Automated follow-ups not required.',
        timeline: [
          {
            id: `t-${Date.now()}`,
            timestamp: 'Just now',
            type: 'offline_sale',
            sender: 'merchant',
            text: `WALK-IN SALE: Paid ₹${payload.amount.toLocaleString('en-IN')} via ${payload.paymentMethod.replace('_', ' ')}.`,
            metadata: {
              amount: payload.amount,
              paymentMethod: payload.paymentMethod,
              status: 'VERIFIED_PAID',
            },
          },
        ],
      };

      setLeads((prev) => [newLead, ...prev]);
      setSelectedLeadId(newLeadId);
    }

    setSystemNotification(
      `✓ Offline sale of ₹${payload.amount.toLocaleString('en-IN')} recorded! Automated follow-ups SUPPRESSED.`
    );
    setIsOfflineSaleModalOpen(false);
  };

  // ACTION: Update physical product inventory (resolve Unknown / Stale state)
  const updateProductStock = (
    productId: string,
    newQuantity: number | null,
    newStatus: StockStatus,
    notes?: string
  ) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          return {
            ...p,
            stockQuantity: newQuantity,
            status: newStatus,
            lastCheckedAt: 'Verified Just now',
            isStale: false,
            notes: notes || p.notes,
          };
        }
        return p;
      })
    );

    // Notify any lead waiting for this product
    const matchingProduct = products.find((p) => p.id === productId);
    if (matchingProduct) {
      setLeads((prev) =>
        prev.map((l) => {
          if (l.interestedProductId === productId && l.currentStage === 'stock_check') {
            const event: TimelineEvent = {
              id: `t-${Date.now()}`,
              timestamp: 'Just now',
              type: 'stock_check',
              sender: 'merchant',
              text: `PHYSICAL STOCK VERIFIED by Store Manager: Status is now ${newStatus} (${newQuantity !== null ? `${newQuantity} units in stock` : 'Count unconfirmed'}).`,
              metadata: { stockState: newStatus },
            };
            return {
              ...l,
              status: newStatus === 'OUT_OF_STOCK' ? 'CONTACTED' : 'STOCK_CHECKED',
              timeline: [...l.timeline, event],
            };
          }
          return l;
        })
      );
    }

    setSystemNotification(`✓ Inventory updated for ${matchingProduct?.name || 'product'}.`);
    setIsStockUpdateModalOpen(false);
    setSelectedProductForUpdate(null);
  };

  // ACTION: Simulate an incoming real-world WhatsApp enquiry
  const simulateIncomingEnquiry = () => {
    const demoId = `lead-${Date.now().toString().slice(-4)}`;
    const randomProduct = products[4]; // Banarasi Katan Silk Saree

    const newLead: Lead = {
      id: demoId,
      name: 'Shweta Verma',
      phone: '+91 98450 71290',
      channel: 'WHATSAPP',
      currentStage: 'enquiry',
      status: 'NEW_ENQUIRY',
      priority: 'HIGH',
      priorityRationale:
        'Recent enquiry (Just now) + high-value SKU intent (Banarasi Katan Silk ₹24,900) + asking for immediate courier delivery for anniversary.',
      createdAt: 'Just now',
      lastActiveAt: 'Just now',
      interestedProductId: randomProduct.id,
      interestedProductName: randomProduct.name,
      quotedAmount: randomProduct.price,
      isFollowupSuppressed: false,
      timeline: [
        {
          id: `t-${Date.now()}-1`,
          timestamp: 'Just now',
          type: 'incoming_msg',
          sender: 'customer',
          text: 'Hello! I saw your store video for the Royal Navy Banarasi Katan Silk Saree. Can this be delivered to Whitefield by tomorrow evening for our anniversary dinner?',
          metadata: { channel: 'WHATSAPP' },
        },
        {
          id: `t-${Date.now()}-2`,
          timestamp: 'Just now',
          type: 'system_event',
          sender: 'system',
          text: 'Enquiry processed: High priority assigned due to immediate delivery requirement and exact SKU match.',
        },
      ],
    };

    setLeads((prev) => [newLead, ...prev]);
    setSelectedLeadId(demoId);
    setActiveView('inbox');
    setSystemNotification(
      `🔔 New incoming WhatsApp enquiry from Shweta Verma! Priority: HIGH.`
    );
  };

  // ACTION: Simulate Bank Webhook for UPI/Card transactions
  const simulatePaymentWebhook = (paymentId: string, outcome: 'VERIFIED_PAID' | 'FAILED') => {
    const pay = payments.find((p) => p.id === paymentId);
    if (!pay) return;

    setPayments((prev) =>
      prev.map((p) => {
        if (p.id === paymentId) {
          return {
            ...p,
            status: outcome,
            utr: outcome === 'VERIFIED_PAID' ? `UTR-${Math.floor(100000000000 + Math.random() * 900000000000)}` : undefined,
            verifiedAt: outcome === 'VERIFIED_PAID' ? 'Verified Just now via Webhook' : undefined,
            failureReason: outcome === 'FAILED' ? 'Bank Gateway decline: customer canceled on UPI app.' : undefined,
          };
        }
        return p;
      })
    );

    // Update lead timeline
    setLeads((prev) =>
      prev.map((l) => {
        if (l.paymentId === paymentId) {
          const event: TimelineEvent = {
            id: `t-${Date.now()}`,
            timestamp: 'Just now',
            type: 'payment_event',
            sender: 'system',
            text:
              outcome === 'VERIFIED_PAID'
                ? `BANK WEBHOOK CONFIRMED: Payment of ₹${pay.amount.toLocaleString('en-IN')} VERIFIED. Transaction complete.`
                : `BANK WEBHOOK REJECTED: Payment failed at bank gateway. Merchant follow-up recommended.`,
            metadata: {
              status: outcome,
              amount: pay.amount,
            },
          };
          return {
            ...l,
            currentStage: outcome === 'VERIFIED_PAID' ? 'sale_recorded' : 'payment_pending',
            status: outcome === 'VERIFIED_PAID' ? 'SALE_RECORDED' : 'PAYMENT_PENDING',
            isFollowupSuppressed: outcome === 'VERIFIED_PAID',
            suppressionNote:
              outcome === 'VERIFIED_PAID'
                ? 'Payment verified via bank gateway webhook. Follow-ups suppressed.'
                : undefined,
            timeline: [...l.timeline, event],
          };
        }
        return l;
      })
    );

    setSystemNotification(
      outcome === 'VERIFIED_PAID'
        ? `✓ Webhook Received: ₹${pay.amount.toLocaleString('en-IN')} VERIFIED PAID!`
        : `⚠ Webhook Received: Payment failed at bank gateway.`
    );
  };

  // ACTION: Generate Payment Link
  const generatePaymentLink = (leadId: string, amount: number) => {
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) return;

    const ref = `LINK-${Math.floor(100000 + Math.random() * 900000)}`;
    const newPayId = `pay-${Date.now()}`;

    const newPayment: PaymentRecord = {
      id: newPayId,
      leadId: lead.id,
      customerName: lead.name,
      productName: lead.interestedProductName || 'Ethnic Wear Item',
      amount: amount,
      method: 'UPI_GATEWAY',
      status: 'PENDING',
      referenceNumber: ref,
      createdAt: 'Today, Just now',
      isOffline: false,
      notes: 'Generated via merchant dashboard; payment link dispatched to customer WhatsApp.',
    };

    setPayments((prev) => [newPayment, ...prev]);

    setLeads((prev) =>
      prev.map((l) => {
        if (l.id === leadId) {
          const event: TimelineEvent = {
            id: `t-${Date.now()}`,
            timestamp: 'Just now',
            type: 'payment_event',
            sender: 'merchant',
            text: `Generated secure UPI Payment Link for ₹${amount.toLocaleString('en-IN')} (Ref: ${ref}). Link dispatched to customer.`,
            metadata: {
              amount: amount,
              status: 'PENDING',
              referenceNumber: ref,
            },
          };
          return {
            ...l,
            currentStage: 'payment_pending',
            status: 'PAYMENT_PENDING',
            paymentId: newPayId,
            timeline: [...l.timeline, event],
          };
        }
        return l;
      })
    );

    setSystemNotification(`✓ Payment link generated & sent to ${lead.name} for ₹${amount.toLocaleString('en-IN')}.`);
  };

  // ACTION: Send custom merchant message
  const sendCustomMerchantMessage = (leadId: string, text: string) => {
    setLeads((prev) =>
      prev.map((l) => {
        if (l.id === leadId) {
          const event: TimelineEvent = {
            id: `t-${Date.now()}`,
            timestamp: 'Just now',
            type: 'outgoing_msg',
            sender: 'merchant',
            text: text,
            metadata: { channel: l.channel },
          };
          return {
            ...l,
            lastActiveAt: 'Just now',
            timeline: [...l.timeline, event],
          };
        }
        return l;
      })
    );
  };

  // ACTION: Mark lead lost
  const markLeadLost = (leadId: string, reason: string) => {
    setLeads((prev) =>
      prev.map((l) => {
        if (l.id === leadId) {
          const event: TimelineEvent = {
            id: `t-${Date.now()}`,
            timestamp: 'Just now',
            type: 'system_event',
            sender: 'merchant',
            text: `Lead marked as LOST. Reason: "${reason}". Follow-up automations halted.`,
          };
          return {
            ...l,
            status: 'LOST',
            isFollowupSuppressed: true,
            suppressionNote: `Lead marked as Lost (${reason}).`,
            timeline: [...l.timeline, event],
          };
        }
        return l;
      })
    );

    setSystemNotification(`Lead marked as Lost. Follow-ups halted.`);
  };

  // ACTION: Reset seed data
  const resetDemoData = () => {
    setLeads(INITIAL_LEADS);
    setProducts(INITIAL_PRODUCTS);
    setApprovals(INITIAL_APPROVALS);
    setPayments(INITIAL_PAYMENTS);
    setSelectedLeadId('lead-1');
    setActiveView('pipeline');
    setSystemNotification('↺ Demo dataset successfully reset to initial boutique state.');
  };

  return (
    <StoreContext.Provider
      value={{
        leads,
        products,
        approvals,
        payments,
        metrics,

        activeView,
        setActiveView,
        selectedLeadId,
        setSelectedLeadId,
        selectedLead,

        filterStatus,
        setFilterStatus,
        filterPriority,
        setFilterPriority,
        searchQuery,
        setSearchQuery,

        isOfflineSaleModalOpen,
        setIsOfflineSaleModalOpen,
        isStockUpdateModalOpen,
        setIsStockUpdateModalOpen,
        selectedProductForUpdate,
        setSelectedProductForUpdate,
        isDemoGuideOpen,
        setIsDemoGuideOpen,

        mockMode,
        setMockMode,
        systemNotification,
        setSystemNotification,

        approveRequest,
        rejectRequest,
        recordOfflineSale,
        updateProductStock,
        simulateIncomingEnquiry,
        simulatePaymentWebhook,
        generatePaymentLink,
        sendCustomMerchantMessage,
        markLeadLost,
        resetDemoData,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}
