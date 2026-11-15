# Product Intelligence & Conversational Commerce

## User experience
The assistant behaves like an informed store salesperson: it asks useful clarification questions, translates natural-language requirements into structured constraints, compares products from the catalogue, explains trade-offs in plain language, and guides a selected item into reservation. It must never invent availability, price, features or compatibility.

## Retrieval sources
1. `laptop_reference.sqlite` — exact laptop models and OEM-published specifications.
2. `hardware_knowledge.sqlite` — component facts (CPU/SoC, GPU, memory, storage, display, battery, wireless) and model-component links.
3. Live merchant offers — only when explicitly added and verified by the merchant; this is separate from the reference catalogue.
4. Web research — fallback for missing/stale specification facts, restricted to OEM and authoritative component-vendor pages where possible. Persist source URL, retrieval time, scope and field-level evidence before using the fact.

## Two kinds of customer requirements
- Hard constraints: maximum price, minimum RAM/storage, screen size bounds, required OS, discrete GPU required, etc. Apply as deterministic filters.
- Preferences: long battery life, light weight, programming, editing, gaming, keyboard quality. Score only when evidence exists; do not invent a battery runtime or benchmark. Ask a follow-up when requirements conflict or critical facts are missing.

## Comparison output
Every recommendation should include: (a) exact model/part number, (b) verified specs relevant to the request, (c) source-backed fit rationale, (d) trade-offs, (e) unknowns, (f) merchant offer and stock status separately. Do not call a model “best” without a stated customer profile and comparable evidence.

## Confidence and uncertainty
- `verified`: exact model field directly appears in its OEM page.
- `component_reference`: silicon/component information from Intel/AMD/NVIDIA/Apple; does not guarantee identical laptop implementation.
- `family_only`: family-level data, not exact SKU; exclude from exact-variant recommendations.
- `unknown`: no source-backed value; keep null and say unknown.

## No-AI-writeback rule
An LLM may parse, explain, summarize and compare sourced facts. It may not populate or modify the reference database. Database writes require source URL, field-level evidence, retrieval date and validation.
