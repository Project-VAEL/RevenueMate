# RevenueMate v5 — Hackathon-Day Execution Guide

**Event:** Paytm Build for India AI Hackathon — Pune  
**Build date:** 15 November 2026  
**Track:** Merchant Growth AI  
**Your role:** AI, Product Intelligence, Messaging, Workflow Automation, Final Presentation & Pitch  
**Baseline:** `revenuemate-revised-architecture-v5-product-intelligence.zip` plus `RevenueMate-Project-Overview.md` and `revenuemate-v5-folder-tree-1.txt`

> This is an execution runbook, not a claim that the scaffold is already implemented. The source documents describe the application as an architecture/preparation scaffold. The two local product-reference databases are populated; most of the new v5 application modules are still TODOs. Work through the checkpoints in order and do not let an AI coding agent mark a task complete without running it.

---

## 0. Your mission for tomorrow

Your job is to build the intelligence and communication layer that turns a buyer's natural-language request into a grounded product recommendation and then supports the approved next step.

The target journey is:

**WhatsApp enquiry → conversation context → intent/constraints → exact reference-product retrieval → component facts → deterministic filtering/comparison → grounded recommendation → merchant offer/stock check → merchant approval → reservation/order workflow → buyer updates → payment/fulfilment messages.**

The backend owns prices, stock, reservation, payment and fulfilment state. The LLM understands language and explains sourced information. The merchant approves business-critical actions.

### Your end-of-day definition of done

Aim to deliver these six outcomes:

1. A working LLM client, or a mock LLM fallback if the live provider is unavailable.
2. A multi-turn intent parser that extracts buyer needs into validated structured constraints.
3. Retrieval and recommendation that use the supplied SQLite reference data without confusing it with merchant inventory.
4. Natural-language responses grounded in retrieved facts, with missing information disclosed.
5. A working mock messaging path; real WhatsApp only if credentials, tunnel, test number and webhook setup are already available and verified.
6. A rehearsed pitch and one end-to-end demonstration that matches the functionality actually running.

**Do not spend the day building a general-purpose autonomous agent, analytics dashboard, web crawler, vector database, or multiple specialised agents.** The v5 design calls for bounded orchestration around deterministic services, not an unrestricted agent swarm.

---

## 1. Resolve the documentation conflicts before coding

The new v5 overview and architecture are the source of truth for tomorrow's product scope. Some files in the ZIP still contain older v3/v4 prompts and ownership descriptions.

### 1.1 Use this as the canonical v5 AI flow

| Responsibility | Canonical v5 module | Owner for tomorrow |
|---|---|---|
| Conversation context and turn management | `backend/app/ai/conversation_manager.py` | You |
| Buyer intent, hard constraints and preferences | `backend/app/ai/intent_parser.py` | You |
| Product and component reference lookup | `backend/app/product_intelligence/retrieval.py` | You, coordinated with P1 |
| Deterministic candidate filtering | `backend/app/services/product_search_service.py` | Agree with P1; recommended P1 owns service boundary, you define contract |
| Sourced specifications and component facts | `backend/app/services/product_knowledge_service.py` | Agree with P1; recommended P1 owns service boundary, you define contract |
| Deterministic recommendation/ranking | `backend/app/services/recommendation_service.py` | Agree with P1; recommended P1 owns service boundary, you define contract |
| AI orchestration | `backend/app/ai/recommendation_agent.py` | You |
| Buyer-facing response | `backend/app/ai/response_generator.py` | You |
| WhatsApp abstraction and mock/real adapter | `backend/app/adapters/messaging/` | You |
| Conversation API/router, persistence and tenant context | `backend/app/api/conversations.py`, `services/conversation_service.py` | P1 owns API/persistence; you supply AI call contract |
| Product-intelligence API routes | `backend/app/api/product_intelligence.py` | P1 owns routing; you supply service contract |
| Orders, reservations, payments, stock allocation and handover | Existing P1 services and order/reservation/fulfilment modules | P1 |
| Frontend screens and demo operation | `frontend/` | P3 |
| Final speaking/pitch ownership | Pitch and judge Q&A | You; P3 supports demo operation |

If your team has assigned the retrieval/service files differently, settle that in the first 10 minutes and write the owner beside each file. Do not let two agents edit the same file at once.

### 1.2 Do not build both the old and new AI pipelines

The ZIP still contains older files such as:

- `ai/parser.py`
- `ai/scorer.py`
- `ai/drafter.py`
- `ai/guardrails.py`
- `services/draft_service.py`

The new v5 flow introduces `intent_parser.py`, `conversation_manager.py`, `recommendation_agent.py`, `response_generator.py` and Product Intelligence modules. Use the **v5 flow as the main product**. Do not spend time duplicating the previous lead-score/draft pipeline unless an existing endpoint or teammate explicitly depends on it. Before leaving the older modules untouched, ask the coding agent to search for imports and report compatibility dependencies.

### 1.3 Important facts to freeze with the team

- `laptop_reference.sqlite` is product reference knowledge, not the shop's stock.
- `hardware_knowledge.sqlite` contains component facts and product-component links.
- `merchant_offers` currently has **zero rows**. Merchant price and stock are not populated.
- Family-only or `recommendation_eligible=false` records must not be treated as exact transactional recommendations.
- The demo script uses a ₹60,000 budget, while the project overview gives a separate ₹30,000 example. Choose one customer scenario and keep it consistent. Prefer the amount that can be supported by the confirmed demo offer; do not force either number.
- The README's `.env.example` currently defaults `MESSAGING_PROVIDER=whatsapp`, but WhatsApp credentials are blank and the README describes a mock fallback. Start with `MESSAGING_PROVIDER=mock` unless live setup has been tested.
- Payment is mock/sandbox for the hackathon unless the team separately proves a verified provider integration. Do not call it live Paytm payment.
- P3 operates the dashboard/demo, but you have clarified that you are responsible for the final presentation and pitch.

