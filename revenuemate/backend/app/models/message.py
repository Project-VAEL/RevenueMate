"""
backend/app/models/message.py
Owner: P1
Purpose: Inbound and outbound messages.
Depends on: models.base, models.lead
Used by: approval_service, payment_service, idempotency

PROMPT:
Write only this file. Table name messages.

Requirements:
- Message(Base, IdMixin, TenantMixin): lead_id FK nullable indexed, direction String(8)
  ('inbound' or 'outbound'), recipient String nullable, text Text.
- status String(16): pending, sent, failed, uncertain, received. idempotency_key String
  nullable unique. provider_message_id String nullable.

Do not:
- Add attachments or media fields.

Done when: an outbound message can be saved as pending before any provider call, then
updated.

Context to paste first: docs/P1_CONTEXT.md, docs/statuses-and-events.md,
docs/api-contract.md, plus the headers of the files listed under Depends on.
"""
