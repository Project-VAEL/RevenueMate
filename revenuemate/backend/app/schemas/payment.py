"""
backend/app/schemas/payment.py
Owner: P1
Purpose: Payment models and provider result types.
Depends on: schemas.common
Used by: payment_service, adapters.payments, api.payments

PROMPT:
Write only this file. Pydantic v2. Use ConfigDict(from_attributes=True) on every response
model. Money fields are integer paise.

Requirements:
- PaymentOut: id, lead_id, amount_paise, order_ref, provider, link_url, status
  (PaymentStatus), created_at, updated_at.
- CreateLinkRequest: amount_paise int | None (default None means product price times
  quantity).
- LinkResult (dataclass): link_url str | None, provider_ref str | None, status
  PaymentStatus. A timeout is status uncertain.
- PaymentStatusResult (dataclass): status PaymentStatus, found bool (False when the
  provider has no such order), provider_ref str | None, raw dict.

Do not:
- Include provider secrets or raw credentials in any model.

Done when: adapters and services can exchange LinkResult and PaymentStatusResult with no
extra parsing.

Context to paste first: docs/P1_CONTEXT.md, docs/statuses-and-events.md,
docs/api-contract.md, plus the headers of the files listed under Depends on.
"""