### 1.4 Merchant-offer gate — settle this early

Before a product can be reserved, the demo needs a merchant-confirmed exact variant, shop SKU, price, physical quantity, timestamp and active status.

There are only two honest options:

1. **Real merchant offer:** obtain the shop's confirmation of the exact laptop variant, selling price and physical stock count, then enter it through the approved merchant catalogue/seed flow.
2. **Clearly simulated offer:** create a demo-only offer with an unmistakable `SIMULATED DEMO INVENTORY` label. Explain that it is simulated. Only use it to demonstrate the reservation mechanics; never describe it as a real shop's verified stock.

If neither is available, demonstrate product comparison as **reference-only** and keep reservation disabled. Do not invent a shop price or stock quantity.

---

## 2. First 15 minutes: team alignment and shared contract

Call P1 and P3 together. Do not start generating code before this short meeting.

### 2.1 Decide the one demo journey

Use one buyer request, for example:

> “I need a laptop for Python, VS Code and Docker. My budget is [agreed budget]. Battery life matters to me.”

Agree on:

- the budget to use;
- whether the buyer prefers Windows, macOS or has no preference;
- one or two actual reference variants to compare from the supplied database;
- the exact merchant offer, if one exists;
- whether the transaction is real merchant data or explicitly simulated;
- the fulfilment method: Reserve & Collect for the main demo;
- the payment path: mock/sandbox unless verified live.

The assistant should ask a clarification question only when the missing information materially changes the shortlist. Do not make the demo artificially long with unnecessary questions.

### 2.2 Agree on the handoff contract

Ask P1 to provide or confirm these callable service interfaces (names can vary, but the data contract must be agreed):

```python
search_reference_products(criteria) -> list[ReferenceProduct]
get_product_knowledge(product_id) -> ProductKnowledge
search_merchant_offers(criteria, tenant_id) -> list[MerchantOffer]
recommend_products(criteria, reference_products, offers) -> RecommendationResult
process_buyer_message(tenant_id, conversation_id, message) -> ConversationReply
```

Your AI layer should receive typed results from these services. It should not open a database transaction or mutate merchant/order state itself.

Agree that the response object should include at least:

```json
{
  "reply_text": "...",
  "intent": "product_discovery",
  "needs_clarification": false,
  "follow_up_question": null,
  "candidates": [],
  "evidence": [],
  "merchant_offer_status": "not_checked",
  "transaction_allowed": false,
  "warnings": []
}
```

This is a proposed integration shape. P1 must map it to the actual Pydantic schemas/API contract before implementation.

### 2.3 Freeze file ownership

- You: `ai/`, `product_intelligence/retrieval.py`, `adapters/messaging/`, AI/messaging tests and pitch content.
- P1: database/session/auth, deterministic service boundaries if agreed, API routers, order/reservation/stock/payment/fulfilment and event persistence.
- P3: frontend, merchant and receptionist screens, seed merchant-offer dataset in coordination with the merchant, demo operation and screen capture.
- Shared: API schemas and end-to-end test. One named owner makes the actual edit; others review.

---

## 3. Open the repository and establish a safe baseline

Use the v5 ZIP as the starting point. Do not overwrite it. Extract to a working folder, initialise Git if needed, and make a baseline commit before AI agents edit files.

### Windows PowerShell

```powershell
# Go to the folder where the ZIP is saved
Set-Location $HOME\Desktop

# Extract into a new working directory
Expand-Archive -Path .\revenuemate-revised-architecture-v5-product-intelligence.zip `
  -DestinationPath .\RevenueMate-v5-work -Force

Set-Location .\RevenueMate-v5-work\revenuemate

# Inspect the current state
Get-Content .\README.md
Get-Content .\ARCHITECTURE.md
Get-Content .\docs\product-intelligence.md
Get-Content .\docs\data-provenance.md
Get-Content .\docs\P1_CONTEXT.md
Get-Content .\docs\api-contract.md
Get-Content .\docs\statuses-and-events.md

# Establish a baseline commit
 git init
 git add .
 git commit -m "chore: preserve RevenueMate v5 scaffold baseline"
 git switch -c feature/ai-conversation-product-intelligence
```

If the project is already in Git, do not run `git init`; check `git status` and create a feature branch from the agreed team branch.

### 3.1 Validate the prepared reference databases

```powershell
python --version
python .\data\reference\validate_reference_databases.py
```

The v5 archive includes these populated local datasets:

- `laptop_reference.sqlite`: sources, product families, product variants, product facts, family profiles and an empty merchant-offers table.
- `hardware_knowledge.sqlite`: sources, components, component facts and product-component links.

Do not regenerate or rewrite these databases during the hackathon unless a specific data defect is found. Treat them as read-only inputs for the demo.

### 3.2 Do not trust the bootstrap files yet

In the supplied ZIP, `backend/requirements.txt`, `frontend/package.json`, `Makefile`, many Python modules and frontend files are still prompts/placeholders. The README itself says the scaffold is not a completed app. Have P1 generate a real backend dependency file/config/database bootstrap and P3 generate a runnable frontend package before trying to run the whole app.

Do not waste time troubleshooting `make install` or `pip install -r backend/requirements.txt` until P1 has replaced the prompt-only dependency file with a real requirements list.

### 3.3 Create `.env` only after the config owner confirms the fields

Start in mock mode:

```env
MESSAGING_PROVIDER=mock
PAYMENT_PROVIDER=mock
LLM_API_KEY=your_key_in_local_env_only
LLM_MODEL=sarvam-105b
```

The exact environment variable names must match the implemented settings. Keep `.env` out of Git. Never paste a live key into a coding-agent prompt, source file, screenshot, deck or terminal transcript that will be shared.

---

## 4. How to work with your AI coding agent

Use one coding agent as the implementation agent for your branch. You can use a second agent as a **read-only reviewer**, but do not let two agents edit the same files simultaneously.

### 4.1 Global instruction to paste into the coding agent

```text
You are the senior Python/FastAPI AI engineer implementing RevenueMate v5.

