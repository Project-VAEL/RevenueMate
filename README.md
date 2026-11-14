# RevenueMate — Merchant Sales Workflow Dashboard Prototype

An interactive, merchant-facing dashboard prototype built for **RevenueMate** with **Next.js**, **React 19**, and **Tailwind CSS**.

The dashboard models and visualizes the complete retail sales workflow:
```
Enquiry → Lead → Priority → Stock Check → Follow-up Approval → Payment Request/Status → Sale Recorded
```

---

## 🎨 Design & UI/UX System

- **Bento Box Grid**: Modular, high-contrast bento card layout optimized for both laptop screens and mobile devices.
- **Neo-Brutalist Solid Color Blocking**: Deep charcoal background (`#121214`) punctuated by saturated pastel blocks:
  - **Vibrant Violet/Purple** (`#8B5CF6`): Active Leads & Omnichannel Pipeline
  - **Warm Mustard Yellow** (`#F59E0B`): Human-in-the-Loop Approvals Due
  - **Soft Coral/Peach** (`#FB7185`): Payment Integrity & Verifications
  - **Mint/Sage Green** (`#10B981`): Confirmed Sales & Offline Rapid Recording Anchor
- **Extreme Rounding**: Soft, pill-like cards with `rounded-3xl` (24–32px) and subtle borders (`border-white/[0.08]`).
- **Typography & Visual Hierarchy**: Ultra-bold primary metric values with muted neutral secondary labels (`text-zinc-400`).
- **Minimalist Floating Sidebar**: Geometric icon navigation with active glow indicators and mobile bottom dock.

---

## 🚀 Core Features & Implementation Highlights

### 1. 7-Stage Sales Workflow Stepper (`SalesWorkflowBar`)
Visible at the top of the workspace. Allows merchants and evaluators to track where every enquiry sits in the funnel:
1. **01 Enquiry**: Omnichannel incoming message (WhatsApp, Instagram DM, Walk-In, Website).
2. **02 Lead**: Structured profile, phone number, and matched SKU.
3. **03 Priority**: Rule-engine scoring (High / Medium / Low) with transparent text rationale.
4. **04 Stock Check**: Real-time shelf inventory availability with explicit guardrails for unverified stock.
5. **05 Follow-up Approval**: Merchant sign-off queue with expiry timers.
6. **06 Payment Status**: UPI payment link generation and bank webhook reconciliation.
7. **07 Sale Recorded**: Online or offline completion — **automatically suppresses future follow-up automations**.

### 2. Lead Inbox & Explainable Detail View (`LeadInbox` & `LeadDetail`)
- Filter by status (*All, New Enquiries, Approvals Due, Payment Pending, Sales Recorded, Lost*) and priority (*All, High, Medium, Low*).
- **Explainable Priority Box**: Clear textual reasoning for why a lead is High Priority (e.g., *"Recent enquiry (14m ago) + clear intent for specific SKU (Navy Banarasi) + high purchase velocity for wedding reception"*).
- **Full Conversation Timeline**: WhatsApp chat bubbles, timestamped merchant replies, automated drafts, system events, and payment receipts.
- **Stock Check Helper**: Embedded SKU lookup displaying live stock, rack location, and last-checked timestamp.

### 3. Product Catalogue & Stock Verification (`StockCatalogue` & `StockUpdateModal`)
- Real-time inventory tracking for boutique items (Pure Kanjivaram Silk, Banarasi Katan, Bridal Lehenga, Kurta sets).
- **Explicit "UNKNOWN" State**: Missing inventory counts are boldly flagged in amber (`UNKNOWN STATE - Physical verification required`). Automated quotes are safely paused.
- **Last-Updated Timestamps**: Displays exact time since last physical check (e.g., *"Checked 2 hours ago"*, *"Stale: 5 days ago"*).
- **Inventory Verification Modal**: Allows merchants to physically count shelf stock and update availability in real time.

### 4. Human-in-the-Loop Approval Panel (`ApprovalPanel`)
- Displays exact action, payload summary, draft message preview, assigned approver name (*Kavita Sharma*), and countdown expiry timer.
- Merchant safety guardrail: No automated WhatsApp message is ever dispatched without explicit merchant authorization.
- When an offline sale is logged, approvals are marked as `SUPPRESSED_BY_OFFLINE_SALE` with a detailed explanation.

### 5. Payment & Order Status Ledger (`PaymentStatusView`)
- Truthful tracking distinguishing 4 distinct states:
  - **Verified Paid** (Bank confirmed with UTR & reference number).
  - **Pending** (Payment link active, awaiting customer completion).
  - **Failed** (Bank gateway timeout or decline; prompt to retry or offer counter QR).
  - **Unknown / Unconfirmed** (Warning: do not dispatch items until verified on net banking).
- **Interactive Bank Webhook Simulators**: Test gateway success/failure callbacks with one click.
- **Custom UPI Payment Link Generator**: Dispatches custom amount links to any customer.

### 6. Offline In-Store Sale Recording (`RecordOfflineSaleModal`)
- Record Cash, Counter UPI QR, or POS Terminal purchases.
- **Automated Follow-up Suppression**: Immediately marks the lead as `Sale Recorded`, decrements physical inventory, and permanently suppresses future automated follow-up messages.

---

## 🛠 Running the Application

### Development Server:
```bash
npm run dev
# or: ./node_modules/.bin/next dev --webpack -p 3000
```

### Production Build & Run:
```bash
npm run build
npm run start
# Server runs on http://localhost:3000
```

---

## 🔒 Security & Accuracy Compliance
- **Zero Real Credentials**: No live WhatsApp or payment gateway secrets are exposed in browser code.
- **Honest Metrics**: Displays real workflow counts only (no fabricated ROI or fake conversion percentages).
- **No Fake Badges**: All simulated actions are explicitly identified with a `MOCK DEMO MODE` badge.
