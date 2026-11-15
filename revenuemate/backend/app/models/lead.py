"""
backend/app/models/lead.py
Owner: P1
Purpose: Lead record.
Depends on: models.base, models.product
Used by: lead_service, state_machine, draft_service, payment_service

PROMPT:
Write only this file. Table name leads.

Requirements:
- Lead(Base, IdMixin, TenantMixin): customer_name String, customer_contact String,
  raw_text Text, product_id FK nullable, quantity Integer nullable.
- status String(32) default 'new' (values from docs/statuses-and-events.md),
  status_before_uncertain String(32) nullable.
- priority_score Integer default 0, priority_reasons JSON default list, rule_version
  String nullable.
- intent String nullable, urgency String nullable, parse_confidence Float nullable.
- Relationships (lazy select): product, drafts (ordered by created_at), payments (ordered
  by created_at). Index on (tenant_id, status).

Do not:
- Store status as a database enum; a plain String keeps SQLite and PostgreSQL identical.

Done when: a Lead can be created with only the required fields and loads its drafts and
payments.

Context to paste first: docs/P1_CONTEXT.md, docs/statuses-and-events.md,
docs/api-contract.md, plus the headers of the files listed under Depends on.
"""