Before editing, read:
- README.md
- ARCHITECTURE.md
- docs/P1_CONTEXT.md
- docs/statuses-and-events.md
- docs/api-contract.md
- docs/product-intelligence.md
- docs/data-provenance.md
- data/reference/README.md

The v5 architecture and project overview are authoritative. Some old files describe
an earlier lead/draft pipeline. Do not build a duplicate legacy pipeline.

Rules:
1. Work only on the exact files I assign in each task.
2. First inspect the existing repository and imported interfaces. Never assume a
   placeholder file is implemented.
3. Before coding, state the file plan, dependencies, assumptions and tests.
4. Do not change unrelated files or rewrite the architecture.
5. Use typed Pydantic schemas and type hints. Add focused unit tests.
6. Keep reference product facts separate from tenant-owned merchant offers/inventory.
7. Exact variant only. Exclude family-only and recommendation_eligible=false records
   from exact-variant recommendation/transaction paths.
8. Every used product fact must retain its source IDs/provenance and uncertainty.
9. Unknown/null is not zero, unavailable, or out of stock. Do not fill missing values.
10. LLM parses, asks, explains and compares. Deterministic services filter candidates
    and validate merchant offer, price and stock.
11. AI modules must not write database records, reserve stock, create payment links,
    mark a payment successful, or call messaging/payment adapters directly.
12. No invented benchmark, battery runtime, performance rank, warranty, price or stock.
13. Do not add vector search, agents, dependencies or abstractions unless required by
    the accepted task.
14. Handle provider errors and timeouts without unsafe retries.
15. Run the listed tests and report the exact commands/results. Do not claim tests ran
    if they did not.

For this task, output: (a) changed files, (b) implementation summary, (c) API/data
contract, (d) tests run and results, (e) known gaps. Stop if a required interface is
missing; ask for its contract rather than inventing it.
```

### 4.2 Read-only repository audit prompt

Run this first. Do not allow code edits until you have the report.

```text
Audit the current RevenueMate v5 repository. Do not edit any files.

1. Identify which Python/TypeScript files contain working code, which are prompt-only
   placeholders, and which are TODO stubs.
2. Search imports and route registrations to identify any dependencies on legacy
   parser.py, scorer.py, drafter.py or draft_service.py.
3. List the exact files that must be implemented for the v5 buyer conversation flow.
4. Inspect the SQLite table schemas and confirm how exact laptop variants, product
   facts, sources, components and product-component links are represented.
5. Identify the existing Pydantic schemas and API contracts that P2 must use.
6. Report configuration/bootstrap blockers (requirements.txt, package.json, Makefile,
   .env.example, main.py and database startup).
7. Give me a dependency-ordered plan limited to my ownership: AI, reference retrieval,
   messaging and buyer-facing automation.

Return facts with file paths and line numbers. Do not guess. Do not change files.
```

### 4.3 The one-task-at-a-time implementation loop

For every task:

1. Paste the global rules and relevant docs.
2. Assign one module or one small cohesive group of modules.
3. Ask the agent for its plan before code.
4. Review the proposed contract and assumptions.
5. Let it implement only the assigned files.
6. Run the exact test command yourself.
7. Inspect the diff with `git diff`.
8. Commit a working checkpoint before the next task.

Do not ask: “Build the complete RevenueMate app.” That encourages broad rewrites, invented contracts and unreviewed code.

---

## 5. Implementation sequence — follow in this order

## Step 1 — Get the LLM client working

**Primary file:** `backend/app/ai/llm_client.py`  
**Owner:** You  
**Dependency:** P1 must make the config/bootstrap imports available.

The project overview proposes Sarvam LLM. For tomorrow, use one model/provider path first. Do not build provider switching unless the first call is stable.

Current Sarvam docs list `sarvam-105b` on `POST https://api.sarvam.ai/v1/chat/completions`. Authentication uses the `api-subscription-key` header. The chat API supports structured JSON outputs through `response_format` with JSON Schema. Confirm the model/key/credits in the Sarvam dashboard before the event.

**Prompt for your coding agent:**

```text
Implement only backend/app/ai/llm_client.py and its focused tests.

Use httpx and the Sarvam Chat Completions API. Read the current official Sarvam
Chat Completion API and authentication documentation before choosing request fields.
Use the configured LLM_API_KEY and LLM_MODEL. For the Sarvam endpoint, authenticate
with api-subscription-key. Do not log request secrets or full customer conversation
payloads.

Expose:
- class LLMUnavailable(Exception)
- complete(system: str, user: str, json_schema: dict | None = None,
          timeout: float = 20) -> str

Requirements:
- Send a system and user message.
- Support structured output with response_format=json_schema when a schema is passed.
- Parse the documented response shape and return only assistant message content.
- Apply timeout and convert network/provider/invalid-response errors to LLMUnavailable.
- Do not retry non-idempotent actions; this client only performs generation.
- Keep the client injectable/mockable for tests.
- Do not hardcode secrets.

Tests: successful text response, structured JSON response, timeout, HTTP error,
malformed provider response and missing key. Do not call the live provider in unit tests.
```

**Manual check:** Make one real provider call using a local-only key. Confirm a short reply and a JSON-schema-constrained reply. If it fails, switch to a mock LLM implementation and continue building; do not spend more than 10–15 minutes debugging account/credit/network issues.

**Done when:** a provider call returns content, errors map to `LLMUnavailable`, and tests use a fake HTTP transport or mocked client.

## Step 2 — Implement reference-database retrieval

**Primary file:** `backend/app/product_intelligence/retrieval.py`  
**Coordinate with:** P1's `product_search_service.py` and `product_knowledge_service.py`.

