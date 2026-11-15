/**
 * RevenueMate API Client
 * Connects frontend to FastAPI backend (default http://localhost:8000)
 * All money amounts from backend are in integer paise; divide by 100 for display in ₹ INR.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

class ApiError extends Error {
  status: number;
  data: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
    this.name = 'ApiError';
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = `HTTP ${response.status} ${response.statusText}`;
    let errorData: any = null;
    try {
      errorData = await response.json();
      if (errorData?.detail) {
        errorDetail = errorData.detail;
      }
    } catch {
      // ignore JSON parse error
    }
    throw new ApiError(response.status, errorDetail, errorData);
  }

  // Handle 204 or empty responses
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

// 1. Health & Connection Check
export async function checkBackendHealth(): Promise<{ status: string }> {
  return request<{ status: string }>('/health');
}

// 2. Leads Management
export interface BackendLead {
  id: string;
  customer_name?: string | null;
  customer_contact: string;
  raw_text: string;
  product_id?: string | null;
  quantity?: number | null;
  status: string;
  priority_score: number;
  priority_reasons: string[];
  rule_version?: string | null;
  intent?: string | null;
  urgency?: string | null;
  created_at: string;
}

export interface BackendLeadDetail extends BackendLead {
  product?: BackendProduct | null;
  latest_draft?: BackendDraft | null;
  latest_payment?: BackendPayment | null;
}

export async function getLeads(): Promise<BackendLead[]> {
  return request<BackendLead[]>('/leads');
}

export async function getLeadDetail(leadId: string): Promise<BackendLeadDetail> {
  return request<BackendLeadDetail>(`/leads/${leadId}`);
}

export async function createManualLead(payload: {
  customer_name?: string;
  customer_contact: string;
  raw_text: string;
}): Promise<BackendLead> {
  return request<BackendLead>('/leads', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function generateLeadDraft(leadId: string): Promise<BackendDraft> {
  return request<BackendDraft>(`/leads/${leadId}/draft`, {
    method: 'POST',
  });
}

// 3. Draft & Offer Approvals
export interface BackendDraft {
  id: string;
  lead_id: string;
  text: string;
  facts_used: Record<string, any>;
  warnings: string[];
  status: string;
  created_at: string;
}

export async function approveDraft(
  draftId: string,
  payload: { edited_text?: string; decided_by?: string; channel?: string } = {}
): Promise<{ status: string }> {
  return request<{ status: string }>(`/drafts/${draftId}/approve`, {
    method: 'POST',
    body: JSON.stringify({
      edited_text: payload.edited_text,
      decided_by: payload.decided_by || 'owner',
      channel: payload.channel || 'dashboard',
    }),
  });
}

export async function dismissDraft(
  draftId: string,
  payload: { decided_by?: string; channel?: string } = {}
): Promise<{ status: string }> {
  return request<{ status: string }>(`/drafts/${draftId}/dismiss`, {
    method: 'POST',
    body: JSON.stringify({
      decided_by: payload.decided_by || 'owner',
      channel: payload.channel || 'dashboard',
    }),
  });
}

// 4. Catalogue & Stock Management
export interface BackendProduct {
  id: string;
  sku: string;
  name: string;
  price_paise: number;
  active: boolean;
  quantity?: number | null;
  stock_as_of?: string | null;
  stock_is_stale: boolean;
}

export async function getCatalogueProducts(): Promise<BackendProduct[]> {
  return request<BackendProduct[]>('/catalogue/products');
}

export async function updateProductStock(
  productId: string,
  quantity: number
): Promise<BackendProduct> {
  return request<BackendProduct>(`/catalogue/products/${productId}/stock`, {
    method: 'PUT',
    body: JSON.stringify({ quantity }),
  });
}

// 5. Orders & Reservations
export interface BackendOrder {
  id: string;
  lead_id: string;
  status: string;
  total_amount_paise: number;
  reservation_id?: string | null;
  items?: any[];
  created_at: string;
}

export async function getOrders(): Promise<BackendOrder[]> {
  return request<BackendOrder[]>('/orders');
}

export async function getOrderDetail(orderId: string): Promise<BackendOrder> {
  return request<BackendOrder>(`/orders/${orderId}`);
}

export async function createOrder(payload: {
  lead_id: string;
  items: Array<{ product_id: string; quantity: number }>;
}): Promise<BackendOrder> {
  return request<BackendOrder>('/orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function requestReservation(orderId: string): Promise<any> {
  return request(`/orders/${orderId}/request-reservation`, {
    method: 'POST',
  });
}

export async function approveReservation(orderId: string): Promise<any> {
  return request(`/orders/${orderId}/approve-reservation`, {
    method: 'POST',
  });
}

export async function rejectReservation(orderId: string): Promise<any> {
  return request(`/orders/${orderId}/reject-reservation`, {
    method: 'POST',
  });
}

export async function createPaymentLink(
  orderId: string,
  amountPaise?: number
): Promise<{ link_url: string; order_ref: string }> {
  return request<{ link_url: string; order_ref: string }>(
    `/orders/${orderId}/payment-link`,
    {
      method: 'POST',
      body: JSON.stringify(amountPaise ? { amount_paise: amountPaise } : {}),
    }
  );
}

// 6. Payments
export interface BackendPayment {
  id: string;
  lead_id?: string | null;
  order_id?: string | null;
  amount_paise: number;
  order_ref: string;
  provider: string;
  link_url?: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export async function getPayment(paymentId: string): Promise<BackendPayment> {
  return request<BackendPayment>(`/payments/${paymentId}`);
}

export async function verifyPayment(paymentId: string): Promise<BackendPayment> {
  return request<BackendPayment>(`/payments/${paymentId}/verify`, {
    method: 'POST',
  });
}

export async function simulateMockPay(
  orderRef: string,
  outcome: 'pay' | 'fail'
): Promise<any> {
  return request(`/mock-pay/${orderRef}/${outcome}`, {
    method: 'POST',
  });
}

// 7. Audit Timeline Events
export interface BackendEvent {
  id: string;
  tenant_id: string;
  lead_id?: string | null;
  order_id?: string | null;
  name: string;
  data: Record<string, any>;
  created_at: string;
}

export async function getEvents(params: {
  lead_id?: string;
  order_id?: string;
}): Promise<BackendEvent[]> {
  const searchParams = new URLSearchParams();
  if (params.lead_id) searchParams.append('lead_id', params.lead_id);
  if (params.order_id) searchParams.append('order_id', params.order_id);
  return request<BackendEvent[]>(`/events?${searchParams.toString()}`);
}

