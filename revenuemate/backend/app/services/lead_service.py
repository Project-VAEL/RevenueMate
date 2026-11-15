"""
backend/app/services/lead_service.py
Owner: P1
Purpose: Lead creation and reads.
Depends on: models, services.stock_service, services.state_machine,
  services.event_service, ai.parser, ai.scorer (P2), schemas
Used by: api.leads, api.webhooks, seed

PROMPT:
Write only this file.

Requirements:
- create_lead(db, tenant_id, customer_name, customer_contact, raw_text) -> Lead: insert
  the lead with status new, record lead_created, commit.
- Then call ai.parser.parse_enquiry(raw_text, catalogue) where catalogue is
  list_products_with_stock. Store product_id, quantity, intent, urgency, parse_confidence
  and record lead_parsed.
- Then call ai.scorer.score_lead(lead, signals) with signals = {has_product, in_stock,
  stock_is_stale, quantity, urgency}. Store priority_score, priority_reasons, rule_version
  and record lead_scored. Commit.
- Wrap the parser and scorer calls in try/except Exception. A failure records the event
  with the error in payload, leaves the fields empty, and never stops lead creation.
- get_lead_detail(db, tenant_id, lead_id) -> LeadDetail with product, latest draft and
  latest payment. list_leads(db, tenant_id) -> list[Lead] ordered by priority_score
  descending then created_at descending.
- Raise NotFoundError for an unknown lead or a lead of another tenant.

Do not:
- Call the messaging or payment adapters.
- Set lead.status directly.

Done when: creating a lead returns a saved lead with exactly the events lead_created,
lead_parsed and lead_scored, whether the AI layer works or raises.

Context to paste first: docs/P1_CONTEXT.md, docs/statuses-and-events.md,
docs/api-contract.md, plus the headers of the files listed under Depends on.
"""