Use SQLite read-only connections. Use parameterised SQL. Resolve database paths from repository configuration, not the current working directory. Return source IDs and source metadata with every fact.

Known v5 table names include:

- Laptop DB: `product_variants`, `product_families`, `product_facts`, `family_profiles`, `sources`, `merchant_offers`.
- Hardware DB: `components`, `component_facts`, `product_component_links`, `sources`.

**Prompt for your coding agent:**

```text
Implement only backend/app/product_intelligence/retrieval.py and tests.

Read docs/product-intelligence.md, docs/data-provenance.md and
 data/reference/README.md. Inspect the actual SQLite schemas before writing SQL.

Provide read-only functions for:
1. search_exact_laptop_variants(query/criteria) with product_id, brand, product_name,
   exact model/part number, variant_precision, recommendation_eligible and status.
2. get_laptop_variant(product_id) with structured facts and unknown_fields.
3. get_product_fact_evidence(product_id) returning fact_path, value, verification_status,
   source_ids and resolved source metadata (publisher/title/URL/retrieved_on/scope).
4. get_linked_components(product_id) with component type/name and sourced component facts.

Requirements:
- Open both SQLite databases read-only.
- Use parameterised queries and close connections safely.
- Preserve exact product_id/model code; never merge sibling variants.
- Preserve null/unknown and verification status.
- Include source provenance with each returned fact.
- Family-only profiles and recommendation_eligible=false records must be flagged and
  excluded from exact-variant recommendation results.
- Never treat merchant_offers in the shared reference DB as seeded live shop inventory.
- Do not call the LLM, web search, or write to either database.

Tests: exact product retrieval, unknown product ID, family-only exclusion, unknown fact,
source metadata linkage, component links and read-only behavior.
```

**Done when:** you can retrieve one exact product and its component facts offline, with source IDs/URLs and unknown fields intact.

## Step 3 — Implement buyer intent and preference extraction

**Primary file:** `backend/app/ai/intent_parser.py`  
**Output:** a validated `BuyerCriteria` object.

Extract two kinds of requirements:

- **Hard constraints:** maximum budget, minimum RAM/storage, required OS, display-size bounds, discrete GPU required, required ports or other must-haves.
- **Soft preferences:** battery life, light weight, display quality, keyboard, portability, coding, editing or gaming use case.

Also store whether a value came from the latest user message, earlier conversation context, or merchant/system configuration. Do not silently convert an inferred preference into a confirmed preference.

Suggested output contract (adapt to existing schemas):

```json
{
  "intent": "product_discovery",
  "budget_max_paise": 6000000,
  "workloads": ["programming", "docker"],
  "hard_constraints": {"os": null, "min_ram_gb": null, "discrete_gpu_required": false},
  "soft_preferences": {"battery": "important", "weight": null},
  "confirmed_fields": ["budget_max_paise", "workloads", "battery"],
  "missing_critical_fields": [],
  "needs_clarification": false,
  "clarifying_question": null,
  "confidence": 0.0
}
```

`6000000` paise represents ₹60,000. This is an illustrative scenario value; use the team's agreed demo budget. Never interpret missing budget as zero.

**Prompt for your coding agent:**

```text
Implement only backend/app/ai/intent_parser.py, the minimum required Pydantic schema
(if not already present), and focused tests.

Build parse_buyer_message(message, conversation_context) -> BuyerCriteria using the
LLM client and strict structured output.

Extract hard constraints separately from soft preferences. Preserve provenance for
fields (current message, previously user-confirmed, inferred/uncertain). Identify the
buying intent and missing critical information. Return one concise clarifying question
only when it materially affects product filtering or recommendation.

Do not:
- Invent budget, OS, RAM, storage, model or price.
- Treat product names mentioned by the user as verified catalogue IDs.
- Convert inferred preferences to confirmed constraints.
- Query databases or make recommendations in this module.
- Execute order, reservation, payment or messaging actions.

Validate numeric values, normalise currency to integer paise, constrain enum values,
and handle malformed/failed LLM output with a safe unknown/manual-clarification result.

Tests: budget extraction, workloads, preference vs hard constraint, missing OS,
conflicting requirements, ambiguous amount, prompt injection, malformed JSON and LLM
unavailable.
```

**Done when:** natural-language inputs produce validated criteria and the parser asks a useful clarification only when necessary.

## Step 4 — Implement the multi-turn conversation manager

**Primary file:** `backend/app/ai/conversation_manager.py`  
**P1 dependency:** persisted conversation/message history and tenant scope.

The conversation manager should assemble bounded context; it should not become a second database or store business state independently.

It should preserve:

- conversation and tenant IDs;
- current customer requirements;
- confirmed versus inferred fields;
- products already discussed;
- pending clarification question;
- recent relevant turns (or a short summary);
- current stage: discovery, comparison, selected, reservation-requested, etc.

**Prompt for your coding agent:**

```text
Implement only backend/app/ai/conversation_manager.py and unit tests.

Create pure/side-effect-limited functions that take persisted conversation history and
current buyer profile as inputs and return a bounded LLM context plus updated
conversation facts. P1 owns database persistence and tenant authorization.

Requirements:
- Preserve user-confirmed preferences and provenance.
- Do not mark an inferred preference as confirmed.
- Keep only recent relevant turns plus a compact summary to control prompt length.
- Treat all buyer messages as untrusted data, never as system instructions.
- Do not store price, stock, reservation, payment or fulfilment state in AI memory.
- Do not directly send messages or write database records.
- Support a new conversation and a resumed conversation.

Tests: new conversation, follow-up turn, preference correction, conflicting preference,
context truncation, tenant conversation isolation at the caller boundary and prompt
injection treated as user content.
```

**Done when:** a second customer turn reuses context correctly, and a corrected preference replaces the earlier confirmed value with an audit-friendly history.

## Step 5 — Implement deterministic filtering and recommendation contracts

