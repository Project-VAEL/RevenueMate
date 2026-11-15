# Statuses, events and interfaces — revised v4

Freeze changes here before implementation. `tenant_id` is required for all tenant-owned records and service calls. Money is integer paise.

## Lead status
`new`, `drafted`, `approved`, `sent`, `payment_requested`, `paid`, `dismissed`, `uncertain`

Lead status tracks the conversation/sales lead. It must not be used as the order or fulfilment status.

## Draft status
`pending`, `approved`, `dismissed`

## Order status
`draft`, `reservation_pending`, `reserved`, `confirmed`, `cancelled`, `expired`, `completed`

## Reservation status
`pending`, `active`, `released`, `expired`, `consumed`

Reservation fields: `reservation_code` (unique, non-guessable), `order_id`, `tenant_id`, `status`, `expires_at`, `created_at`, `released_at`.

## Payment status
`created`, `sent`, `pending`, `success`, `failed`, `expired`, `uncertain`

Payment status is independent from order and fulfilment status.

## Fulfilment
Method: `store_pickup`, `home_delivery`

Pickup status: `awaiting_preparation`, `ready_for_pickup`, `handed_over`

Delivery status: `awaiting_dispatch`, `dispatched`, `delivered`, `delivery_failed`

## Inventory quantities
Maintain `on_hand`, `reserved`, and derived `available = on_hand - reserved`. Reserve atomically. On completion, reduce `on_hand` and `reserved` exactly once. On cancellation/expiry, release `reserved` exactly once.

## Event types
Existing events remain. Add:
`order_created`, `order_updated`, `reservation_requested`, `reservation_approved`, `reservation_rejected`, `reservation_expired`, `reservation_released`, `stock_reserved`, `stock_reservation_released`, `fulfillment_method_selected`, `pickup_ready`, `reservation_lookup_performed`, `payment_link_created`, `payment_verified`, `pickup_handover_completed`, `delivery_dispatched`, `delivery_completed`, `order_completed`, `order_cancelled`

Avoid duplicate event names where an existing event already has the same meaning.

## Allowed order transitions
- `draft` -> `reservation_pending` or `cancelled`
- `reservation_pending` -> `reserved` or `cancelled`
- `reserved` -> `confirmed`, `expired` or `cancelled`
- `confirmed` -> `completed` or `cancelled`
- `expired`, `cancelled`, `completed` are terminal

The service must additionally validate reservation validity, payment policy and fulfilment status before completion.

## AI interfaces
`parse_enquiry(text, catalogue) -> ParsedEnquiry`
`score_lead(lead, signals) -> Score`
`build_draft(lead, product, stock) -> DraftResult`
AI output is advisory. Validate product IDs, price, stock and order actions against database facts.

## Adapter interfaces
Messaging: `send_message`, `send_owner_prompt`, `parse_inbound`
Payments: `create_link(order_ref, amount_paise, customer, idempotency_key)`, `get_status(order_ref)`

Provider timeouts produce `uncertain`; reconcile provider state before retrying.

## Service ownership
- Only lead state machine changes `lead.status`.
- Only payment verification service marks payment success.
- Only reservation service changes reservation allocation.
- Only order service changes order status.
- Only fulfilment service marks pickup handover or delivery completion.


## Conversational product intelligence events (v5 proposal)
`conversation_started`, `customer_preference_extracted`, `customer_preference_confirmed`, `reference_products_retrieved`, `component_facts_retrieved`, `product_comparison_created`, `product_recommendation_presented`, `reference_source_conflict_detected`, `merchant_offer_checked`.

Reference retrieval must not mutate merchant inventory. Recommendation event payloads should retain product variant IDs, requested criteria, source IDs and whether each candidate is merchant-confirmed or reference-only.
