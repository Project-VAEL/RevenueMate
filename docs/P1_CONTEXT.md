# P1 context pack — revised v4

Paste this with `docs/statuses-and-events.md` and `docs/api-contract.md` when generating implementation files.

## Stack and conventions
- Python 3.11+, FastAPI, SQLAlchemy 2.0 synchronous, Pydantic v2, pydantic-settings, httpx, pytest.
- PostgreSQL in deployment; tests use SQLite where practical. Use portable column types.
- IDs are `str(uuid4())`; timestamps are timezone-aware UTC.
- Money is integer paise.
- Every tenant-owned table and service function is scoped by `tenant_id`.
- Type hints on every function; no wildcard imports or unused code.

## Layer boundaries
- `api/` validates and wires dependencies; no business logic.
- `services/` owns transactions and business rules.
- `ai/` is advisory only; no adapter calls, DB writes or status mutations.
- `adapters/` call external providers; never import services.
- Only designated services mutate their state dimensions.

## Transaction and provider rules
- Helpers flush; public service functions commit.
- Persist pending provider requests and idempotency keys before external calls.
- A timeout is `uncertain`, not proof of failure. Reconcile before retry.
- Verify payment using provider signature/status, order reference, amount and currency.
- Never accept screenshots or AI interpretation as payment evidence.

## Ownership rules
- `state_machine.transition` alone assigns `lead.status`.
- `payment_service.verify` alone marks payment success.
- `reservation_service` alone changes reservation state and reserved stock.
- `order_service` alone changes order state.
- `fulfillment_service` alone marks handover/delivery completion.

## Inventory rules
Track `on_hand`, `reserved`, and `available = on_hand - reserved`.
Reservation must be atomic and cannot oversell. On cancellation/expiry release reserved stock once. On completed sale reduce on_hand and reserved once. Use a transaction plus row lock or conditional atomic update; test concurrent attempts for the final unit.

## Role rules
- Merchant: catalogue, stock, approvals, orders, analytics.
- Receptionist: reservation lookup, ready-for-pickup, payment status and handover only.
- Dispatcher: delivery dispatch and delivery confirmation.
- Customer: own order status through WhatsApp.
All endpoints enforce tenant and role scope.

## Build order
1. Freeze enums/contracts and migrations.
2. Add `Order`, `OrderItem`, `Reservation`, `Fulfillment` models.
3. Add order/reservation/fulfilment schemas.
4. Implement atomic `reservation_service` and tests.
5. Implement `order_service` and transition tests.
6. Implement `fulfillment_service` and receptionist role tests.
7. Integrate existing `payment_service` with order references and exact amount checks.
8. Add API routers and register them.
9. Add frontend merchant order view and receptionist lookup view.
10. Wire WhatsApp selection/reservation/payment messages.
11. Run end-to-end tests and demo rehearsal.

## Provider/demo constraints
Use the existing mock payment adapter unless live payment credentials and webhook verification are available. Never pitch mock payment as a live Paytm integration. Real WhatsApp test-number and 24-hour-window restrictions remain; validate them on demo day.

## Definition of done
Tests cover oversell prevention, reservation expiry/release, tenant isolation, role permissions, duplicate webhooks, payment amount mismatch, payment timeout reconciliation, blocked unpaid handover, duplicate handover, and delivery completion.


## Product intelligence / conversational sales (v5)
- Read `docs/product-intelligence.md`, `docs/data-provenance.md` and `data/reference/README.md` before implementing these modules.
- Shared reference product data and tenant-owned merchant offers/inventory are separate stores/tables. Never infer store stock or price from reference data or a web result.
- Each product/component fact must retain `source_id`; exact model/variant identifiers are required. Do not merge sibling configurations.
- LLM can parse buyer intent, ask questions and explain facts; backend retrieval, constraints, merchant stock checks and transaction state remain deterministic.
- No generated benchmarks or recommendation scores without a benchmark source and documented scoring method.
- Family-only profiles are not exact variants and must be excluded from transactional recommendations until a precise SKU is verified.


## Product intelligence contract (v5)
- Query `laptop_reference.sqlite` for exact model facts, and `hardware_knowledge.sqlite` for component references.
- Treat `merchant_offers` as the only authority for merchant price and stock; current table is intentionally empty.
- Parse customer needs into hard constraints and soft preferences. Run hard filtering/ranking in deterministic code; LLM only explains, asks clarifying questions and proposes comparisons.
- Do not store LLM-generated specs, benchmarks, performance judgements or compatibility claims. Any researched fact must be saved with a source ID, URL, retrieval timestamp and exact model scope.
- Family-only and `recommendation_eligible=false` records cannot be presented as confirmed exact-variant matches.


## Product intelligence contract (v5)
- Query `laptop_reference.sqlite` for exact model facts, and `hardware_knowledge.sqlite` for component references.
- Treat `merchant_offers` as the only authority for merchant price and stock; current table is intentionally empty.
- Parse customer needs into hard constraints and soft preferences. Run hard filtering/ranking in deterministic code; LLM only explains, asks clarifying questions and proposes comparisons.
- Do not store LLM-generated specs, benchmarks, performance judgements or compatibility claims. Any researched fact must be saved with a source ID, URL, retrieval timestamp and exact model scope.
- Family-only and `recommendation_eligible=false` records cannot be presented as confirmed exact-variant matches.