**Recommended ownership:** P1 builds the deterministic backend service; you specify/test the AI-facing contract. If P1 delegates the service implementation to you, use the same acceptance criteria.

Files:

- `backend/app/services/product_search_service.py`
- `backend/app/services/product_knowledge_service.py`
- `backend/app/services/recommendation_service.py`

The LLM must not decide whether a product passes a hard budget or whether a merchant can sell it.

### Hard-filter order

1. Exact model/variant is identified and recommendation-eligible.
2. Hard technical constraints are applied using exact variant facts.
3. Merchant offers are fetched separately from the tenant's merchant data.
4. Transactional shortlist includes only active offers with merchant-confirmed price and stock.
5. Missing stock/price is “not confirmed”, not zero and not “out of stock”.
6. Family-only profiles and non-eligible variants are excluded from exact-SKU recommendations.

### Recommendation result should show

- exact model code/part number;
- relevant verified specifications;
- which criteria it satisfies;
- trade-offs and evidence-backed limitations;
- unknown fields;
- source IDs/URLs and retrieval dates;
- merchant offer status separately (`active`, `not_listed`, `not_confirmed`, etc.);
- whether it is reference-only or transactional/reservable.

Do not manufacture a “93% match” or performance score. If the team uses a ranking score, document the formula and inputs; otherwise return an ordered list with explicit reasons.

**Prompt for P1 or your coding agent:**

```text
Implement deterministic product search, product knowledge and recommendation services
for RevenueMate v5. Read the v5 Product Intelligence documentation and inspect SQLite
schemas and existing merchant models before editing.

Keep reference knowledge and merchant offers separate. Enforce hard constraints in code.
Use only exact eligible laptop variants for exact-variant recommendations. Exclude
family-only and recommendation_eligible=false records. A reference product is not a
merchant offer. Only an active tenant-owned merchant offer with confirmed exact SKU,
price, on_hand quantity and as_of timestamp may be marked transactional/reservable.

Return evidence and unknown fields with every candidate. Do not generate unsupported
benchmarks, battery runtime, performance rankings or compatibility claims. Do not call
an LLM in the deterministic service.

Add tests for budget filter, missing budget, exact variant, family-only exclusion,
merchant offer absent, inactive offer, zero stock, unknown stock, stale offer and source
provenance. Do not create merchant data from the reference database.
```

**Done when:** the service can return reference-only product explanations while refusing to expose a product as reservable without an active merchant offer.

## Step 6 — Build the recommendation agent/orchestrator

**Primary file:** `backend/app/ai/recommendation_agent.py`  
**Purpose:** coordinate the modules; do not let it perform raw SQL or transactions.

Recommended flow:

1. Receive buyer message plus bounded conversation context.
2. Parse the intent and constraints.
3. If important data is missing, return one clarification question.
4. Call deterministic product retrieval and fact services.
5. Call deterministic hard filters/recommendation service.
6. If no merchant offer exists, explain that results are reference-only and cannot be reserved.
7. Ask response generator to explain the verified candidates and trade-offs.
8. Return a typed response and evidence list to the conversation service.

**Prompt for your coding agent:**

```text
Implement only backend/app/ai/recommendation_agent.py and focused unit tests.

The agent is an orchestrator, not an autonomous tool-executing agent. It may call the
intent parser, product search/knowledge services, deterministic recommendation service
and response generator through their agreed interfaces.

It must:
- ask a clarification question when a missing hard constraint prevents a safe shortlist;
- retrieve exact model facts and relevant component facts;
- apply deterministic filters before asking the LLM to explain candidates;
- keep merchant offer status separate from technical reference knowledge;
- label reference-only candidates clearly;
- set transaction_allowed=false unless a valid active merchant offer exists;
- return evidence IDs and warnings.

It must not:
- write to merchant catalogue or reference databases;
- create orders/reservations/payment links;
- reserve stock or change payment/fulfilment states;
- send WhatsApp messages;
- invent candidate data or match family-only products as exact SKUs.

Test: clarification path, candidate path, no-candidate path, reference-only path,
merchant-offer path, service failure and LLM unavailable.
```

**Done when:** one function call returns either a helpful clarification, a source-backed shortlist, or a clear no-match result.

## Step 7 — Implement the buyer-facing response generator and guardrails

**Primary file:** `backend/app/ai/response_generator.py`  
**Possible compatibility file:** `ai/guardrails.py` if the team decides to reuse it.

The answer should sound like a knowledgeable retail salesperson, not like a database dump. But every technical statement must trace back to retrieved evidence.

A comparison response should include:

- exact model/variant;
- relevant specifications for this customer's use case;
- why it fits;
- trade-offs;
- unknown/missing facts;
- reference-only versus merchant-confirmed status;
- source references available to the dashboard/judges.

Special facts to protect:

- Battery Wh is capacity, not battery runtime.
- CPU boost frequency is not sustained frequency.
- CPU component capability does not prove the laptop's exact port, power, thermal or memory configuration.
- GPU name alone is not enough to claim performance; laptop TGP matters.
- “Up to” values are not automatically the exact variant's delivered configuration.

**Prompt for your coding agent:**

```text
Implement only backend/app/ai/response_generator.py and focused tests.

Input: buyer criteria, deterministic recommendation result, exact product facts,
component facts, source evidence and merchant-offer status.
Output: concise natural-language reply plus structured evidence/warnings/next action.

Use the LLM only to explain facts that are present in the input. Keep unknown fields
unknown. Never invent model specifications, prices, stock, battery hours, benchmarks,
warranty or compatibility. Never describe a reference-only product as available in the
shop. Avoid unsupported words like “best”, “fastest” or “all-day battery”.

Return structured output with reply_text, candidate_ids, evidence_ids, warnings,
merchant_offer_status, needs_clarification and transaction_allowed. Validate the
response with Pydantic and a deterministic fact/claim guardrail. If validation fails or
the LLM is unavailable, return a safe template built from trusted facts, or a manual
follow-up response.

Tests: missing spec, wrong price claim, fabricated stock, unsupported runtime,
family-only candidate, source missing, prompt injection and model timeout.
```

