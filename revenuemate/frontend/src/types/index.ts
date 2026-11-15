export type WorkflowStage =
  | 'enquiry'
  | 'lead'
  | 'priority'
  | 'stock_check'
  | 'followup_approval'
  | 'payment_pending'
  | 'sale_recorded';

export type LeadPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export type LeadStatus =
  | 'NEW_ENQUIRY'
  | 'CONTACTED'
  | 'STOCK_CHECKED'
  | 'APPROVAL_PENDING'
  | 'PAYMENT_PENDING'
  | 'SALE_RECORDED'
  | 'LOST';

export type MessageChannel = 'WHATSAPP' | 'INSTAGRAM' | 'WALK_IN' | 'WEBSITE';

export interface TimelineEvent {
  id: string;
  timestamp: string;
  type:
    | 'incoming_msg'
    | 'outgoing_msg'
    | 'system_event'
    | 'approval_action'
    | 'payment_event'
    | 'offline_sale'
    | 'stock_check';
  sender: 'customer' | 'merchant' | 'bot' | 'system';
  text: string;
  metadata?: {
    channel?: MessageChannel;
    status?: string;
    amount?: number;
    paymentMethod?: string;
    referenceNumber?: string;
    productName?: string;
    stockState?: StockStatus;
    approverName?: string;
  };
}

export type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'UNKNOWN';

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  stockQuantity: number | null; // null for UNKNOWN
  status: StockStatus;
  lastCheckedAt: string; // ISO string or relative time
  isStale: boolean; // if checked > 48h ago or UNKNOWN
  rackLocation: string;
  accentColor: string;
  notes?: string;
  brand?: string;
  modelCode?: string;
  processor?: string;
  memory?: string;
  storage?: string;
  graphics?: string;
  display?: string;
  batteryWh?: number;
}

export type ApprovalStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'SUPPRESSED_BY_OFFLINE_SALE';

export interface ApprovalRequest {
  id: string;
  leadId: string;
  customerName: string;
  customerPhone: string;
  channel: MessageChannel;
  actionTitle: string;
  payloadSummary: string;
  draftMessage: string;
  approverName: string;
  createdAt: string;
  expiresAt: string; // ISO string
  status: ApprovalStatus;
  discountOfferedPercent?: number;
  quotedAmount?: number;
  suppressionReason?: string;
}

export type PaymentVerificationStatus = 'VERIFIED_PAID' | 'PENDING' | 'FAILED' | 'UNKNOWN';

export type PaymentMethod = 'UPI_GATEWAY' | 'DIRECT_UPI_QR' | 'CASH' | 'POS_CARD';

export interface PaymentRecord {
  id: string;
  leadId: string;
  customerName: string;
  productName: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentVerificationStatus;
  referenceNumber?: string;
  utr?: string;
  createdAt: string;
  verifiedAt?: string;
  failureReason?: string;
  isOffline: boolean;
  notes?: string;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  channel: MessageChannel;
  currentStage: WorkflowStage;
  status: LeadStatus;
  priority: LeadPriority;
  priorityRationale: string;
  createdAt: string;
  lastActiveAt: string;
  interestedProductId?: string;
  interestedProductName?: string;
  quotedAmount?: number;
  timeline: TimelineEvent[];
  pendingApprovalId?: string;
  paymentId?: string;
  isFollowupSuppressed: boolean;
  suppressionNote?: string;
}

export interface StoreMetrics {
  activeLeadsCount: number;
  approvalsDueCount: number;
  expiringApprovalsCount: number;
  pendingPaymentsCount: number;
  todaySalesAmount: number;
  todaySalesCount: number;
  offlineSalesCount: number;
  staleStockCount: number;
}

