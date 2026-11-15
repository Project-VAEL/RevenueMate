# RevenueMate

Autonomous sales teammate for Paytm merchants. Team VALE, Paytm Build for India AI Hackathon, Pune, Track 1: Merchant Growth AI.

**Nothing is implemented in this folder.** Every code file contains only a header: its owner, its purpose and a short prompt. Code is generated at the event, one file at a time.

## The loop we build
enquiry, lead, stock-aware draft, owner approval, payment link, payment marked paid only after server-side verification. The LLM proposes; the system decides.

## Roles
- **P1:** core backend and payments (`models`, `schemas`, `api`, most of `services`, `adapters/payments`, `adapters/registry.py`, backend tests, scripts/simulate_timeout.py, config files)
- **P2:** AI and messaging (`ai/`, `adapters/messaging`, `services/draft_service.py`, `seed/enquiries.json`, AI tests)
- **P3:** dashboard, demo and pitch (`frontend/`, `seed/catalogue.json`, `scripts/demo_run.py`, `docs/demo-script.md`, README)

## Ground rules
1. One file per entity or responsibility. Edit only your own files.
2. Routers hold no business logic. Only `services/` changes state, and every change writes an event.
3. Only the workflow services may trigger a send or a payment. `ai/` returns suggestions and never calls adapters.
4. Mock and real adapters share one interface. WhatsApp is real for the demo; payments are mock by design.
5. Money is integer paise. Convert only inside a provider adapter.
6. Every table has `tenant_id`. Every send and payment link has an idempotency key.
7. Secrets live only in `.env`. Never in the repo, the deck or the demo.
8. Do not claim anything that is not built, and do not invent numbers.

## How to generate a file
1. Paste these ground rules, `docs/statuses-and-events.md` and `docs/api-contract.md` into your code assistant.
2. Paste the header of the file you are generating (its PROMPT) and the headers of the files it imports.
3. Ask for that one file only. Keep the header at the top of the file.
4. Run it, run its tests, commit, then move on.

## Order
1. `config.py`, `db.py`, `models/`, `docker-compose.yml`
2. `schemas/`
3. `state_machine.py`, `idempotency.py`, `event_service.py`, with their tests
4. `adapters/*/base.py`, then both `mock.py` files, then `registry.py`
5. `ai/` and `draft_service.py` against sample data
6. `lead_service.py`, `stock_service.py`, `approval_service.py`, `payment_service.py`
7. `api/` routers and `main.py`, then `seed/`
8. Frontend `lib/`, then components, then pages
9. `whatsapp.py` once the loop works on mocks. `paytm.py` is post-event.
10. Scripts, remaining tests, demo script

## If something fails on the day
- WhatsApp fails on the day (tunnel down, token expired, number not on the allowed list): set MESSAGING_PROVIDER=mock and approve from the dashboard.
- Payments use the mock provider by design; the Paytm adapter is post-event. Say so in the demo.
- LLM slow or failing: the lead is still captured; the owner sees a plain template draft.
- Behind schedule: cut analytics and recovery first. Never cut approval or payment verification.


## Architecture revision: v4

This scaffold now includes the revised order lifecycle for both **Reserve & Collect** and **Home Delivery**. Read `ARCHITECTURE.md` first, then `docs/statuses-and-events.md`, `docs/api-contract.md`, and `docs/P1_CONTEXT.md` before implementing the new modules.

The new order, reservation and fulfilment files are intentionally TODO placeholders. They define the intended folder structure and ownership boundaries; they are not completed features.


## Architecture revision: v5 — product intelligence
The scaffold now specifies conversational product discovery and an offline reference product knowledge pack. Read `ARCHITECTURE.md`, `docs/product-intelligence.md` and `docs/data-provenance.md`.

### Preloaded reference data
- `data/databases/laptop_reference.sqlite`: sourced laptop model families/variants.
- `data/databases/hardware_knowledge.sqlite`: sourced CPU, GPU, memory, storage, display, battery and wireless component facts.
- `data/reference/`: readable JSON exports, source manifest, evidence map, empty merchant-offer template and validation script.

**Data boundary:** these are global reference datasets, not the inventory of the hackathon merchant. Merchant price and stock are intentionally blank. The team must enter the shop's actual stock and approved price before enabling reservation or claiming availability.

All new product-intelligence application modules remain implementation tasks for the event. The SQLite/JSON reference data itself is populated and can be queried offline immediately.


## Product Intelligence data pack (v5)
This revision includes two populated local SQLite reference databases: a curated laptop model catalogue and a component-level hardware knowledge base. See `data/reference/README.md`, `docs/product-intelligence.md`, and `docs/data-provenance.md` for source scope, constraints and validation. These are reference specifications only; merchant prices and stock are intentionally blank. Product Intelligence/backend modules remain TODO placeholders for implementation on hackathon day.