**Done when:** the generator cannot turn a null value into a confident statement and has a non-LLM fallback.

## Step 8 — Build messaging adapters and automation handoff

**Files:**

- `backend/app/adapters/messaging/base.py`
- `backend/app/adapters/messaging/mock.py`
- `backend/app/adapters/messaging/whatsapp.py`

### 8.1 Mock messaging first

Implement the interface before the real provider:

```python
send_message(to, text, idempotency_key) -> SendResult
send_owner_prompt(owner_contact, action_id, text) -> SendResult
parse_inbound(payload) -> InboundMessage | None
```

The mock adapter should store a local message record with recipient, type, body, status, provider/message ID and timestamp. Include a timeout switch. A timeout must return `uncertain`; it must not silently retry.

**Prompt for your coding agent:**

```text
Implement backend/app/adapters/messaging/base.py and mock.py plus focused tests.

Define a typed MessagingAdapter interface and typed SendResult/InboundMessage schemas
using the existing project schemas if they match the contract.

Mock adapter requirements:
- send_message records the simulated outbound message and returns status sent/mock;
- send_owner_prompt records the merchant approval request;
- parse_inbound handles only the agreed test payload shape;
- a simulated network timeout returns uncertain and does not retry;
- no database state changes occur inside the adapter;
- the adapter never decides whether an approval/action is authorised.

Tests: send success, owner prompt, inbound text, unsupported event, timeout uncertain,
and no duplicate send when the same idempotency key is submitted to the owning workflow.
```

The idempotency enforcement belongs to P1's workflow/approval service, not only to the adapter.

### 8.2 Real WhatsApp only after mock flow works

The v5 prompt expects WhatsApp Cloud API. It requires current Meta documentation to be checked before coding provider payloads. The current Meta overview documents the Cloud API messages endpoint pattern as:

`POST https://graph.facebook.com/<API_VERSION>/<PHONE_NUMBER_ID>/messages`

Meta webhooks require an HTTPS endpoint. Webhook verification uses the configured verify token/challenge flow, and notifications include `X-Hub-Signature-256` for payload signature validation. Use the current WhatsApp-specific webhook documentation for the exact payload shape and fields; do not copy a generic Graph API example as a WhatsApp event schema.

**Do not implement live WhatsApp merely because a token exists.** Verify that:

- WhatsApp Business app/account and phone number are configured;
- the test recipient is permitted/allow-listed in the current setup;
- the API's customer-service window/template rules are respected;
- a public HTTPS tunnel reaches the correct local endpoint;
- signature verification and duplicate webhook handling work;
- a real message is received and a real reply is observed.

If any item is missing, keep `MESSAGING_PROVIDER=mock` and show the mock adapter honestly in the demo.

### 8.3 Your automation boundary

Your AI agent may suggest the next step. The backend workflow service executes it after authorisation.

- AI can return `recommended_action = ask_clarification`, `show_comparison`, `request_merchant_approval` or `offer_reservation`.
- AI must not itself call reservation/payment/handover endpoints.
- Merchant approval must be recorded by the backend.
- Reservation approval must call P1's atomic stock service.
- Payment messages must use the order's exact backend amount.
- Payment success must come only from P1's verified provider state.
- Receptionist handover is a restricted fulfilment action, never a chatbot inference.

Your messaging layer should format and send the events that P1's workflow service has authorised: recommendation, clarification, reservation pending/approved/rejected, pickup instructions, payment link, payment verified and handover completion.

**Done when:** mock message send, merchant approval handoff and reservation/payment status notifications work end to end without the AI mutating transactional state.

---

## 6. Integration checkpoints with P1 and P3

Do not wait until the end to connect everything.

### Checkpoint A — After intent parser

Give P1 a sample `BuyerCriteria` JSON and agree on how it maps to product-search service parameters. Give P3 the fields the UI should display: budget, workload, hard constraints, preferences and clarifying question.

### Checkpoint B — After deterministic retrieval

Show P1 one exact product response with source evidence and one family-only/non-eligible product that is rejected. P3 should display source/provenance and reference-only status, not fabricate an availability badge.

### Checkpoint C — After recommendation agent

Connect the `POST /conversations/{id}/messages` flow. The API should return the assistant reply and structured candidates. The dashboard should show the same candidates/evidence for merchant review.

### Checkpoint D — After messaging mock

Send the same approved response through the mock adapter. Confirm the UI can distinguish mock/simulated from real sent/delivered status.

### Checkpoint E — Transaction workflow

P1 owns order/reservation/payment/fulfilment state. You provide message templates and trigger mapping. P3 shows merchant approval and receptionist lookup. Confirm these exact endpoints exist before frontend integration:

- `POST /orders`
- `POST /orders/{id}/request-reservation`
- `POST /orders/{id}/approve-reservation`
- `GET /reservations/lookup/{reservation_code}`
- `POST /reservations/{id}/ready-for-pickup`
- `POST /orders/{id}/payment-link`
- `POST /orders/{id}/complete-pickup`

If any endpoint is unavailable, do not build a fake button that pretends it worked. Agree a documented mock endpoint or present the incomplete step as a limitation.

---

## 7. Test plan — run these before rehearsing

### AI/Product Intelligence tests

1. Budget extraction converts ₹60,000 to `6000000` paise.
2. Coding, Python, VS Code and Docker are recognised as workload/context, not specifications.
3. A missing critical preference triggers one focused question if it changes the result.
4. Exact eligible variants are retrieved with the correct model code.
5. Family-only or non-eligible variants do not appear as exact recommendations.
6. Product facts retain `source_id`, publisher, URL and retrieval date.
7. Missing facts remain null/unknown.
8. A component family fact is not misrepresented as an exact laptop configuration.
9. No merchant offer means reference-only; no reserve action.
10. An inactive, stale or zero-stock merchant offer cannot be reserved.
11. A prompt-injection message cannot override the system instructions.
12. LLM timeout returns a safe fallback and does not lose the customer enquiry.
13. A generated response cannot insert a made-up benchmark, runtime, price or stock value.

