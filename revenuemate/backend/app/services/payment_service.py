"""
backend/app/services/payment_service.py
Owner: P1
Purpose: Payment link creation and verification.
Depends on: models, services.state_machine, services.idempotency, services.event_service,
  adapters.registry, schemas.payment, services.errors
Used by: api.leads, api.payments, api.webhooks

PROMPT:
Write only this file. This is where the no-duplicate and verified-only guarantees for
payments live.

Requirements:
- create_link(db, tenant_id, lead_id, amount_paise=None) -> PaymentRequest. The lead
  status must be sent or payment_requested, otherwise ConflictError. Amount defaults to
  product.price_paise times (quantity or 1); raise ConflictError when there is no product.
- n = number of existing payment requests for the lead plus 1; order_ref =
  f'RM-{lead.id[:8]}-{n}'; key = make_key('paylink', lead.id, n). Return the existing row
  if the key exists.
- Write-ahead: insert PaymentRequest status created with the key, commit, then call
  get_payments().create_link(order_ref, amount_paise, customer, key).
- Result created: store link_url and provider_ref, record payment_link_created, then send
  the link to the customer through get_messaging() with key make_key('sendlink',
  payment.id) using the same write-ahead Message pattern. When sent, set payment sent and
  transition the lead sent -> payment_requested (or payment_requested -> payment_requested
  for a new link).
- Any uncertain result (link creation or sending) sets the PaymentRequest to uncertain,
  and the Message too when sending was the uncertain step. It transitions the lead to
  uncertain with action_uncertain, commits, and stops. Never retry.
- verify(db, tenant_id, payment_id) -> PaymentRequest: call
  get_payments().get_status(order_ref). Save last_status_raw.
- found False on an uncertain payment: the provider never saw the order. Set payment
  failed, record payment_failed, move the lead back to its stored previous status, so a
  new link can be requested.
- found True on an uncertain payment: set the payment to the reported status, move the
  lead out of uncertain to payment_requested, then continue with the status rules below.
- status success: set payment success, transition the lead payment_requested -> paid
  (event payment_verified). Verifying a payment that is already success changes nothing
  and writes no second event.
- status failed or expired: update the payment, record payment_failed, leave the lead
  payment_requested. status pending: unchanged. status uncertain from the provider: raise
  ProviderUnavailable and change nothing.
- Only verify may mark a payment success or a lead paid.

Do not:
- Mark anything paid from a redirect, callback body or request parameter.
- Log or return any secret.
- Convert amounts to rupees; adapters do that.

Done when: the payment tests pass: not paid until a verified success, one payment request
per timeout, and a reconcile that recovers from both timeout cases.

Context to paste first: docs/P1_CONTEXT.md, docs/statuses-and-events.md,
docs/api-contract.md, plus the headers of the files listed under Depends on.
"""
