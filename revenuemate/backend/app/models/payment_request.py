"""
backend/app/models/payment_request.py
Owner: P1
Purpose: Payment link and its status.
Depends on: models.base, models.lead
Used by: payment_service

PROMPT:
Write only this file. Table name payment_requests.

Requirements:
- PaymentRequest(Base, IdMixin, TenantMixin): lead_id FK leads.id indexed, amount_paise
  Integer, order_ref String unique, provider String, link_url String nullable,
  provider_ref String nullable.
- status String(16) default 'created' (values from docs/statuses-and-events.md),
  idempotency_key String unique, last_status_raw JSON nullable.

Do not:
- Store the Paytm merchant key or any secret.
- Use float for amounts.

Done when: two payment requests with the same order_ref or idempotency_key are rejected by
the database.

Context to paste first: docs/P1_CONTEXT.md, docs/statuses-and-events.md,
docs/api-contract.md, plus the headers of the files listed under Depends on.
"""