### Messaging tests

1. Inbound text parses into sender and message.
2. Delivery/read receipts are not treated as buyer messages.
3. Mock outbound returns a simulated status.
4. Timeout returns `uncertain`, not `failed` by assumption.
5. Duplicate webhook is deduplicated by P1.
6. No message is sent before the required merchant approval.
7. The adapter does not retry uncertain sends blindly.

### End-to-end test

Run the same single test scenario from WhatsApp/mock inbound through recommendation, merchant decision, order, reservation, payment verification and pickup handover. Verify the audit trail and state values after every step.

### Commands

Use the commands that the team actually implements. The scaffold's `requirements.txt`, `package.json` and `Makefile` are prompt-only placeholders until replaced.

Once P1 has generated a real backend dependency file and bootstrap:

```powershell
# From repository root
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r .\backend\requirements.txt

# Once database and app bootstrap exist
cd .\backend
pytest -q
uvicorn app.main:app --reload --port 8000
```

Once P3 has generated a valid frontend package:

```powershell
cd .\frontend
npm install
npm run dev
```

Use separate terminals for API and frontend. Do not run database migrations/seed commands until P1 confirms the implementation and safe demo data.

---

## 8. Suggested day plan (relative blocks; adapt to the organiser's actual timetable)

The uploaded materials identify 15 November as the build day but do not provide a verified start/end or judging timetable. Use this as an **example eight-hour allocation**, not an official event schedule. If the available build window is shorter, protect the P0 path and cut the stretch work.

| Time from build start | Your task | Checkpoint |
|---|---|---|
| 0:00–0:15 | Team contract, scenario, file ownership, merchant offer truth | Contracts frozen |
| 0:15–0:35 | Extract repo, Git baseline, audit, validate databases | Clean working branch |
| 0:35–1:05 | LLM client and live/mock smoke test | LLM call or fallback works |
| 1:05–1:45 | SQLite reference retrieval | Exact product + source facts returned |
| 1:45–2:25 | Intent parser | Structured buyer constraints |
| 2:25–2:55 | Conversation manager | Multi-turn preferences retained |
| 2:55–3:45 | Deterministic product filtering + recommendation contract | Eligible/reference-only distinction works |
| 3:45–4:25 | Recommendation orchestration + response generator | Grounded shortlist/clarification |
| 4:25–5:05 | Mock messaging and event mapping | Approved reply simulated correctly |
| 5:05–5:55 | Integrate conversation API/dashboard and P1 transaction events | One integrated path |
| 5:55–6:40 | Failure tests, seed data validation, end-to-end rehearsal | Stable build and fallback |
| 6:40–7:20 | Update slides, demo script and Q&A | Deck matches build |
| 7:20–8:00 | Final rehearsal and freeze | Pitch/demo ready |

### If time is cut short

**Must protect:** intent extraction, reference retrieval, deterministic filtering, grounded response, mock messaging, truthful stock/offer state and one complete demo path.  
**Cut first:** live WhatsApp, web research/crawler, vector database, voice, delivery workflow, analytics, extra languages and advanced follow-up automation.

Do not cut merchant approval, reservation correctness, payment verification or fulfilment permissions merely to make the demo look complete.

---

## 9. Prepare the final demo

### 9.1 Demo roles

- **Buyer:** sends WhatsApp or mock inbound messages.
- **Merchant:** reviews product recommendations and approves reservation.
- **Receptionist:** looks up reservation code, prepares product, sees verified/mock payment status and confirms handover.

### 9.2 Demonstration sequence

1. Buyer asks for a laptop for programming within the agreed budget.
2. RevenueMate asks a relevant clarification if required.
3. AI extracts requirements and retrieves exact model variants.
4. Dashboard displays comparison with relevant specs, source evidence, trade-offs and unknown fields.
5. The system separately displays merchant offer/stock status.
6. Merchant approves the selected offer/reservation request.
7. Backend allocates stock atomically and produces a reservation code.
8. Buyer receives the reservation confirmation and pickup instructions.
9. Receptionist searches the code in the restricted fulfilment view.
10. Buyer requests a payment link; backend creates it for the exact order amount.
11. Buyer completes the mock/sandbox payment.
12. Backend verifies the payment status/amount; receptionist sees the correct status.
13. Receptionist confirms physical handover.
14. Buyer receives completion confirmation; audit trail shows the transaction events.

### 9.3 Fallback ladder

1. **Live WhatsApp works:** use it, but keep the mock path ready.
2. **WhatsApp fails:** use mock messaging/API dashboard flow and explain the adapter boundary.
3. **LLM fails:** use deterministic test fixtures or a safe template; disclose that the LLM path is unavailable in that run.
4. **Network fails:** use local databases, seeded scenario and pre-recorded fallback.
5. **Merchant offer is missing:** demonstrate comparison as reference-only and do not reserve. If you prepared a simulated demo offer, label it as simulated.
6. **Payment provider is mocked:** explicitly say sandbox/mock payment; never claim live Paytm integration.

Freeze feature changes before the final rehearsal. Keep one known-good Git commit and a backup recording.

---

## 10. Your pitch: update the old deck for v5

Keep the existing eight-slide structure if that is the agreed team format, but update the story so it matches v5. You are the presenter; P3 can operate the dashboard and receptionist screen.

