"""
backend/app/adapters/payments/mock.py
Owner: P1
Purpose: Mock payment provider. Used for the demo and tests.
Depends on: adapters.payments.base, schemas.payment, config
Used by: adapters.registry, tests, scripts/simulate_timeout.py

PROMPT:
Write only this file. MockPaymentAdapter keeps orders in memory and can simulate failures.

Requirements:
- In-memory dict order_ref -> {amount_paise, status, link_url, provider_ref}. calls: list
  of (method, order_ref) for tests to count.
- mode attribute and set_mode(mode) with values: 'ok'; 'timeout_after_create' (create_link
  stores the order but returns uncertain); 'timeout_before_create' (create_link stores
  nothing and returns uncertain); 'status_timeout' (get_status returns uncertain).
- create_link in ok mode: link_url = f'{settings.PUBLIC_BASE_URL}/mock-pay/{order_ref}'
  (served by api/mock_pay.py), status created. get_status: found False when the order is
  unknown, otherwise the stored status with found True.
- set_status(order_ref, status) lets a test or the demo move an order to success, failed
  or expired.

Do not:
- Call the network.
- Define routes; api/mock_pay.py serves the link page.

Done when: the idempotency and verification tests can drive every branch through set_mode
and set_status.

Context to paste first: docs/P1_CONTEXT.md, docs/statuses-and-events.md,
docs/api-contract.md, plus the headers of the files listed under Depends on.
"""
