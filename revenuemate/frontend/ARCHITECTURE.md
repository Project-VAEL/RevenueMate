# RevenueMate — Revised Architecture (v4)

## Product goal
RevenueMate manages the retail sales journey from a WhatsApp enquiry through product discovery, reservation, payment, and physical fulfilment. It supports both in-store pickup and home delivery.

## Architectural principles
- The backend is the source of truth for catalogue, inventory, order, reservation, payment, and fulfilment state.
- Sarvam AI interprets customer language and drafts responses; it never authorises stock allocation, payment success, or product handover.
- Merchant approval is required for reservation confirmation and other configured business actions.
- Payment success is established only by a verified payment-provider webhook or an authenticated provider status check.
- All tenant-owned records and service operations are scoped by `tenant_id`.
- Money is stored as integer paise. Timestamps are timezone-aware UTC.
- External provider calls use idempotency keys and explicit `uncertain` handling.
- Pickup and delivery share one order model but have separate fulfilment records/workflows.

## High-level flow
1. WhatsApp webhook receives a customer message.
2. Lead service persists the message and lead; AI parses intent and scores the lead.
3. Catalogue service supplies factual product data; stock service checks sellable inventory.
4. Draft service proposes a response; merchant approves/edits it.
5. Customer selects a product and fulfilment method (`store_pickup` or `home_delivery`).
6. Order service creates an order. Reservation service atomically allocates stock with an expiry.
7. For pickup, receptionist searches a reservation code and sees only minimum fulfilment details. For delivery, the merchant prepares and dispatches the order.
8. Payment service creates a provider payment link for the exact order amount.
9. Provider webhook/status check verifies payment; the backend marks the payment successful.
10. Handover/delivery can be completed only when fulfilment prerequisites are satisfied. The system records an immutable audit event.

## Core bounded responsibilities
- `ai/`: parsing, scoring, draft generation, guardrails. No database writes, provider calls, or business-state transitions.
- `services/`: business rules and transactions.
- `api/`: HTTP validation/authentication/dependency wiring only.
- `adapters/`: WhatsApp and payment-provider integrations. No service imports.
- `models/`: persistence entities.
- `schemas/`: request/response validation and public enum contracts.
- `frontend/`: merchant console and restricted receptionist fulfilment view.

## Order, payment and fulfilment are separate state dimensions
Do not use one status field to represent every stage. An order can be reserved while payment is pending. Recommended dimensions:
- `order.status`: `draft`, `reservation_pending`, `reserved`, `confirmed`, `cancelled`, `expired`, `completed`
- `payment.status`: existing payment states (`created`, `sent`, `pending`, `success`, `failed`, `expired`, `uncertain`)
- `fulfillment.method`: `store_pickup` or `home_delivery`
- `fulfillment.status`: pickup: `awaiting_preparation`, `ready_for_pickup`, `handed_over`; delivery: `awaiting_dispatch`, `dispatched`, `delivered`, `delivery_failed`

## Critical invariants
1. A reservation cannot allocate more units than available stock. Use a database transaction and row-level lock or an atomic conditional update.
2. A reservation has an expiry timestamp. Expiry/cancellation releases its allocation exactly once.
3. Repeated API calls and provider webhooks are idempotent.
4. A payment is not successful because of a screenshot, message, or AI interpretation.
5. A paid order is not automatically handed over. A receptionist must explicitly confirm physical handover.
6. A pickup handover is blocked unless the reservation is valid and the configured payment policy is satisfied. If pay-at-store is enabled, record the authenticated POS/cash confirmation separately.
7. Delivery completion requires a delivery confirmation event, not merely a dispatch event.
8. Receptionist access is restricted to reservation lookup and fulfilment actions; do not expose full lead history or unnecessary customer data.
9. All order, reservation, payment and fulfilment mutations emit audit events.
10. Never decrement stock twice. Define whether inventory is decremented at reservation or completion; recommended: maintain `on_hand`, `reserved`, and `available = on_hand - reserved`, then decrement on completion and release `reserved`.

## Payment policy
Support merchant-configured options:
- `online_before_handover` (recommended for the live demo)
- `pay_at_store` (record payment through an authorised counter workflow)
- `cash_on_delivery` only if the merchant enables it.

For the hackathon demo, use the existing mock payment adapter unless live provider credentials and webhook verification are available. Clearly label sandbox/mock payment in the presentation.

## Roles
- `merchant`: catalogue/stock management, approvals, order management, payment and fulfilment overview.
- `receptionist`: reservation lookup, product-ready confirmation, payment-status view, handover confirmation. No access to AI settings or full customer conversations.
- `dispatcher`: delivery preparation, dispatch and delivery status.
- `customer`: WhatsApp interaction and own order/reservation status.