| Slide | Updated message | What to show/say |
|---|---|---|
| 1. RevenueMate | From first message to final handover | Conversational commerce and retail operations assistant |
| 2. Problem | Buyers need advice; merchants juggle catalogue, stock, messages and fulfilment | Explain the broken journey, not unverified market statistics |
| 3. Solution | Understand → retrieve → compare → validate offer → reserve → fulfil | One connected buyer journey |
| 4. Product Intelligence | Two sourced offline databases | Laptop reference facts, hardware components, sources and unknowns |
| 5. Architecture | LLM + deterministic services + merchant data + messaging adapters | Explain that AI does not own stock/payment/order state |
| 6. Trust and reliability | Exact variants, provenance, approval, idempotency and role restrictions | Show unknown values and mock/live labels honestly |
| 7. Live demo | One buyer transaction through Reserve & Collect | Make the judges watch one complete journey |
| 8. Business/roadmap/ask | Pilot one merchant, measure workflow outcomes, expand later | Pilot access, merchant data and provider guidance |

### Suggested 30-second opening

“Imagine a customer walks into—or messages—a laptop shop and says, ‘I need a laptop for programming, but I don't know which one to choose.’ Today, the merchant has to understand the need, search technical specifications, check local stock, explain trade-offs, reserve the product and coordinate payment and collection across separate tools. RevenueMate brings that journey together. It uses AI to understand and explain, verified product knowledge to ground recommendations, and deterministic backend services to control stock, reservations and payments.”

### Suggested technical explanation

“Our AI does not make up the business facts. It interprets what the buyer needs, retrieves exact-variant specifications and explains trade-offs. Deterministic services apply hard constraints and separately check merchant offers. The merchant approves configured actions, and backend services own stock allocation, payment verification and fulfilment. That boundary is what makes this useful for real commerce rather than just a chatbot.”

### Judge questions you must be able to answer

**How is this different from a chatbot?**  
It manages a multi-turn product discovery and retail transaction workflow, not isolated Q&A.

**How do you prevent hallucinations?**  
The LLM only explains retrieved facts. Exact variants, source provenance, unknown fields, merchant offers and transactional permissions are validated outside the model.

**How do you know the laptop is in stock?**  
Only a merchant-owned active offer and fresh stock record can establish that. The public/reference product database cannot.

**What if the product data is incomplete?**  
The system preserves the unknown field, discloses it and asks for clarification/merchant confirmation rather than guessing.

**Does the model decide which product is best?**  
No universal “best” claim. Deterministic hard filters and documented customer preferences produce candidates; the LLM explains fit and trade-offs.

**Can the AI reserve the last laptop?**  
No. The backend reservation service performs an atomic allocation after merchant approval and prevents overselling.

**Can the AI say the payment is successful?**  
No. Only backend verification of the provider status/signature, order reference, amount and currency can mark it successful.

**Is WhatsApp/Paytm live?**  
State the exact implementation: live-tested WhatsApp, mock WhatsApp, sandbox/mock payment or live provider verification. Never blur these states.

**How will you measure impact?**  
Use a merchant pilot to measure response time, enquiry-to-reservation conversion, follow-up completion, reservation expiry/release and duplicate action rate. Do not claim uplift without pilot results.

---

## 11. Final personal checklist

### Before coding

- [ ] I am working from the v5 ZIP, not the old scaffold.
- [ ] I have read the v5 architecture, product-intelligence, provenance and API documents.
- [ ] P1/P3 and I agreed on the demo scenario and exact budget.
- [ ] Every file has one owner.
- [ ] We resolved whether merchant inventory is real or clearly simulated.
- [ ] Git baseline and my feature branch exist.
- [ ] Reference database validation passes.
- [ ] LLM and messaging keys remain in local environment variables only.

### Before integration

- [ ] LLM client works or mock fallback works.
- [ ] Intent parser returns validated constraints.
- [ ] Conversation context works across turns.
- [ ] Exact variants and source evidence retrieve from SQLite.
- [ ] Family-only/non-eligible variants are excluded.
- [ ] Merchant offers are separate from reference data.
- [ ] Hard filters are deterministic.
- [ ] Recommendation output shows trade-offs and unknowns.
- [ ] Response generator cannot invent price/stock/specifications.
- [ ] Mock messaging works and timeout is uncertain/no blind retry.
- [ ] AI cannot create reservation/payment/handover directly.

### Before pitching

- [ ] Every feature shown is actually implemented.
- [ ] Every mock/sandbox action is labelled.
- [ ] The demo has one complete happy path.
- [ ] The fallback recording/local path is ready.
- [ ] I can explain the two databases and the merchant-offer boundary.
- [ ] I can explain why the LLM is advisory and the backend controls transactions.
- [ ] Slide claims contain no invented statistics or production-integration claims.
- [ ] I have rehearsed the full sequence and judge Q&A.

---

## 12. Official technical references to keep open

Use official provider docs rather than allowing a coding agent to guess provider payloads:

- Sarvam authentication: https://docs.sarvam.ai/api-reference/authentication
- Sarvam Chat Completion API: https://docs.sarvam.ai/api/token-factory/chat-completions
- Sarvam Chat Completion V1 reference: https://docs.sarvam.ai/api-reference/chat/chat-completions-v1
- Meta WhatsApp Business Platform overview: https://developers.facebook.com/documentation/business-messaging/whatsapp/overview/
- Meta Webhooks getting started: https://developers.facebook.com/docs/graph-api/webhooks/getting-started/
- Meta WhatsApp Cloud API documentation: https://developers.facebook.com/docs/whatsapp/cloud-api/

For Sarvam, the current documentation describes `sarvam-105b` on `/v1/chat/completions`, with the `api-subscription-key` header and structured output support. Confirm current model availability, credits and response schema before coding. For WhatsApp, check the current Graph API version and WhatsApp-specific webhook schema before implementation.

---

## Final rule for the day

**Build one trustworthy customer journey, not a collection of impressive but disconnected AI features.**

Your strongest contribution is a conversational agent that understands a real buyer, compares exact sourced product variants, is honest about what the shop does and does not stock, and hands approved actions to backend services that safely complete the transaction. Then explain that design clearly to the judges.