## Implementation priority
P0: order + reservation models/services, atomic stock reservation, receptionist lookup, payment integration with verified-only status, pickup completion, audit events, WhatsApp journey.
P1: delivery workflow, reservation expiry worker, cancellation/release, role-specific frontend.
P2: analytics, multi-location stock, automated follow-ups and advanced logistics.

## Scaffold status
This ZIP retains the existing v3 scaffold and adds the revised architecture contract, documentation and implementation placeholders. New order/reservation/fulfilment modules are architectural stubs, not a claim that the complete workflow is already implemented.


## Product Intelligence and Conversational Commerce (v5)

RevenueMate has two separate knowledge domains: (1) the merchant-owned catalogue/offer/inventory, and (2) the shared reference catalogue plus hardware knowledge base. The shared databases are for product discovery and fact-grounded recommendations; they are not proof that a merchant sells or stocks a given model. The merchant can activate an exact reference variant only after confirming the exact model/SKU, local price, stock count, store location and timestamp.

### Conversational flow
1. Conversation manager retains tenant-scoped conversation context and current customer requirements (budget, workload, battery preference, display, portability, OS preference, etc.).
2. Intent/slot parser converts the message into validated structured constraints and identifies missing critical information.
3. Product retrieval queries exact variant records and merchant offers separately. Hard constraints (budget ceiling, OS, form factor, GPU class if required) are deterministic filters.
4. Component knowledge retrieval returns only relevant sourced facts: CPU, integrated/discrete GPU, RAM type/capacity/upgrade slots, storage, display, battery capacity, networking and ports.
5. Recommendation service ranks only products with an active merchant offer and sufficiently fresh stock/price data for transactional recommendations. Reference-only models can be discussed as market knowledge but must be clearly labeled “not confirmed in this shop”.
6. LLM explains why alternatives fit, states trade-offs, provides source-backed specifications, and asks focused follow-up questions. It must not manufacture benchmarks, runtime, price, inventory, warranty or compatibility.
7. When the customer selects an offer, order/reservation services run the existing approval and stock-allocation controls.

### Data and authority boundaries
- Merchant offer/stock: merchant-owned DB only; authoritative for store price and on-hand quantity.
- Product specifications: OEM/official product-support sources in the reference DB; exact variant-level provenance required.
- Component details: CPU/GPU maker pages and OEM technical sheets; system-specific TGP/power/thermals remain attached to the laptop variant.
- Web research: allow-listed source retrieval for missing/outdated facts; store source URL, publisher, retrieval time and the extracted field. Web search does not modify merchant offers.
- AI: interprets customer needs and produces explanations; no writes to prices, stock, reservations, payment states or source records.

### Recommendation integrity rules
- No SKU merging: never combine one variant's processor with another variant's memory/display.
- No unsupported scores: don't generate performance rankings without a separately stored benchmark dataset, methodology, device power envelope and date.
- Null means unknown, not zero. Missing stock means unavailable-to-confirm, not out of stock.
- Product recommendation must state whether an item is confirmed in merchant inventory or is reference-only.
- Battery capacity (Wh) is not runtime. CPU max turbo frequency is not sustained frequency. GPU name alone is not enough without laptop TGP.
- Explain compatibility using exact device/slot/interface data; otherwise say it is unverified.

### New modules
See `docs/product-intelligence.md` and `data/reference/README.md`. Product reference datasets are already populated with sourced facts, but no live web crawler or LLM implementation is included in this scaffold.


## Product Intelligence & Conversational Commerce (v5)
RevenueMate supports needs-based, multi-turn product discovery. The conversation agent extracts hard constraints (budget, compatibility, preferred OS/size), soft preferences (battery, weight, display), and intended workloads. It asks follow-up questions when necessary; it does not guess missing requirements.

Two reference databases are supplied locally:
- `data/databases/laptop_reference.sqlite`: exact product/model facts, source provenance and (empty) merchant-offer table.
- `data/databases/hardware_knowledge.sqlite`: normalized component facts and product-component relationships.

Retrieval flow: query exact catalogue facts from SQLite; use the hardware knowledge DB for component explanation and compatibility facts; use web research only when the local evidence is missing or stale; show citations/provenance and date; ask the customer or merchant to confirm unresolved facts. RAG/vector search may index sourced text but must never create or overwrite factual records.

Recommendation rules: enforce hard filters in code (budget, exact model, seller availability and stock), rank only using explicit customer requirements and source-backed attributes, explain trade-offs, and distinguish missing values from negative facts. An LLM may interpret needs and explain a recommendation but may not fabricate product details, merchant price/stock, benchmark performance or compatibility. Only merchant-confirmed `merchant_offers` rows can be reserved or sold.

The included catalogue is a curated research snapshot, not any shop's live inventory. All merchant price/stock fields are blank. See `data/reference/README.md` and `docs/data-provenance.md`.
